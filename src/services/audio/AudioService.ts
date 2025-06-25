import * as Tone from 'tone';
import { ToneEvent } from 'tone';

import { EventBus } from '@/eventBus';
import {
  PlaybackOptions,
  PlaybackSequenceEvent,
} from '@/services/audio/PlaybackService';

export enum AudioServiceEventNames {
  EventPlay = 'EventPlay',
  Stop = 'Stop',
}

export enum AudioState {
  Playing,
  Stopped,
  Paused,
}

export class AudioService {
  // Scales for debugging
  diatonicScale = [12, 10, 8, 12, 12, 10, 8];
  hardChromaticScale = [6, 20, 4, 12, 6, 20, 4];
  softChromaticScale = [8, 14, 8, 12, 8, 14, 8];

  synth: Tone.Synth | Tone.FMSynth;
  isonSynth: Tone.Synth | Tone.FMSynth;

  part: Tone.Part | null = null;

  toneEvents: ToneEvent[] = [];

  state: AudioState = AudioState.Stopped;

  currentEvent: PlaybackSequenceEvent | null = null;

  loggingEnabled: boolean = true;

  constructor() {
    this.synth = new Tone.Synth().toDestination();
    this.isonSynth = new Tone.Synth().toDestination();

    //this.synth = this.createVoiceSynth();
    //this.isonSynth = this.createVoiceSynth();

    this.isonSynth.volume.value = -4;
    //this.synth.sync();
  }

  dispose() {
    this.stop();

    this.synth.dispose();
    this.isonSynth.dispose();
  }

  play(
    events: PlaybackSequenceEvent[],
    options: PlaybackOptions,
    startAt: PlaybackSequenceEvent | undefined,
  ) {
    const synth = this.synth;
    const isonSynth = this.isonSynth;

    this.stop();

    synth.volume.value = options.volumeMelody;
    isonSynth.volume.value = options.volumeIson;

    let currentIsonFrequency = 0;
    let currentBpm = 0;

    this.state = AudioState.Playing;

    Tone.getTransport().bpm.value = startAt?.bpm ?? 60;

    for (const event of events) {
      if (currentBpm !== event.bpm) {
        Tone.getTransport().bpm.value = event.bpm!;
      }

      if (event.type === 'note') {
        const toneEvent = new ToneEvent((time) => {
          if (this.state !== AudioState.Playing) {
            return;
          }

          this.currentEvent = event;

          if (currentBpm !== event.bpm) {
            Tone.getTransport().bpm.value = event.bpm!;
          }

          if (event.duration != null && event.frequency != null) {
            synth.triggerAttackRelease(event.frequency, event.duration, time);
          } else {
            console.warn(
              'AudioService: note missing duration or frequency',
              event,
            );
          }

          const isonUnison = event.isonFrequency === -1;

          if (isonUnison) {
            if (event.frequency != null) {
              isonSynth.triggerAttack(event.frequency, time);
            }

            currentIsonFrequency = 0;
          } else if (event.isonFrequency === 0 || event.isonFrequency == null) {
            isonSynth.triggerRelease(time);
            currentIsonFrequency = 0;
          } else if (event.isonFrequency !== currentIsonFrequency) {
            currentIsonFrequency = event.isonFrequency;

            if (event.isonFrequency != null) {
              isonSynth.triggerAttack(event.isonFrequency, time);
            } else {
              console.warn('AudioService: missing ison frequency', event);
            }
          }

          EventBus.$emit(AudioServiceEventNames.EventPlay, event);

          if (this.loggingEnabled) {
            console.groupCollapsed('AudioService', 'note event');
            console.log('time', time);
            console.log('duration', event.duration);
            console.log('frequency', event.frequency);
            console.log('event', event);
            console.groupEnd();
          }
        });

        toneEvent.start(event.transportTime);
        this.toneEvents.push(toneEvent);
      } else if (event.type === 'rest') {
        const toneEvent = new ToneEvent((time) => {
          EventBus.$emit(AudioServiceEventNames.EventPlay, event);

          if (this.loggingEnabled) {
            console.groupCollapsed('AudioService', 'rest event');
            console.log('time', time);
            console.log('duration', event.duration);
            console.log('event', event);
            console.groupEnd();
          }
        });

        toneEvent.start(event.transportTime);
        this.toneEvents.push(toneEvent);
      }
    }

    const finishEvent = new ToneEvent((time) => {
      if (this.loggingEnabled) {
        console.log('AudioService', 'playback finished', time);
      }

      Tone.getTransport().stop();

      this.isonSynth.triggerRelease('+0.1');
      this.synth.triggerRelease('+0.1');

      EventBus.$emit(AudioServiceEventNames.Stop);

      this.state = AudioState.Stopped;
    });

    const lastEvent = events[events.length - 1];
    finishEvent.start(lastEvent.transportTime + lastEvent.duration);
    this.toneEvents.push(finishEvent);

    const startTime = startAt != null ? startAt.transportTime : 0;

    Tone.getTransport().bpm.value = startAt?.bpm ?? 60;
    currentBpm = Tone.getTransport().bpm.value;

    Tone.getTransport().seconds = Math.max(startTime, 0);

    Tone.getTransport().start();
  }

