import {
  type BaseEvent,
  type Command,
  type Editor,
  type EditorDestroyEvent,
  type Emitter,
  type GetCallback,
  type ViewDocumentFocusEvent,
} from 'ckeditor5';
import {
  computed,
  type MaybeRefOrGetter,
  onScopeDispose,
  reactive,
  type Ref,
  shallowRef,
  toValue,
  watch,
} from 'vue';

export type EditorCommandObservableState = {
  value: unknown;
  isEnabled: boolean;
  exists: boolean;
  properties: Record<string, unknown>;
};

type ObservablePropertyChangeEvent<
  TTarget,
  TName extends keyof TTarget & string,
> = {
  name: `change:${TName}`;
  args: [name: TName, value: TTarget[TName], oldValue: TTarget[TName]];
};

type UnknownObservablePropertyChangeEvent<TName extends string> = {
  name: `change:${TName}`;
  args: [name: TName, value: unknown, oldValue: unknown];
};

const registeredEditors = new Set<Editor>();
const editorOwners = new WeakMap<Editor, object>();
const lastActiveEditorsByOwner = new WeakMap<object, Editor>();
const editorCleanups = new WeakMap<Editor, () => void>();

const activeEditor = shallowRef<Editor | null>(null);
const activeEditorOwner = shallowRef<object | null>(null);

export function registerEditor(editor: Editor, owner?: object) {
  const previousOwner = editorOwners.get(editor);

  if (
    previousOwner != null &&
    previousOwner !== owner &&
    lastActiveEditorsByOwner.get(previousOwner) === editor
  ) {
    lastActiveEditorsByOwner.delete(previousOwner);
  }

  if (owner != null) {
    editorOwners.set(editor, owner);

    if (activeEditor.value === editor) {
      activeEditorOwner.value = owner;
      lastActiveEditorsByOwner.set(owner, editor);
    }
  }

  if (registeredEditors.has(editor)) {
    return;
  }

  registeredEditors.add(editor);

  const viewDocument = editor.editing.view.document;
  const cleanups: Array<() => void> = [];
  const addCleanup = (cleanup: () => void) => cleanups.push(cleanup);
  const onFocus = () => setActiveEditor(editor);
  const onFocusChanged = (
    _event: unknown,
    _name: string,
    isFocused: boolean,
  ) => {
    if (isFocused) {
      setActiveEditor(editor);
    } else {
      clearActiveEditorForEditor(editor);
    }
  };
  const onDestroy = () => unregisterEditor(editor);

  listenToEditorEvent<ViewDocumentFocusEvent>(
    viewDocument,
    'focus',
    onFocus,
    addCleanup,
  );
  listenToObservablePropertyChange(
    editor.ui.focusTracker,
    'isFocused',
    onFocusChanged,
    addCleanup,
  );
  listenToEditorEvent<EditorDestroyEvent>(
    editor,
    'destroy',
    onDestroy,
    addCleanup,
  );

  editorCleanups.set(editor, () => cleanups.forEach((cleanup) => cleanup()));
}

export function unregisterEditor(editor: Editor) {
  if (!registeredEditors.has(editor)) {
    return;
  }

  registeredEditors.delete(editor);
  editorCleanups.get(editor)!();
  editorCleanups.delete(editor);

  const owner = editorOwners.get(editor);

  if (owner != null && lastActiveEditorsByOwner.get(owner) === editor) {
    lastActiveEditorsByOwner.delete(owner);
  }

  editorOwners.delete(editor);

  if (activeEditor.value === editor) {
    clearActiveEditor();
  }
}

export function clearActiveEditor(owner?: object | null) {
  if (owner != null && activeEditorOwner.value !== owner) {
    return;
  }

  activeEditor.value = null;
  activeEditorOwner.value = null;
}

function clearActiveEditorForEditor(editor: Editor) {
  if (activeEditor.value !== editor) {
    return;
  }

  clearActiveEditor();
}

export function isActiveEditorForOwner(owner: object) {
  return activeEditor.value != null && activeEditorOwner.value === owner;
}

function getActiveEditorForOwner(owner: object | null | undefined) {
  return owner != null && activeEditorOwner.value === owner
    ? activeEditor.value
    : null;
}

export function useActiveEditorForOwner(
  owner: MaybeRefOrGetter<object | null | undefined>,
) {
  return computed(() => getActiveEditorForOwner(toValue(owner)));
}

/**
 * Resolve the editor for an owner, preferring the currently active editor but falling
 * back to the last one that was active for that owner. Used by the selection guard so
 * it can capture the editor at the moment a toolbar control engages, even if a
 * transient blur has already cleared `activeEditor`.
 */
export function resolveActiveOrLastEditorForOwner(
  owner: object | null | undefined,
) {
  return getActiveEditorForOwner(owner) ?? getLastActiveEditorForOwner(owner);
}

export function focusLastActiveEditorForOwner(
  owner: object | null | undefined,
) {
  const editor = getLastActiveEditorForOwner(owner);

  if (editor == null) {
    return false;
  }

  editor.editing.view.focus();
  return true;
}

export function execForOwner(
  owner: object | null | undefined,
  commandName: string,
  ...args: unknown[]
) {
  const editor = getActiveEditorForOwner(owner);

  if (editor == null) {
    return false;
  }

  editor.execute(commandName, ...args);
  return true;
}

