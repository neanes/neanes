import { type Ref, toRaw } from 'vue';

import type { DropCapElement, NoteElement } from '@/models/Element';
import type { Staff } from '@/models/Staff';
import type { Workspace } from '@/models/Workspace';
import { createNoteUpdateCommand } from '@/services/elementEditing';
import {
  type Command,
  CommandFactory,
} from '@/services/history/CommandService';
import type { LyricService } from '@/services/LyricService';

export function useStaffLyrics(
  workspaceRef: Ref<Workspace>,
  lyricService: LyricService,
  delay: number,
  updateDisplayedLyrics: (note: NoteElement, lyrics: string) => void,
  save: () => void,
  persistRecovery: (workspace: Workspace) => void,
) {
  const noteElementCommandFactory = new CommandFactory<NoteElement>(
    createNoteUpdateCommand,
  );
  const dropCapCommandFactory = new CommandFactory<DropCapElement>();
  const pendingLyricsAssignmentTimers = new Map<
    string,
    { timer: number; staff: Staff }
  >();
  function updateLyricsLocked(locked: boolean) {
    workspaceRef.value.updateLyricsLocked(
      locked,
      workspaceRef.value.activeStaff,
    );
  }

  function updateStaffLyrics(staffLyrics: string) {
    const workspace = workspaceRef.value;

    if (workspace.activeStaff.lyrics.text === staffLyrics) {
      return;
    }
    workspace.updateStaffLyrics(staffLyrics, workspace.activeStaff);
    scheduleLyricsAssignment(workspace);
  }

  function scheduleLyricsAssignment(workspace: Workspace) {
    cancelLyricsAssignment(workspace);
    const staff = workspace.activeStaff;
    const timer = window.setTimeout(() => {
      pendingLyricsAssignmentTimers.delete(workspace.id);
      finishLyricsAssignment(workspace, staff);
    }, delay);
    pendingLyricsAssignmentTimers.set(workspace.id, { timer, staff });
  }

  function flushLyricsAssignment(workspace: Workspace) {
    const pending = pendingLyricsAssignmentTimers.get(workspace.id);
    if (pending === undefined) {
      return;
    }
    cancelLyricsAssignment(workspace);
    finishLyricsAssignment(workspace, pending.staff);
  }

  function finishLyricsAssignment(workspace: Workspace, staff: Staff) {
    if (
      assignLyrics(workspace, staff, false) &&
      workspace === workspaceRef.value
    ) {
      save();
    } else {
      // Staff text can change without changing any rendered syllables.
      persistRecovery(workspace);
    }
  }

  function cancelLyricsAssignment(workspace: Workspace) {
    const pending = pendingLyricsAssignmentTimers.get(workspace.id);
    if (pending === undefined) {
      return;
    }
    window.clearTimeout(pending.timer);
    pendingLyricsAssignmentTimers.delete(workspace.id);
  }

  function clearPendingLyricsAssignments() {
    for (const { timer } of pendingLyricsAssignmentTimers.values()) {
      window.clearTimeout(timer);
    }
    pendingLyricsAssignmentTimers.clear();
  }

  function assignLyrics(
    workspace: Workspace = workspaceRef.value,
    staff: Staff = workspace.activeStaff,
    saveAfterAssignment = true,
  ) {
    const workspaceScore = workspace.score;
    if (
      !workspaceScore.staves.some((current) => toRaw(current) === toRaw(staff))
    ) {
      return false;
    }
    const workspaceElements = staff.elements;
    const workspaceIsSelected = workspace === workspaceRef.value;
    const updateCommands: Command[] = [];

    lyricService.assignLyrics(
      staff.lyrics.text,
      workspaceElements,
      workspaceScore.pageSetup.melkiteRtl,
      workspaceScore.pageSetup.disableGreekMelismata,
      (note, lyrics) => {
        if (workspaceIsSelected) {
          updateDisplayedLyrics(note, lyrics);
        }
      },
      (note, newValues) => {
        note.updated = true;
        updateCommands.push(
          noteElementCommandFactory.create('update-properties', {
            target: note,
            newValues,
          }),
        );
      },
      (dropCap, token) => {
        updateCommands.push(
          dropCapCommandFactory.create('update-properties', {
            target: dropCap,
            newValues: { content: token },
          }),
        );
      },
    );

    if (updateCommands.length === 0) {
      return false;
    }

    const revision = workspace.contentRevision;
    workspace.commandService.executeAsBatch(
      updateCommands,
      staff.lyrics.locked,
    );

    const changed = workspace.contentRevision !== revision;
    if (changed && workspaceIsSelected && saveAfterAssignment) {
      save();
    }
    return changed;
  }

  function extractStaffLyrics(
    workspace: Workspace,
    staff: Staff = workspace.activeStaff,
  ) {
    staff.lyrics.text = lyricService.extractLyrics(
      staff.elements,
      workspace.score.pageSetup.disableGreekMelismata,
    );
  }

  return {
    updateLyricsLocked,
    updateStaffLyrics,
    scheduleLyricsAssignment,
    flushLyricsAssignment,
    cancelLyricsAssignment,
    clearPendingLyricsAssignments,
    assignLyrics,
    extractStaffLyrics,
  };
}
