// Release the caller even when an underlying OS operation cannot be interrupted.
// Operations must check the supplied signal before continuing after each await.
export async function withAbortDeadline<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
  timeoutMs = 60_000,
): Promise<T> {
  if (signal.aborted) {
    throw new Error('EXPORT_CANCELLED');
  }
  const controller = new AbortController();
  const cancel = () => controller.abort(new Error('EXPORT_CANCELLED'));
  signal.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(
    () => controller.abort(new Error('AUTOMATION_TIMEOUT')),
    timeoutMs,
  );
  let rejectAbort: () => void;
  const aborted = new Promise<never>((_resolve, reject) => {
    rejectAbort = () => reject(controller.signal.reason);
    controller.signal.addEventListener('abort', rejectAbort, { once: true });
  });
  try {
    return await Promise.race([
      Promise.resolve().then(() => {
        controller.signal.throwIfAborted();
        return operation(controller.signal);
      }),
      aborted,
    ]);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
    controller.signal.removeEventListener('abort', rejectAbort!);
  }
}
