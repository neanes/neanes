import type { ModelElement } from 'ckeditor5';
import { Plugin, toWidget } from 'ckeditor5';
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
  MODE_KEY_MODEL_ATTRIBUTES,
  serializeModeKeyAttributes,
  toModeKeyEditorAttributes,
} from './modekeydata';

export const MODE_KEY_ELEMENT = 'modeKey';
export const MODE_KEY_CLASS = 'neanes-ck-mode-key';
export const MODE_KEY_DATA_ATTRIBUTE = 'data-neanes-mode-key';
const MODE_KEY_MOUNT_CLASS = 'neanes-ck-mode-key-mount';

export type InsertModeKeyConfig = {
  pageSetup?: PageSetup;
  paragraphStyles?: ParagraphStyle[];
  initialMartyriaStyles?: InitialMartyriaStyle[];
  getPageSetup?: () => PageSetup;
  getParagraphStyles?: () => ParagraphStyle[];
  getInitialMartyriaStyles?: () => InitialMartyriaStyle[];
};

type MountedModeKey = {
  host: HTMLElement;
  modelElement: ModelElement;
};

export default class InsertModeKeyEditing extends Plugin {
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
          label: 'Initial martyria',
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

    editor.model.document.on('change:data', () => {
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
    const pageSetup = config?.getPageSetup?.() ?? config?.pageSetup;

    if (pageSetup == null) {
      renderVue(null, host);
      return;
    }

    const element = createModeKeyElementFromModel(modelElement);
    const resolvedStyle = resolveModeKeyInitialMartyriaStyle({
      element,
      pageSetup,
      paragraphStyles:
        config.getParagraphStyles?.() ?? config.paragraphStyles ?? [],
      initialMartyriaStyles:
        config.getInitialMartyriaStyles?.() ??
        config.initialMartyriaStyles ??
        [],
    });
    const geometry = LayoutService.layoutModeKey(
      element,
      pageSetup,
      resolvedStyle,
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
