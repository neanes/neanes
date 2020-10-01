import Vue from 'vue';
import { Score } from '@/models/Score';

interface IStore {
  score: Score;
}

export const store: IStore = Vue.observable({
  score: new Score()
});

export const mutations = {
  setScore(score: Score) {
    store.score = score;
  }
};