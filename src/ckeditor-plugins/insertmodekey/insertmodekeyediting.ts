import type { ModelElement, ViewElement, ViewItem } from 'ckeditor5';
import { ClipboardPipeline, Plugin, toWidget } from 'ckeditor5';
import { h, render as renderVue } from 'vue';

import ModeKey from '@/components/ModeKey.vue';
import { resolveModeKeyInitialMartyriaStyle } from '@/models/InitialMartyriaResolver';
import type { InitialMartyriaStyle } from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { LayoutService } from '@/services/LayoutService';

import {
  createModeKeyElementFromModel,
  deserializeModeKeyAttributes,
  MODE_KEY_CLASS,
  MODE_KEY_DATA_ATTRIBUTE,
  MODE_KEY_MODEL_ATTRIBUTES,
  MODE_KEY_STYLE_CLIPBOARD_ATTRIBUTE,
  serializeModeKeyAttributes,
  toModeKeyEditorAttributes,
} from './modekeydata';

export const MODE_KEY_ELEMENT = 'modeKey';
const MODE_KEY_MOUNT_CLASS = 'neanes-ck-mode-key-mount';

function isModeKeyView(item: ViewItem): item is ViewElement {
  return item.is('element', 'span') && item.hasClass(MODE_KEY_CLASS);
}

export type InsertModeKeyConfig = {
  label?: string;
  getPageSetup?: () => PageSetup;
  getParagraphStyles?: () => ParagraphStyle[];
  getInitialMartyriaStyles?: () => InitialMartyriaStyle[];
  getDefaultInitialMartyriaStyleId?: () => string;
};

type MountedModeKey = {
  host: HTMLElement;
  modelElement: ModelElement;
};

export default class InsertModeKeyEditing extends Plugin {
  /**
   * Resolves the initial martyria style a key names across scores: `copy`
   * returns the payload for a custom style, `paste` the style the pasted key
   * names in this score.
   */
  public clipboard?: {
    copy(styleId: string): string | null;
    paste(styleId: string, payload: string | undefined): string | null;
  };
  private readonly mountedModeKeys = new Set<MountedModeKey>();
  private pruneTimer: number | null = null;

  static get pluginName() {
    return 'InsertModeKeyEditing';
  }

  init() {
    const editor = this.editor;

    editor.model.schema.register(MODE_KEY_ELEMENT, {
      isInline: true,
      isObject: true,
      allowWhere: '$text',
      allowAttributes: [...MODE_KEY_MODEL_ATTRIBUTES],
    });

    editor.conversion.for('dataDowncast').elementToElement({
      model: MODE_KEY_ELEMENT,
      view: (modelElement, { writer }) =>
        writer.createContainerElement('span', {
          class: MODE_KEY_CLASS,
          [MODE_KEY_DATA_ATTRIBUTE]: serializeModeKeyAttributes(
            Object.fromEntries(modelElement.getAttributes()),
          ),
        }),
    });

    editor.conversion.for('editingDowncast').elementToElement({
      model: MODE_KEY_ELEMENT,
      view: (modelElement, { writer }) => {
        const config = editor.config.get(
          'insertModeKey',
        ) as InsertModeKeyConfig;
        const mount = writer.createRawElement(
          'span',
          { class: MODE_KEY_MOUNT_CLASS },
          (host) => this.mountModeKey(host, modelElement),
        );
        const widget = writer.createContainerElement(
          'span',
          { class: MODE_KEY_CLASS },
          mount,
        );

        return toWidget(widget, writer, {
          label: config.label ?? '',
        });
      },
    });

    editor.conversion.for('upcast').elementToElement({
      view: {
        name: 'span',
        classes: MODE_KEY_CLASS,
      },
      model: (viewElement, { writer }) => {
        const attributes = deserializeModeKeyAttributes(
          viewElement.getAttribute(MODE_KEY_DATA_ATTRIBUTE),
        );

        return attributes == null
          ? null
          : writer.createElement(
              MODE_KEY_ELEMENT,
              toModeKeyEditorAttributes(attributes),
            );
      },
    });

    editor.editing.view.document.on('clipboardOutput', (_event, data) => {
      editor.editing.view.change((writer) => {
        for (const item of writer.createRangeIn(data.content).getItems()) {
          if (!isModeKeyView(item)) {
            continue;
          }
          const styleId = deserializeModeKeyAttributes(
            item.getAttribute(MODE_KEY_DATA_ATTRIBUTE),
          )?.initialMartyriaStyleId;
          const payload =
            typeof styleId === 'string'
              ? this.clipboard?.copy(styleId)
              : undefined;
          if (payload != null) {
            writer.setAttribute(
              MODE_KEY_STYLE_CLIPBOARD_ATTRIBUTE,
              payload,
              item,
            );
          }
        }
      });
    });

    editor.plugins
      .get(ClipboardPipeline)
      .on('inputTransformation', (_event, data) => {
        const modeKeys = [
          ...editor.editing.view.createRangeIn(data.content).getItems(),
        ].filter(isModeKeyView);
        const clipboard = this.clipboard;
        if (modeKeys.length === 0 || clipboard === undefined) {
          return;
        }
        editor.editing.view.change((writer) => {
          for (const modeKey of modeKeys) {
            const payload = modeKey.getAttribute(
              MODE_KEY_STYLE_CLIPBOARD_ATTRIBUTE,
            );
            writer.removeAttribute(MODE_KEY_STYLE_CLIPBOARD_ATTRIBUTE, modeKey);
            const attributes = deserializeModeKeyAttributes(
              modeKey.getAttribute(MODE_KEY_DATA_ATTRIBUTE),
            );
            const styleId = attributes?.initialMartyriaStyleId;
            if (typeof styleId !== 'string') {
              continue;
            }
            const pastedStyleId = clipboard.paste(styleId, payload);
            if (pastedStyleId !== styleId) {
              writer.setAttribute(
                MODE_KEY_DATA_ATTRIBUTE,
                serializeModeKeyAttributes({
                  ...attributes,
                  initialMartyriaStyleId: pastedStyleId,
                }),
                modeKey,
              );
            }
          }
        });
      });

    editor.model.document.on('change:data', () => {
      // Intentionally refresh every mounted key on each data change. Manual
      // testing with realistic documents found no typing lag. Do not replace
      // this with differ-based filtering without a measured regression; the
      // full refresh is the reliable correctness path for indirect changes.
      this.refreshMountedModeKeys();
      this.schedulePrune();
    });
  }