  stop() {
    if (this.loggingEnabled) {
      console.log('AudioService', 'stop');
    }

    // Reset the transport
    Tone.getTransport().stop();
    Tone.getTransport().position = 0;
    Tone.getTransport().cancel();

    // Stop the synths
    this.isonSynth.triggerRelease('+0.1');
    this.synth.triggerRelease('+0.1');

    this.toneEvents.forEach((e) => e.dispose());
    this.toneEvents = [];

    EventBus.$emit(AudioServiceEventNames.Stop);
    this.state = AudioState.Stopped;
  }

  pause() {
    if (this.state === AudioState.Playing) {
      if (this.loggingEnabled) {
        console.groupCollapsed('AudioService', 'pause');
        console.log('transport position', Tone.getTransport().seconds);
        console.groupEnd();
      }

      Tone.getTransport().stop();

      this.isonSynth.triggerRelease('+0.1');
      this.synth.triggerRelease('+0.1');

      this.state = AudioState.Paused;
    }
  }

  resume() {
    if (this.state === AudioState.Paused) {
      Tone.getTransport().position = this.currentEvent?.transportTime ?? 0;

      if (this.loggingEnabled) {
        console.group('AudioService', 'resume');
        console.log('transport position', Tone.getTransport().seconds);
        console.groupEnd();
      }

      Tone.getTransport().start();

      this.state = AudioState.Playing;
    }
  }

  togglePause() {
    if (this.state === AudioState.Paused) {
      this.resume();
    } else if (this.state === AudioState.Playing) {
      this.pause();
    }
  }

  jumpToEvent(event: PlaybackSequenceEvent) {
    if (this.loggingEnabled) {
      console.groupCollapsed('AudioService', 'jump to');
      console.log('transportTime', event.transportTime);
      console.log('event', event);
      console.groupEnd();
    }

    Tone.getTransport().bpm.value = event.bpm;
    Tone.getTransport().position = event.transportTime;
  }

  nextNote(currentFrequency: number, moria: number) {
    return currentFrequency * Math.pow(2, moria / 72);
  }

  createVoiceSynth() {
    //{w:"triangle",v:.3,a:.05,s:1}
    //[{w:"triangle",v:0.6,a:0.05,s:0.5,},{w:"sine",v:1,f:0.8,d:0.2,s:0.2,g:1,}],
    //{g:0,w:"sine",t:1,f:0,v:0.5,a:0,h:0.01,d:0.01,s:0,r:0.05,p:1,q:1,k:0};
    return new Tone.FMSynth({
      oscillator: {
        type: 'triangle',
        volume: 0.6,
      },
      envelope: {
        attack: 0.05,
        sustain: 0.5,
        decay: 0.01,
        release: 0.05,
      },
      modulation: {
        type: 'sine',
        volume: 1,
      },
      modulationEnvelope: {
        decay: 0.2,
        sustain: 0.2,
        release: 0.05,
      },
      modulationIndex: 0.8,
    });
  }

  playTestTone(frequency: number) {
    this.synth.volume.value = 0;
    Tone.getTransport().bpm.value = 120;
    const now = Tone.now();

    this.synth.triggerAttackRelease(frequency, '2n', now);
  }

  // For debugging
  playScale(scale: number[]) {
    const synth = new Tone.Synth().toDestination();

    let currentFrequency = 261.63;
    let now = Tone.now();

    for (const interval of scale) {
      synth.triggerAttackRelease(currentFrequency, '8n', now);
      currentFrequency = this.nextNote(currentFrequency, interval);
      now += 0.5;
    }
    synth.triggerAttackRelease(currentFrequency, '8n', now);
  }

  playDiatonicScale() {
    this.playScale(this.diatonicScale);
  }

  playHardChromaticScale() {
    this.playScale(this.hardChromaticScale);
  }

  playSoftChromaticScale() {
    this.playScale(this.softChromaticScale);
  }
}
