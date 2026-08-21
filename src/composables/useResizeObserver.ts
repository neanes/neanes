import { onBeforeUnmount, shallowRef } from 'vue';

export function useResizeObserver() {
  const observer = shallowRef<ResizeObserver | null>(null);

  function disconnect() {
    observer.value?.disconnect();
    observer.value = null;
  }

  function observe(
    targets: Element | Element[],
    callback: ResizeObserverCallback,
  ) {
    disconnect();

    observer.value = new ResizeObserver(callback);

    const targetList = Array.isArray(targets) ? targets : [targets];
    for (const target of targetList) {
      observer.value.observe(target);
    }
  }

  onBeforeUnmount(disconnect);

  return {
    disconnect,
    observe,
    observer,
  };
}