  refreshMountedModeKeys() {
    for (const mounted of this.mountedModeKeys) {
      if (mounted.host.isConnected) {
        this.renderModeKey(mounted);
      }
    }
  }

  override destroy() {
    if (this.pruneTimer != null) {
      window.clearTimeout(this.pruneTimer);
      this.pruneTimer = null;
    }

    for (const mounted of this.mountedModeKeys) {
      renderVue(null, mounted.host);
    }
    this.mountedModeKeys.clear();

    return super.destroy();
  }

  private mountModeKey(host: HTMLElement, modelElement: ModelElement) {
    const mounted = { host, modelElement };
    this.mountedModeKeys.add(mounted);
    this.renderModeKey(mounted);
  }

  private renderModeKey({ host, modelElement }: MountedModeKey) {
    const config = this.editor.config.get(
      'insertModeKey',
    ) as InsertModeKeyConfig;
    const pageSetup = config.getPageSetup?.();
    const initialMartyriaStyles = config.getInitialMartyriaStyles?.();
    const defaultInitialMartyriaStyleId =
      config.getDefaultInitialMartyriaStyleId?.();

    if (
      pageSetup == null ||
      initialMartyriaStyles == null ||
      defaultInitialMartyriaStyleId == null
    ) {
      renderVue(null, host);
      return;
    }

    const element = createModeKeyElementFromModel(modelElement);
    const resolvedStyle = resolveModeKeyInitialMartyriaStyle({
      element,
      paragraphStyles: config.getParagraphStyles?.() ?? [],
      initialMartyriaStyles,
      defaultInitialMartyriaStyleId,
    });
    const geometry = LayoutService.layoutModeKey(
      element,
      pageSetup,
      resolvedStyle,
      true,
    );
    element.width = geometry.width;

    renderVue(
      h(ModeKey, {
        element,
        pageSetup,
        embedded: true,
      }),
      host,
    );
  }

  private schedulePrune() {
    if (this.pruneTimer != null) {
      window.clearTimeout(this.pruneTimer);
    }

    this.pruneTimer = window.setTimeout(() => {
      this.pruneTimer = null;

      for (const mounted of this.mountedModeKeys) {
        if (!mounted.host.isConnected) {
          renderVue(null, mounted.host);
          this.mountedModeKeys.delete(mounted);
        }
      }
    });
  }
}
