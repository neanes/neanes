import * as Tone from 'tone';
import {
  ElementType,
  ModeKeyElement,
  NoteElement,
  ScoreElement,
} from '@/models/Element';
import { getNeumeValue } from '@/models/NeumeValues';
import { ToneEvent } from 'tone';
import {
  Accidental,
  GorgonNeume,
  QuantitativeNeume,
  TimeNeume,
} from '@/models/Neumes';
import { Scale, ScaleNote } from '@/models/Scales';

export interface PlaybackSequenceEvent {
  frequency?: number;
  type: 'note' | 'rest';
  duration: number;
  bpm?: number;
  time: number;
}

export class AudioService {
  // Scales
  diatonicScale = [12, 10, 8, 12, 12, 10, 8];
  hardChromaticScale = [6, 20, 4, 12, 6, 20, 4];
  softChromaticScale = [8, 14, 8, 12, 8, 14, 8];

  synth: Tone.Synth | Tone.FMSynth;

  part: Tone.Part | null = null;

  toneEvents: ToneEvent[] = [];

  constructor() {
    //this.synth = new Tone.Synth().toDestination();
    this.synth = this.createVoiceSynth().toDestination();
    //this.synth.sync();
  }

  play(events: PlaybackSequenceEvent[]) {
    const synth = this.synth;

    this.stop();

    for (let event of events) {
      if (event.type === 'note') {
        let toneEvent = new ToneEvent((time) => {
          //synth.set({ portamento: 0.25 });

          //Tone.Transport.bpm.setValueAtTime(120, now + 1);

          synth.triggerAttackRelease(event.frequency!, event.duration, time);

          console.log(time, event);
        });

        toneEvent.start(event.time);
      }
    }

    const finishEvent = new ToneEvent((time) => {
      console.log('playback finished', time);
      Tone.Transport.stop();
    });

    const lastEvent = events[events.length - 1];
    finishEvent.start(lastEvent.time + lastEvent.duration);

    Tone.Transport.start();
  }

  stop() {
    console.log('stop');
    // Reset the transport
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    Tone.Transport.cancel();

    //this.toneEvents.forEach((e) => e.dispose());
    //this.toneEvents = [];
  }

  pause() {
    Tone.Transport.pause();
  }

  nextNote(currentFrequency: number, moria: number) {
    return currentFrequency * Math.pow(2, moria / 72);
  }

  createVoiceSynth() {
    //[{w:"triangle",v:0.6,a:0.05,s:0.5,},{w:"sine",v:1,f:0.8,d:0.2,s:0.2,g:1,}],
    return new Tone.FMSynth({
      oscillator: {
        type: 'triangle',
        volume: 0.6,
      },
      envelope: {
        attack: 0.05,
        sustain: 0.5,
      },
      modulation: {
        type: 'sine',
        volume: 1,
      },
      modulationEnvelope: {
        decay: 0.2,
        sustain: 0.2,
      },
      modulationIndex: 0.8,
    });
  }

