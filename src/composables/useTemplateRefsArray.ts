import { onBeforeUpdate, ShallowRef } from 'vue';

export function useTemplateRefsArray(refs: ShallowRef) {
  function setRefByIndex(index: number) {
    return function setRefByIndexInner(el: unknown) {
      if (el) {
        refs.value[index] = el;
      }
    };
  }

  onBeforeUpdate(() => {
    refs.value = [];
  });

  return {
    setRefByIndex,
  };
}
