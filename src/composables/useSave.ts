import { debounce } from 'throttle-debounce';
import { toRaw } from 'vue';

import { Workspace, WorkspaceLocalStorage } from '@/models/Workspace';
import { LayoutService } from '@/services/LayoutService';
import { SaveService } from '@/services/SaveService';
import { useEditorStore } from '@/stores/useEditorStore';
import { isElectron } from '@/utils/isElectron';

export function useSave() {
  const editor = useEditorStore();

  const isDevelopment: boolean = import.meta.env.DEV;
  const isBrowser: boolean = !isElectron();

  function save(markUnsavedChanges: boolean = true) {
    if (markUnsavedChanges) {
      editor.selectedWorkspace.hasUnsavedChanges = true;
    }

    // Save the indexes of the visible pages
    const visiblePages = editor.pages
      .map((_, i) => i)
      .filter((i) => editor.pages[i].isVisible);

    const pages = LayoutService.processPages(
      toRaw(editor.selectedWorkspace) as Workspace,
    );

    // Set page visibility for the newly processed pages
    pages.forEach((x, index) => (x.isVisible = visiblePages.includes(index)));

    // Only re-render elements that are visible and that have been updated by processPages
    pages
      .filter((x) => x.isVisible)
      .forEach((page) => {
        page.lines.forEach((line) =>
          line.elements
            .filter((x) => x.updated)
            .forEach((element) => {
              element.keyHelper++;
            }),
        );
      });

    // Re-render headers and footers if they changed
    editor.score.headersAndFooters
      .filter((x) => x.updated)
      .forEach((element) => {
        element.keyHelper++;
      });

    editor.pages = pages;

    // If using the browser, save the workspace to local storage
    if (isBrowser) {
      const workspaceLocalStorage = {
        id: editor.selectedWorkspace.id,
        score: JSON.stringify(SaveService.SaveScoreToJson(editor.score)),
        filePath: editor.currentFilePath,
        tempFileName: editor.selectedWorkspace.tempFileName,
        hasUnsavedChanges: editor.selectedWorkspace.hasUnsavedChanges,
      } as WorkspaceLocalStorage;

      localStorage.setItem(
        `workspace-${editor.selectedWorkspace.id}`,
        JSON.stringify(workspaceLocalStorage),
      );
    } else if (isDevelopment) {
      localStorage.setItem(
        'score',
        JSON.stringify(SaveService.SaveScoreToJson(editor.score)),
      );

      if (editor.currentFilePath != null) {
        localStorage.setItem('filePath', editor.currentFilePath);
      } else {
        localStorage.removeItem('filePath');
      }

      localStorage.setItem(
        'hasUnsavedChanges',
        editor.selectedWorkspace.hasUnsavedChanges.toString(),
      );
    }
  }

  const saveDebounced = debounce(250, save);

  return { save, saveDebounced };
}
