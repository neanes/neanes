import mitt from 'mitt';
const emitter = mitt();
export const EventBus = {
  $on: (eventName: string, func: (...args: any[]) => unknown) =>
    emitter.on(eventName, func),
  $off: (eventName: string, func: (...args: any[]) => unknown) =>
    emitter.off(eventName, func),
  $emit: (type: string, event?: unknown) => emitter.emit(type, event),
};
