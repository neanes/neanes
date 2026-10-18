import { AutomationError } from './errors';

export type EditorBusyState =
  | { reason: 'loading' }
  | { reason: 'workspace_closing'; documentIds: string[] }
  | { reason: 'dialog_open'; dialog: string }
  | { reason: 'printing' }
  | { reason: 'native_save' };

export function editorBusyError(state: EditorBusyState) {
  const messages: Record<EditorBusyState['reason'], string> = {
    loading:
      'The editor is loading. Wait for loading to finish before retrying.',
    workspace_closing:
      'The editor is closing a document. Complete any save or discard prompt before retrying.',
    dialog_open:
      'An editor dialog is open. Close the dialog before retrying document operations.',
    printing:
      'The editor is rendering a print or export job. Wait for it to finish before retrying.',
    native_save:
      'A native save operation is pending. Complete any save dialog before retrying.',
  };
  return new AutomationError({
    code: 'EDITOR_BUSY',
    message: messages[state.reason],
    details: { ...state },
  });
}
