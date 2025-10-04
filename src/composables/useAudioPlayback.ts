import { inject, onBeforeUnmount, onMounted } from 'vue';

import { EventBus } from '@/eventBus';
import { ScoreElement } from '@/models/Element';
import {
  AudioService,
  AudioServiceEventNames,
  AudioState,
} from '@/services/audio/AudioService';
import {
  PlaybackSequenceEvent,
  PlaybackService,
} from '@/services/audio/PlaybackService';
import { useEditorStore } from '@/stores/useEditorStore';

export function useAudioPlayback() {
  const audioService = inject<AudioService>('audioService', new AudioService());
  const playbackService = inject<PlaybackService>(
    'playbackService',
    new PlaybackService(),
  );

  const editor = useEditorStore();

  let playbackEvents = [] as PlaybackSequenceEvent[];
  let playbackTimeInterval: ReturnType<typeof setTimeout> | null = null;

  function playAudio() {
    try {
      if (audioService.state === AudioState.Stopped) {
        playbackEvents = playbackService.computePlaybackSequence(
          editor.elements,
          editor.audioOptions,
          editor.score.pageSetup.chrysanthineAccidentals,
        );

        if (playbackEvents.length === 0) {
          return;
        }

        const startAt = playbackEvents.find(
          (x) => x.elementIndex >= editor.selectedElementIndex,
        );

        audioService.play(playbackEvents, editor.audioOptions, startAt);

        if (startAt) {
          editor.selectedWorkspace.playbackTime = startAt.absoluteTime;
        }

        startPlaybackClock();
      } else {
        pauseAudio();
      }
    } catch (error) {
      console.error(error);
    }
  }

  function stopAudio() {
    try {
      audioService.stop();

      playbackEvents = [];

      stopPlaybackClock();
    } catch (error) {
      console.error(error);
    }
  }

  function pauseAudio() {
    try {
      audioService.togglePause();

      if (audioService.state === AudioState.Paused) {
        editor.audioElement = null;
        stopPlaybackClock();
      } else {
        startPlaybackClock();
      }
    } catch (error) {
      console.error(error);
    }
  }

  function startPlaybackClock() {
    stopPlaybackClock();

    playbackTimeInterval = setInterval(() => {
      editor.selectedWorkspace.playbackTime += 0.1;
    }, 100);
  }

  function stopPlaybackClock() {
    if (playbackTimeInterval != null) {
      clearInterval(playbackTimeInterval);
    }
  }

  function playTestTone() {
    try {
      audioService.playTestTone(editor.audioOptions.frequencyDi);
    } catch (error) {
      console.error(error);
    }
  }

  function updateAudioOptionsSpeed(speed: number) {
    if (audioService.state === AudioState.Paused) {
      stopAudio();
    }

    speed = Math.max(0.1, speed);
    speed = Math.min(3, speed);
    speed = +speed.toFixed(2);

    editor.selectedWorkspace.playbackBpm /= editor.audioOptions.speed;
    editor.selectedWorkspace.playbackBpm *= speed;

    editor.audioOptions.speed = speed;

    saveAudioOptions();
  }

  function saveAudioOptions() {
    localStorage.setItem(
      'audioOptionsDefault',
      JSON.stringify(editor.audioOptions),
    );
  }

  function onAudioServiceEventPlay(event: PlaybackSequenceEvent) {
    if (audioService.state === AudioState.Playing) {
      editor.selectedWorkspace.playbackTime = event.absoluteTime;
      editor.selectedWorkspace.playbackBpm = event.bpm;

      editor.audioElement = editor.elements[event.elementIndex];
    }
  }

  function onAudioServiceStop() {
    editor.audioElement = null;

    stopPlaybackClock();
  }

  function onSetSelectedElement(element: ScoreElement) {
    if (audioService.state === AudioState.Playing) {
      const event = playbackEvents.find(
        (x) => x.elementIndex === element.index,
      );

      if (event) {
        audioService.jumpToEvent(event);
        editor.selectedWorkspace.playbackTime = event.absoluteTime;
      }
    } else if (audioService.state === AudioState.Paused) {
      stopAudio();
    }
  }

  onMounted(() => {
    EventBus.$on(AudioServiceEventNames.EventPlay, onAudioServiceEventPlay);
    EventBus.$on(AudioServiceEventNames.Stop, onAudioServiceStop);
  });

  onBeforeUnmount(() => {
    EventBus.$off(AudioServiceEventNames.EventPlay, onAudioServiceEventPlay);
    EventBus.$off(AudioServiceEventNames.Stop, onAudioServiceStop);

    audioService.dispose();
  });

  return {
    playAudio,
    stopAudio,
    pauseAudio,
    playTestTone,
    saveAudioOptions,
    updateAudioOptionsSpeed,
    onAudioServiceEventPlay,
    onAudioServiceStop,
    onSetSelectedElement,
  };
}
