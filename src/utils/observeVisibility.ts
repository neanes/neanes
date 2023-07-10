export function processOptions(value: any) {
  let options;

  if (typeof value === 'function') {
    // Simple options (callback-only)
    options = {
      callback: value,
    };
  } else {
    // Options object
    options = value;
  }
  return options;
}

interface ThrottleOptions {
  leading?: boolean | string | Function;
}

export function throttle(
  callback: Function,
  delay: number,
  options: ThrottleOptions = {},
) {
  let timeout: any = undefined;
  let lastState: any = undefined;
  let currentArgs: any[] = [];
  const throttled = (state: any, ...args: any[]) => {
    currentArgs = args;
    if (timeout && state === lastState) return;
    let leading = options.leading;

    if (typeof leading === 'function') {
      leading = leading(state, lastState);
    }
    if ((!timeout || state !== lastState) && leading) {
      callback(state, ...currentArgs);
    }
    lastState = state;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      callback(state, ...currentArgs);
      timeout = 0;
    }, delay);
  };

  throttled._clear = () => {
    clearTimeout(timeout);
    timeout = undefined;
  };
  return throttled;
}

export function deepEqual(val1: any, val2: any) {
  if (val1 === val2) return true;
  if (typeof val1 === 'object') {
    for (const key in val1) {
      if (!deepEqual(val1[key], val2[key])) {
        return false;
      }
    }
    return true;
  }
  return false;
}
