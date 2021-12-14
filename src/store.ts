import Vue from 'vue';
import { Score } from '@/models/Score';
import { ScoreElement } from '@/models/Element';
import { PageSetup } from './models/PageSetup';

interface IState {
  score: Score;
  selectedElement: ScoreElement | null;
  elementToFocus: ScoreElement | null;
}

const state: IState = Vue.observable({
  score: new Score(),
  selectedElement: null,
  elementToFocus: null,
});

const getters = {
  get elements() {
    return state.score != null ? state.score.staff.elements : [];
  },

  get selectedElementIndex() {
    return state.selectedElement != null ? this.elements.indexOf(state.selectedElement): -1;
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

  removeElement(element: ScoreElement) {
    const index = state.score.staff.elements.indexOf(element);
    state.score.staff.elements.splice(index, 1);
  }
};

const store = {
  state,
  getters,
  mutations
};

export { store };