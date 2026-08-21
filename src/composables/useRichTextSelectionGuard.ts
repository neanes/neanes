import { type Editor } from 'ckeditor5';
import {
  type MaybeRefOrGetter,
  onScopeDispose,
  type Ref,
  toValue,
  watch,
} from 'vue';

import {
  hideRichTextSelection,
  showRichTextSelection,
} from '@/ckeditor-plugins/richtextselection/richtextselection';
import { resolveActiveOrLastEditorForOwner } from '@/composables/useRichTextEditorRegistry';
import { useRichTextPortalRoot } from '@/composables/useRichTextPortalRoot';

/**
 * Coordinates focus and selection between CKEditor and the Reka-UI toolbar /
 * properties panel. Two independent layers:
 *
 * - **Focus zone** (`attachFocusZone`): registers the consumer's container and
 *   the shared dropdown portal root with the *current* editor's
 *   `editor.ui.focusTracker` so focus moving into the toolbar/portal does not
 *   read as an editor blur. Sticky and scoped to one editor at a time; mirrors
 *   how CKEditor itself registers its own balloons/dialogs.
 * - **Selection marker** (`beginSelectionGuard`/`endSelectionGuard`): shows a
 *   fake visual-selection marker over the model selection while a control is
 *   engaged (the real highlight is gone once the editable loses DOM focus),
 *   and restores editable focus when the control closes.
 */

// Maps an editor to the distinct consumer containers (toolbar / panel roots)
// tracked on it.
const zoneRegistrations = new WeakMap<Editor, Set<HTMLElement>>();

// The shared dropdown portal is a process-wide singleton (one DOM node reused
// by every toolbar and panel). It must be tracked on EXACTLY ONE editor's
// focus tracker at a time. An element with several sub-editors (multipanel
// left/center/right) has the toolbar and the panel as two independent
// focus-zone consumers, and when the active sub-editor changes they
// release/acquire independently -- so a per-editor refcount would briefly
// register the portal on both the old and the new editor at once, leaking one
// editor's focus zone into another. Tracking ownership globally and handing it
// over on a switch keeps the invariant structural instead of dependent on
// mount/unmount ordering.
let portalRegistration: {
  editor: Editor;
  root: HTMLElement;
  refcount: number;
} | null = null;

type MarkerSession = {
  // The editor the marker is currently shown on. Pinned when the first control
  // engages, so a later disengage hides the SAME editor even if the owner's
  // active sub-editor changed in between (a multipanel box shares one owner
  // across several sub-editors).
  editor: Editor;
  // How many controls are currently engaged for this owner (handoffs between
  // controls keep the marker up without flicker).
  engageCount: number;
  pendingFrame: number | null;
};

// Keyed by OWNER, not editor: `beginSelectionGuard`/`endSelectionGuard` are
// paired by the owner they are handed, so keying the session by owner
// guarantees a disengage resolves the same session the engage created --
// regardless of which sub-editor happens to be active at each moment. The
// session remembers which editor the marker is on (`editor` above).
const markerSessions = new WeakMap<object, MarkerSession>();

function isUsable(editor: Editor) {
  return editor.state !== 'destroyed';
}

function safeAddToFocusTracker(editor: Editor, element: HTMLElement) {
  if (!isUsable(editor)) {
    return;
  }

  try {
    editor.ui.focusTracker.add(element);
  } catch {
    // Already tracked -- our ref-counting should prevent this, but never throw.
  }
}

function safeRemoveFromFocusTracker(editor: Editor, element: HTMLElement) {
  if (!isUsable(editor)) {
    return;
  }

  try {
    editor.ui.focusTracker.remove(element);
  } catch {
    // Not tracked / tearing down.
  }
}

// Track the shared portal on `editor`, handing ownership over from whichever
// editor currently holds it. Ref-counted so the toolbar and panel of the same
// editor (two consumers) share one registration.
function acquirePortal(editor: Editor, root: HTMLElement) {
  if (portalRegistration != null && portalRegistration.editor === editor) {
    portalRegistration.refcount += 1;
    return;
  }

  if (portalRegistration != null) {
    // Single-owner invariant: drop the portal from the previous owner first.
    safeRemoveFromFocusTracker(
      portalRegistration.editor,
      portalRegistration.root,
    );
  }

  safeAddToFocusTracker(editor, root);
  portalRegistration = { editor, root, refcount: 1 };
}

