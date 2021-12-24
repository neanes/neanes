import Vue from 'vue';
import { Score } from '@/models/Score';
import { ScoreElement } from '@/models/Element';
import { PageSetup } from './models/PageSetup';

interface IState {
  score: Score;
  selectedElement: ScoreElement | null;
  elementToFocus: ScoreElement | null;
  currentFilePath: string | null;
}

const state: IState = Vue.observable({
  score: new Score(),
  selectedElement: null,
  elementToFocus: null,
  currentFilePath: null,
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
    if (path != null) {
      localStorage.setItem('filePath', path);
      const fileName = path.replace(/^.*[\\/]/, '');
      window.document.title = `${fileName} - ${process.env.VUE_APP_TITLE}`;
    } else {
      localStorage.removeItem('filePath');
      window.document.title = `Untitled 1 - ${process.env.VUE_APP_TITLE}`;
    }
    state.currentFilePath = path;
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