export function useEditorCommandStates(
  editorRef: Ref<Editor | null>,
  commandNames: string[],
) {
  const states = reactive({}) as Record<string, EditorCommandObservableState>;

  for (const commandName of commandNames) {
    states[commandName] = createEditorCommandState();
  }

  watchEditorCommandStates(editorRef, states);

  return states;
}

export function useEditorCommandObservableState(
  editorRef: Ref<Editor | null>,
  commandName: string,
  propertyNames: string[],
) {
  const state = reactive(createEditorCommandState());

  initializeCommandProperties(state, propertyNames);
  watchEditorCommandStates(
    editorRef,
    { [commandName]: state },
    { [commandName]: propertyNames },
  );

  return state;
}

function setActiveEditor(editor: Editor) {
  if (!registeredEditors.has(editor)) {
    return;
  }

  activeEditor.value = editor;
  activeEditorOwner.value = editorOwners.get(editor) ?? null;

  if (activeEditorOwner.value != null) {
    lastActiveEditorsByOwner.set(activeEditorOwner.value, editor);
  }
}

function getLastActiveEditorForOwner(owner: object | null | undefined) {
  if (owner == null) {
    return null;
  }

  if (activeEditor.value != null) {
    return activeEditorOwner.value === owner ? activeEditor.value : null;
  }

  const editor = lastActiveEditorsByOwner.get(owner) ?? null;

  return editor != null &&
    registeredEditors.has(editor) &&
    editorOwners.get(editor) === owner
    ? editor
    : null;
}

function watchEditor(
  editorRef: Ref<Editor | null>,
  callback: (
    editor: Editor | null,
    addCleanup: (cleanup: () => void) => void,
  ) => void,
) {
  let cleanups: Array<() => void> = [];

  function clearListeners() {
    for (const cleanup of cleanups) {
      cleanup();
    }

    cleanups = [];
  }

  watch(
    editorRef,
    (editor) => {
      clearListeners();
      callback(editor, (cleanup) => cleanups.push(cleanup));
    },
    { immediate: true },
  );

  onScopeDispose(clearListeners);
}

function listenToEditorEvent<TEvent extends BaseEvent>(
  target: Emitter,
  event: TEvent['name'],
  callback: GetCallback<TEvent>,
  addCleanup: (cleanup: () => void) => void,
) {
  target.on<TEvent>(event, callback);
  addCleanup(() => target.off(event, callback));
}

function listenToObservablePropertyChange<
  TTarget extends Emitter,
  TName extends keyof TTarget & string,
>(
  target: TTarget,
  propertyName: TName,
  callback: GetCallback<ObservablePropertyChangeEvent<TTarget, TName>>,
  addCleanup: (cleanup: () => void) => void,
) {
  listenToEditorEvent<ObservablePropertyChangeEvent<TTarget, TName>>(
    target,
    `change:${propertyName}`,
    callback,
    addCleanup,
  );
}

function listenToUnknownObservablePropertyChange<TName extends string>(
  target: Emitter,
  propertyName: TName,
  callback: GetCallback<UnknownObservablePropertyChangeEvent<TName>>,
  addCleanup: (cleanup: () => void) => void,
) {
  listenToEditorEvent<UnknownObservablePropertyChangeEvent<TName>>(
    target,
    `change:${propertyName}`,
    callback,
    addCleanup,
  );
}

function createEditorCommandState(): EditorCommandObservableState {
  return {
    value: undefined,
    isEnabled: false,
    exists: false,
    properties: {},
  };
}

function watchEditorCommandStates(
  editorRef: Ref<Editor | null>,
  states: Record<string, EditorCommandObservableState>,
  propertyNamesByCommand: Record<string, string[]> = {},
) {
  const stateEntries = Object.entries(states);

  watchEditor(editorRef, (editor, addCleanup) => {
    for (const [commandName, state] of stateEntries) {
      resetCommandState(state, propertyNamesByCommand[commandName] ?? []);
    }

    if (editor == null) {
      return;
    }

    for (const [commandName, state] of stateEntries) {
      const command = editor.commands.get(commandName);

      if (command == null) {
        continue;
      }

      const propertyNames = propertyNamesByCommand[commandName] ?? [];
      const syncAll = () => syncCommandState(command, state, propertyNames);

      syncAll();
      listenToObservablePropertyChange(command, 'value', syncAll, addCleanup);
      listenToObservablePropertyChange(
        command,
        'isEnabled',
        syncAll,
        addCleanup,
      );

      for (const propertyName of propertyNames) {
        listenToUnknownObservablePropertyChange(
          command,
          propertyName,
          syncAll,
          addCleanup,
        );
      }
    }
  });
}

function resetCommandState(
  state: EditorCommandObservableState,
  propertyNames: string[],
) {
  state.value = undefined;
  state.isEnabled = false;
  state.exists = false;

  initializeCommandProperties(state, propertyNames);
}

function initializeCommandProperties(
  state: EditorCommandObservableState,
  propertyNames: string[],
) {
  for (const propertyName of propertyNames) {
    state.properties[propertyName] = undefined;
  }
}

function syncCommandState(
  command: Command,
  state: EditorCommandObservableState,
  propertyNames: string[] = [],
) {
  state.value = command.value;
  state.isEnabled = command.isEnabled;
  state.exists = true;

  for (const propertyName of propertyNames) {
    state.properties[propertyName] = Reflect.get(command, propertyName);
  }
}