function releasePortal(editor: Editor) {
  if (portalRegistration == null || portalRegistration.editor !== editor) {
    // Ownership already moved to another editor; nothing of ours to release.
    return;
  }

  portalRegistration.refcount -= 1;

  if (portalRegistration.refcount <= 0) {
    safeRemoveFromFocusTracker(
      portalRegistration.editor,
      portalRegistration.root,
    );
    portalRegistration = null;
  }
}

function acquireZone(
  editor: Editor,
  container: HTMLElement,
  portalRoot: HTMLElement | null,
) {
  let containers = zoneRegistrations.get(editor);

  if (containers == null) {
    containers = new Set();
    zoneRegistrations.set(editor, containers);
  }

  if (portalRoot != null) {
    acquirePortal(editor, portalRoot);
  }

  if (!containers.has(container)) {
    safeAddToFocusTracker(editor, container);
    containers.add(container);
  }
}

function releaseZone(
  editor: Editor,
  container: HTMLElement,
  portalRoot: HTMLElement | null,
) {
  const containers = zoneRegistrations.get(editor);

  if (containers == null) {
    return;
  }

  if (portalRoot != null) {
    releasePortal(editor);
  }

  if (containers.has(container)) {
    safeRemoveFromFocusTracker(editor, container);
    containers.delete(container);
  }

  if (containers.size === 0) {
    zoneRegistrations.delete(editor);
  }
}

/**
 * Keep the owner's current editor logically "focused" while the user interacts
 * with `containerRef` (a toolbar / properties-panel root) or the shared
 * dropdown portal. Must be called from a component setup scope.
 */
export function attachFocusZone(
  owner: MaybeRefOrGetter<object | null | undefined>,
  containerRef: Ref<HTMLElement | null | undefined>,
) {
  const portalRootRef = useRichTextPortalRoot();

  let tracked: {
    editor: Editor;
    container: HTMLElement;
    portalRoot: HTMLElement | null;
    offDestroy: () => void;
  } | null = null;

  function release() {
    if (tracked == null) {
      return;
    }

    releaseZone(tracked.editor, tracked.container, tracked.portalRoot);
    tracked.offDestroy();
    tracked = null;
  }

  function sync() {
    const editor = resolveActiveOrLastEditorForOwner(toValue(owner));
    const container = containerRef.value ?? null;

    if (editor == null || container == null || !isUsable(editor)) {
      release();
      return;
    }

    if (
      tracked != null &&
      tracked.editor === editor &&
      tracked.container === container
    ) {
      return;
    }

    release();

    const portalRoot = portalRootRef.value ?? null;
    acquireZone(editor, container, portalRoot);

    const onDestroy = () => {
      // The editor's focus tracker dies with it; just drop bookkeeping. Don't
      // touch the dead editor's tracker -- only clear our own pointers.
      zoneRegistrations.delete(editor);

      if (portalRegistration?.editor === editor) {
        portalRegistration = null;
      }

      tracked = null;
    };

    editor.once('destroy', onDestroy);

    tracked = {
      editor,
      container,
      portalRoot,
      offDestroy: () => editor.off('destroy', onDestroy),
    };
  }

  watch(
    [() => resolveActiveOrLastEditorForOwner(toValue(owner)), containerRef],
    sync,
    { immediate: true },
  );

  onScopeDispose(release);
}

/**
 * A toolbar control for `owner` has engaged (opened / received focus). Show the
 * fake selection marker over the editor's current model selection.
 */
