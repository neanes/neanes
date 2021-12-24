import Vue from 'vue';
import { Score } from '@/models/Score';
import { ScoreElement } from '@/models/Element';
import { PageSetup } from './models/PageSetup';
import { EventBus } from './eventBus';
import { IpcRendererChannels } from './ipc/ipcChannels';

interface IState {
  score: Score;
  selectedElement: ScoreElement | null;
  elementToFocus: ScoreElement | null;
  currentFilePath: string | null;
  hasUnsavedChanges: boolean;
}

const state: IState = Vue.observable({
  score: new Score(),
  selectedElement: null,
  elementToFocus: null,
  currentFilePath: null,
  hasUnsavedChanges: false,
});

const getters = {
  get elements() {
    return state.score != null ? state.score.staff.elements : [];
  },

  get selectedElementIndex() {
    return state.selectedElement != null
      ? this.elements.indexOf(state.selectedElement)
      : -1;
  },

  get windowTitle() {
    const unsavedChangesMarker = state.hasUnsavedChanges ? '*' : '';

    if (state.currentFilePath != null) {
      const fileName = state.currentFilePath.replace(/^.*[\\/]/, '');
      return `${unsavedChangesMarker}${fileName} - ${process.env.VUE_APP_TITLE}`;
    } else {
      return `${unsavedChangesMarker}Untitled 1 - ${process.env.VUE_APP_TITLE}`;
    }
  },
};

const mutations = {
  setScore(score: Score) {
    state.score = score;
  },

  setSelectedElement(element: ScoreElement | null) {
    state.selectedElement = element;
  },

  setElementToFocus(element: ScoreElement | null) {
    state.elementToFocus = element;
  },

  setCurrentFilepath(path: string | null) {
    state.currentFilePath = path;

    if (path != null) {
      localStorage.setItem('filePath', path);
    } else {
      localStorage.removeItem('filePath');
    }

    window.document.title = getters.windowTitle;

    EventBus.$emit(IpcRendererChannels.SetFilePath, path);
  },

  setHasUnsavedChanges(hasUnsavedChanges: boolean) {
    state.hasUnsavedChanges = hasUnsavedChanges;
    localStorage.setItem('hasUnsavedChanges', hasUnsavedChanges.toString());
    window.document.title = getters.windowTitle;
    EventBus.$emit(IpcRendererChannels.SetHasUnsavedChanges, hasUnsavedChanges);
  },

  removeElement(element: ScoreElement) {
    const index = state.score.staff.elements.indexOf(element);
    state.score.staff.elements.splice(index, 1);
  },
};

const store = {
  state,
  getters,
  mutations,
};

export { store };
