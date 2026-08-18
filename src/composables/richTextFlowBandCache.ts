import { reactive } from 'vue';

import type { RichTextBoxElement } from '@/models/Element';

export interface FlowBandRenderCache {
  contents: string[];
  key: string;
  owner: symbol | null;
  ownerPriority: number;
}

// Module scope on purpose: every mounted fragment of a flowed rich text box is
// its own component instance, and all of them must see the same cache for
// their shared element so that the lowest-index mounted fragment measures the
// content once and the rest render their pre-cut bands from it. Declarations
// inside a component's <script setup> run per instance and cannot provide
// that sharing.
const flowBandRenderCaches = new WeakMap<
  RichTextBoxElement,
  FlowBandRenderCache
>();

export function getFlowBandRenderCache(element: RichTextBoxElement) {
  let cache = flowBandRenderCaches.get(element);

  if (cache == null) {
    // The cache is reactive so band re-renders and the measure-ownership
    // election flow through Vue's own dependency tracking across component
    // instances; a hand-rolled subscribe/notify layer could silently miss an
    // update and leave a continuation slice stale.
    cache = reactive<FlowBandRenderCache>({
      contents: [],
      key: '',
      owner: null,
      ownerPriority: Number.POSITIVE_INFINITY,
    });
    flowBandRenderCaches.set(element, cache);
  }

  return cache;
}