  // For debugging
  playScale(scale: number[]) {
    const synth = new Tone.Synth().toDestination();

    let currentFrequency = 261.63;
    let now = Tone.now();

    for (let interval of scale) {
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

export class PlaybackService {
  diatonicScale = [12, 10, 8, 12, 12, 10, 8];
  hardChromaticScale = [6, 20, 4, 12];
  softChromaticScale = [8, 14, 8, 12];

  computePlaybackSequence(elements: ScoreElement[]): PlaybackSequenceEvent[] {
    const events: PlaybackSequenceEvent[] = [];

    const frequencyPa = 293.66;

    let currentNote = 0;
    let currentScale = this.diatonicScale;
    let time = 0;
    let bpm = 200;
    let currentFrequency = frequencyPa;
    let beat = (1 / bpm) * 60;

    for (let i = 0; i < elements.length; i++) {
      let element = elements[i];
      let nextElement = elements[i + 1];

      if (element.elementType === ElementType.Note) {
        const noteElement = element as NoteElement;

        let duration = 1 * beat;

        // If we moved, calculate the new note
        const distance = getNeumeValue(noteElement.quantitativeNeume)!;

        if (distance !== 0) {
          const moria = this.moriaBetweenNotes(
            currentNote,
            currentScale,
            distance,
          );

          currentNote += distance;

          currentFrequency = this.changeFrequency(currentFrequency, moria);
        }

        // Calculate time
        if (noteElement.timeNeume?.includes('Klasma')) {
          duration = 2 * beat;
        } else if (
          noteElement.quantitativeNeume === QuantitativeNeume.RunningElaphron ||
          noteElement.gorgonNeume === GorgonNeume.Gorgon_Top
        ) {
          duration = 0.5 * beat;
        }

        if (nextElement?.elementType === ElementType.Note) {
          const nextNoteElement = nextElement as NoteElement;

          if (
            nextNoteElement.quantitativeNeume ===
            QuantitativeNeume.RunningElaphron
          ) {
            duration -= 0.5 * beat;
          } else if (nextNoteElement.gorgonNeume === GorgonNeume.Gorgon_Top) {
            duration -= 0.5 * beat;
          }
        }

        // Calculate accidentals
        let frequency = currentFrequency;

        if (noteElement.accidental != null) {
          const alteration = this.alterationMap.get(noteElement.accidental)!;
          frequency = this.changeFrequency(frequency, alteration);
          console.log('alteration', alteration);
        }

        let event: PlaybackSequenceEvent = {
          frequency,
          type: 'note',
          duration,
          time,
        };

        time += duration;

        events.push(event);
      } else if (element.elementType === ElementType.ModeKey) {
        const modeKeyElement = element as ModeKeyElement;

        let pa = 1;

        if (modeKeyElement.scale === Scale.Diatonic) {
          currentScale = this.diatonicScale;
          currentNote = this.diatonicScaleNoteMap.get(
            modeKeyElement.scaleNote,
          )!;
        } else if (modeKeyElement.scale === Scale.SoftChromatic) {
          currentScale = this.softChromaticScale;
          currentNote = this.softChromaticScaleNoteMap.get(
            modeKeyElement.scaleNote,
          )!;
        } else if (modeKeyElement.scale === Scale.HardChromatic) {
          currentScale = this.hardChromaticScale;
          currentNote = this.hardChromaticScaleNoteMap.get(
            modeKeyElement.scaleNote,
          )!;

          pa = 0;
        }

        const moria = this.moriaBetweenNotes(
          pa,
          currentScale,
          currentNote - pa,
        );

        currentFrequency = this.changeFrequency(frequencyPa, moria);
        console.log(
          'frequency change',
          currentFrequency,
          moria,
          pa,
          currentNote,
        );
      }
    }

    console.log('playback events', events);

    return events;
  }

  ////////////////////
  // Helper Methods
  ////////////////////
  changeFrequency(currentFrequency: number, moria: number) {
    return currentFrequency * Math.pow(2, moria / 72);
  }

  mod(value: number, modulus: number) {
    return ((value % modulus) + modulus) % modulus;
  }

  moriaBetweenNotes(currentNote: number, scale: number[], distance: number) {
    let interval = 0;

    const abs = Math.abs(distance);
    const sign = Math.sign(distance);

    for (let i = 0; i < abs; i++) {
      let index =
        sign > 0
          ? this.mod(currentNote, scale.length)
          : this.mod(currentNote - 1, scale.length);
      interval += scale[index] * sign;

      currentNote += sign;
    }

    return interval;
  }

  /////////////////////////
  // Maps
  /////////////////////////
  diatonicScaleNoteMap = new Map<ScaleNote, number>([
    [ScaleNote.Ni, 0],
    [ScaleNote.Pa, 1],
    [ScaleNote.Thi, 4],
  ]);

  softChromaticScaleNoteMap = new Map<ScaleNote, number>([
    [ScaleNote.Pa, 1],
    [ScaleNote.Thi, 4],
  ]);

  hardChromaticScaleNoteMap = new Map<ScaleNote, number>([
    [ScaleNote.Pa, 0],
    [ScaleNote.Thi, 3],
  ]);

  alterationMap = new Map<Accidental, number>([
    [Accidental.Flat_2_Right, -2],
    [Accidental.Flat_4_Right, -4],
    [Accidental.Flat_6_Right, -6],
    [Accidental.Flat_8_Right, -8],
    [Accidental.Sharp_2_Left, 2],
    [Accidental.Sharp_4_Left, 4],
    [Accidental.Sharp_6_Left, 6],
    [Accidental.Sharp_8_Left, 8],
  ]);
}

// For debugging
//(window as any)._audioService = new AudioService();
//(window as any)._playbackService = new PlaybackService();
