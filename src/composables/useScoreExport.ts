import { getFontEmbedCSS, toPng } from 'html-to-image';
import { inject, nextTick } from 'vue';

import {
  ExportAsLatexSettings,
  ExportAsMusicXmlSettings,
  ExportAsPngSettings,
  ExportFormat,
} from '@/components/ExportDialog.vue';
import { ExportWorkspaceAsImageReplyArgs } from '@/ipc/ipcChannels';
import { ElementType, ScoreElement } from '@/models/Element';
import { Workspace } from '@/models/Workspace';
import { ByzHtmlExporter } from '@/services/integration/ByzHtmlExporter';
import { LatexExporter } from '@/services/integration/LatexExporter';
import { MusicXmlExporter } from '@/services/integration/MusicXmlExporter';
import { IIpcService } from '@/services/ipc/IIpcService';
import { IpcService } from '@/services/ipc/IpcService';
import { useEditorStore } from '@/stores/useEditorStore';
import { getFileName } from '@/utils/filenames';

import { useFocus } from './useFocus';
import { useSelection } from './useSelection';

export function useScoreExport() {
  const editor = useEditorStore();
  const { isSelected } = useSelection();
  const { blurActiveElement, focusElement } = useFocus();

  const ipcService = inject<IIpcService>('ipcService', new IpcService());
  const latexExporter = inject<LatexExporter>(
    'latexExporter',
    new LatexExporter(),
  );
  const musicXmlExporter = inject<MusicXmlExporter>(
    'musicXmlExporter',
    new MusicXmlExporter(),
  );
  const byzHtmlExporter = inject<ByzHtmlExporter>(
    'byzHtmlExporter',
    new ByzHtmlExporter(),
  );

  function closeExportDialog() {
    editor.exportDialogIsOpen = false;
  }

  async function onFileMenuPrint() {
    editor.printMode = true;

    // Blur the active element so that focus outlines and
    // blinking cursors don't show up in the printed page
    const activeElement = blurActiveElement();

    const previousTitle = window.document.title;
    window.document.title = getFileName(
      editor.selectedWorkspace as Workspace,
      false,
    );

    nextTick(async () => {
      await ipcService.printWorkspace(editor.selectedWorkspace as Workspace);
      editor.printMode = false;
      window.document.title = previousTitle;

      // Re-focus the active element
      focusElement(activeElement);
    });
  }

  async function onFileMenuExportAsPdf() {
    editor.printMode = true;

    // Blur the active element so that focus outlines and
    // blinking cursors don't show up in the printed page
    const activeElement = blurActiveElement();

    const previousTitle = window.document.title;
    window.document.title = getFileName(
      editor.selectedWorkspace as Workspace,
      false,
    );

    await nextTick();
    await ipcService.exportWorkspaceAsPdf(
      editor.selectedWorkspace as Workspace,
    );
    editor.printMode = false;
    window.document.title = previousTitle;

    // Re-focus the active element
    focusElement(activeElement);
  }

  async function onFileMenuExportAsImage() {
    editor.exportFormat = ExportFormat.PNG;
    editor.exportDialogIsOpen = true;
  }

  async function exportAsPng(args: ExportAsPngSettings) {
    let reply: ExportWorkspaceAsImageReplyArgs;

    try {
      reply = await ipcService.exportWorkspaceAsImage(
        editor.selectedWorkspace as Workspace,
        'png',
      );

      if (!reply.success) {
        return;
      }
    } catch (error) {
      console.error(error);
      return;
    }

    editor.printMode = true;
    editor.exportInProgress = true;

    // Blur the active element so that focus outlines and
    // blinking cursors don't show up in the printed page
    const activeElement = blurActiveElement();

    nextTick(async () => {
      try {
        const pages = editor.pagesRef as HTMLElement[];

        if (pages.length > 0) {
          const fontEmbedCSS = await getFontEmbedCSS(pages[0]);

          let pageNumber = 1;

          for (const page of pages) {
            const options = {
              fontEmbedCSS,
              pixelRatio: args.dpi / 96,
              style: { margin: '0' },
            } as any;

            if (args.transparentBackground) {
              options.style.backgroundColor = 'transparent';
            }

            let data = await toPng(page, options);

            if (data != null) {
              const fileName = reply.filePath.replace(
                /\.png$/,
                `-${pageNumber++}.png`,
              );

              data = data.replace(/^data:image\/png;base64,/, '');

              if (!(await ipcService.exportPageAsImage(fileName, data))) {
                break;
              }
            }
          }
        }

        if (args.openFolder) {
          await ipcService.showItemInFolder(
            reply.filePath.replace(/\.png$/, '-1.png'),
          );
        }
      } catch (error) {
        console.error(error);
      } finally {
        editor.printMode = false;
        editor.exportInProgress = false;
        closeExportDialog();
        // Re-focus the active element
        focusElement(activeElement);
      }
    });
  }

  async function onFileMenuExportAsHtml() {
    await ipcService.exportWorkspaceAsHtml(
      editor.selectedWorkspace as Workspace,
      byzHtmlExporter.exportScore(editor.score),
    );
  }

  function onFileMenuExportAsMusicXml() {
    editor.exportFormat = ExportFormat.MusicXml;
    editor.exportDialogIsOpen = true;
  }

  function onFileMenuExportAsLatex() {
    editor.exportFormat = ExportFormat.Latex;
    editor.exportDialogIsOpen = true;
  }

  async function exportAsMusicXml(args: ExportAsMusicXmlSettings) {
    await ipcService.exportWorkspaceAsMusicXml(
      editor.selectedWorkspace as Workspace,
      musicXmlExporter.export(editor.score, args.options),
      args.compressed,
      args.openFolder,
    );

    closeExportDialog();
  }

  async function exportAsLatex(args: ExportAsLatexSettings) {
    await ipcService.exportWorkspaceAsLatex(
      editor.selectedWorkspace as Workspace,
      JSON.stringify(
        latexExporter.export(
          editor.pages,
          editor.score.pageSetup,
          args.options,
        ),
        null,
        2,
      ),
    );

    closeExportDialog();
  }

  function onFileMenuCopyAsHtml() {
    let elements: ScoreElement[] = [];

    if (editor.selectionRange != null) {
      elements = editor.elements.filter(
        (x) => x.elementType != ElementType.Empty && isSelected(x),
      );
    } else if (editor.selectedElement != null) {
      elements = [editor.selectedElement];
    } else if (editor.selectedLyrics != null) {
      elements = [editor.selectedLyrics];
    }

    const html = byzHtmlExporter.exportElements(
      elements,
      editor.score.pageSetup,
      0,
      true,
    );

    navigator.clipboard.writeText(html);
  }

  return {
    onFileMenuPrint,
    onFileMenuExportAsPdf,
    onFileMenuExportAsImage,
    exportAsPng,
    onFileMenuExportAsHtml,
    onFileMenuExportAsMusicXml,
    onFileMenuExportAsLatex,
    exportAsMusicXml,
    exportAsLatex,
    onFileMenuCopyAsHtml,
    closeExportDialog,
  };
}
