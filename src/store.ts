import Vue from 'vue';
import { Score } from '@/models/Score';
import { NoteElement, ScoreElement } from '@/models/Element';
import { EventBus } from './eventBus';
import { IpcRendererChannels } from './ipc/ipcChannels';

interface IState {
  score: Score;
  selectedElement: ScoreElement | null;
  selectedLyrics: NoteElement | null;
  elementToFocus: ScoreElement | null;
  zoom: number;
  currentFilePath: string | null;
  hasUnsavedChanges: boolean;
}

const state: IState = Vue.observable({
  score: new Score(),
  selectedElement: null,
  selectedLyrics: null,
  elementToFocus: null,
  zoom: 1,
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
    if (element != null) {
      this.setSelectedLyrics(null);
    }

    state.selectedElement = element;
  },

  setSelectedLyrics(element: NoteElement | null) {
    if (element != null) {
      this.setSelectedElement(null);
    }

    state.selectedLyrics = element;
  },

  setElementToFocus(element: ScoreElement | null) {
    state.elementToFocus = element;
  },

  setZoom(zoom: number) {
    state.zoom = zoom;
    document.documentElement.style.setProperty('--zoom', zoom.toString());
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