export function beginSelectionGuard(owner: object | null | undefined) {
  const editor = resolveActiveOrLastEditorForOwner(owner);

  if (owner == null || editor == null || !isUsable(editor)) {
    return;
  }

  let session = markerSessions.get(owner);

  if (session == null) {
    session = { editor, engageCount: 0, pendingFrame: null };
    markerSessions.set(owner, session);
  } else if (session.editor !== editor) {
    // The active sub-editor changed while a control was already engaged; move
    // the marker to the new editor so the old one is not left highlighted.
    hideRichTextSelection(session.editor);
    session.editor = editor;
  }

  session.engageCount += 1;

  if (session.pendingFrame != null) {
    cancelAnimationFrame(session.pendingFrame);
    session.pendingFrame = null;
  }

  showRichTextSelection(editor);
}

/**
 * A toolbar control for `owner` has disengaged (closed / lost focus). Hide the
 * marker and, when appropriate, restore focus to the editable.
 *
 * Deferred one frame purely to COALESCE control-to-control handoffs: a
 * `beginSelectionGuard` arriving immediately after (the user moving from one
 * control straight to the next) cancels the pending frame, so the marker stays
 * up instead of flickering. The defer is NOT a race against the closing
 * overlay's own focus handling -- focus correctness comes from
 * `tryRefocusEditable` + `isInOwnFocusZone`, which reclaim the editable
 * wherever the overlay parked focus (e.g. Reka returns a combobox's focus to
 * its trigger, which sits inside a tracked zone container).
 */
export function endSelectionGuard(
  owner: object | null | undefined,
  options: { refocus?: boolean } = {},
) {
  if (owner == null) {
    return;
  }

  const session = markerSessions.get(owner);

  if (session == null) {
    return;
  }

  session.engageCount = Math.max(0, session.engageCount - 1);

  if (session.engageCount > 0) {
    return;
  }

  // Hide and refocus the editor the marker was actually shown on, captured at
  // engage time -- not whatever is active now, which may have changed.
  const editor = session.editor;
  const refocus = options.refocus ?? true;

  if (session.pendingFrame != null) {
    cancelAnimationFrame(session.pendingFrame);
  }

  session.pendingFrame = requestAnimationFrame(() => {
    session.pendingFrame = null;

    if (session.engageCount > 0) {
      // Re-engaged before the frame ran (control-to-control handoff); keep the
      // session and its marker up.
      return;
    }

    if (isUsable(editor)) {
      if (refocus) {
        tryRefocusEditable(editor);
      }

      hideRichTextSelection(editor);
    }

    // Engagement is fully over -- drop the session so it stops pinning `editor`.
    markerSessions.delete(owner);
  });
}

/**
 * True if `node` is inside this editor's zone: a registered container or the
 * shared dropdown portal.
 */
function isInOwnFocusZone(editor: Editor, node: Node) {
  const containers = zoneRegistrations.get(editor);

  if (containers != null) {
    for (const container of containers) {
      if (container.contains(node)) {
        return true;
      }
    }
  }

  // The shared dropdown portal is also part of the zone, but only for the
  // editor that currently owns it. A closing dropdown (Combobox/Select) keeps
  // focus on the selected option -- which lives in the portal -- at the moment
  // `end({ refocus: true })` runs (engageCount is already 0). Counting the
  // portal here lets `tryRefocusEditable` recognize that focus is parked on
  // our own chrome and pull it back to the editable, instead of mistaking it
  // for a deliberate focus move outside the editor.
  if (
    portalRegistration != null &&
    portalRegistration.editor === editor &&
    portalRegistration.root.contains(node)
  ) {
    return true;
  }

  return false;
}

/**
 * Restore focus to the editable when the closing overlay orphaned focus -- to
 * `<body>`/null, or onto one of our own controls (e.g. a trigger that Reka
 * refocused on close, which lives inside a registered zone container). If the
 * user deliberately placed focus in the editable (clicked text) or genuinely
 * outside the editor's focus zone, respect that target.
 */
function tryRefocusEditable(editor: Editor) {
  const editableElement = editor.editing.view.getDomRoot()!;
  const active = document.activeElement;

  if (active != null && editableElement.contains(active)) {
    return;
  }

  if (
    active != null &&
    active !== document.body &&
    !isInOwnFocusZone(editor, active)
  ) {
    return;
  }

  editor.editing.view.focus();
}
