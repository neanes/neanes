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

interface PlaybackWorkspace {
  frequency: number;
  note: number;
  scale: number[];
}

interface GorgonIndex {
  index: number;
  neume: GorgonNeume;
  beat: number;
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

  play(events: PlaybackSequenceEvent[], startAt: number | null) {
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
        this.toneEvents.push(toneEvent);
      }
    }

    const finishEvent = new ToneEvent((time) => {
      console.log('playback finished', time);
      Tone.Transport.stop();
    });

    const lastEvent = events[events.length - 1];
    finishEvent.start(lastEvent.time + lastEvent.duration);
    this.toneEvents.push(finishEvent);

    const startTime = startAt != null ? events[startAt].time : 0;

    if (startAt != null) {
      console.log('starting at', events[startAt]);
    }

    Tone.Transport.position = startTime;

    Tone.Transport.start();
  }

  stop() {
    console.log('stop');
    // Reset the transport
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    Tone.Transport.cancel();

    this.toneEvents.forEach((e) => e.dispose());
    this.toneEvents = [];
  }

  pause() {
    Tone.Transport.pause();
  }

  resume() {
    Tone.Transport.start();
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
        release: 0.05,
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

  computePlaybackSequence(
    elements: ScoreElement[],
    startAtElementIndex: number | null,
  ) {
    const events: PlaybackSequenceEvent[] = [];
    const gorgonIndexes: GorgonIndex[] = [];

    let startAtEventIndex: number | null = null;

    const frequencyPa = 293.66;

    let workspace: PlaybackWorkspace = {
      note: 0,
      frequency: frequencyPa,
      scale: this.diatonicScale,
    };

    let bpm = 180;
    let beat = (1 / bpm) * 60;

    for (let i = 0; i < elements.length; i++) {
      let element = elements[i];

      if (element.elementType === ElementType.Note) {
        if (i === startAtElementIndex) {
          console.log('startAt', element);
          startAtEventIndex = events.length;
        }

        const noteElement = element as NoteElement;

        // If we moved, calculate the new note
        const distance = getNeumeValue(noteElement.quantitativeNeume)!;

        if (this.isKentimataCombo(noteElement)) {
          // Process first note
          const initialDistance = distance - 1;

          this.moveDistance(workspace, initialDistance);

          if (noteElement.secondaryGorgonNeume) {
            const gorgonIndex: GorgonIndex = {
              neume: noteElement.secondaryGorgonNeume,
              index: events.length,
              beat,
            };

            console.log('gorgonIndex', gorgonIndex);

            gorgonIndexes.push(gorgonIndex);
          }

          const event: PlaybackSequenceEvent = {
            frequency: workspace.frequency,
            type: 'note',
            duration: 1 * beat,
            time: 0,
          };

          events.push(event);

          // Process the kentimata
          this.moveDistance(workspace, 1);

          if (noteElement.gorgonNeume) {
            const gorgonIndex: GorgonIndex = {
              neume: noteElement.gorgonNeume,
              index: events.length,
              beat,
            };

            console.log('gorgonIndex', gorgonIndex);

            gorgonIndexes.push(gorgonIndex);
          }

          // Calculate accidentals
          let alteredFrequency = workspace.frequency;

          if (noteElement.accidental != null) {
            const alteration = this.alterationMap.get(noteElement.accidental)!;
            alteredFrequency = this.changeFrequency(
              alteredFrequency,
              alteration,
            );
            console.log('alteration', alteration);
          }

          const kentimataEvent: PlaybackSequenceEvent = {
            frequency: alteredFrequency,
            type: 'note',
            duration: 1 * beat,
            time: 0,
          };

          events.push(kentimataEvent);
        } else if (
          noteElement.quantitativeNeume ===
          QuantitativeNeume.KentemataPlusOligon
        ) {
          // Process first note
          const initialDistance = 1;

          this.moveDistance(workspace, initialDistance);

          if (noteElement.gorgonNeume) {
            const gorgonIndex: GorgonIndex = {
              neume: noteElement.gorgonNeume,
              index: events.length,
              beat,
            };

            console.log('gorgonIndex', gorgonIndex);

            gorgonIndexes.push(gorgonIndex);
          }

          const kentimataEvent: PlaybackSequenceEvent = {
            frequency: workspace.frequency,
            type: 'note',
            duration: 1 * beat,
            time: 0,
          };

          events.push(kentimataEvent);

          // Process the kentimata
          let oligonDuration = 1 * beat;

          this.moveDistance(workspace, 1);

          if (noteElement.timeNeume != null) {
            oligonDuration += this.timeMap.get(noteElement.timeNeume)! * beat;
          }

          // Calculate accidentals
          let alteredFrequency = workspace.frequency;

          if (noteElement.accidental != null) {
            const alteration = this.alterationMap.get(noteElement.accidental)!;
            alteredFrequency = this.changeFrequency(
              alteredFrequency,
              alteration,
            );
            console.log('alteration', alteration);
          }

          const oligonEvent: PlaybackSequenceEvent = {
            frequency: alteredFrequency,
            type: 'note',
            duration: oligonDuration,
            time: 0,
          };

          events.push(oligonEvent);
        } else if (
          noteElement.quantitativeNeume === QuantitativeNeume.Hyporoe
        ) {
          // Process first note
          const initialDistance = -1;

          this.moveDistance(workspace, initialDistance);

          if (noteElement.gorgonNeume) {
            const gorgonIndex: GorgonIndex = {
              neume: noteElement.gorgonNeume,
              index: events.length,
              beat,
            };

            console.log('gorgonIndex', gorgonIndex);

            gorgonIndexes.push(gorgonIndex);
          }

          const event1: PlaybackSequenceEvent = {
            frequency: workspace.frequency,
            type: 'note',
            duration: 1 * beat,
            time: 0,
          };

          events.push(event1);

          // Process the kentimata
          let event2Duration = 1 * beat;

          this.moveDistance(workspace, -1);

          if (noteElement.timeNeume != null) {
            event2Duration += this.timeMap.get(noteElement.timeNeume)! * beat;
          }

          // Calculate accidentals
          let alteredFrequency = workspace.frequency;

          if (noteElement.accidental != null) {
            const alteration = this.alterationMap.get(noteElement.accidental)!;
            alteredFrequency = this.changeFrequency(
              alteredFrequency,
              alteration,
            );
            console.log('alteration', alteration);
          }

          const event2: PlaybackSequenceEvent = {
            frequency: alteredFrequency,
            type: 'note',
            duration: event2Duration,
            time: 0,
          };

          events.push(event2);
        } else if (
          noteElement.quantitativeNeume === QuantitativeNeume.RunningElaphron
        ) {
          // Process first note
          this.moveDistance(workspace, -1);

          // Add a virtual gorgon
          const gorgonIndex: GorgonIndex = {
            neume: GorgonNeume.Gorgon_Top,
            index: events.length,
            beat,
          };

          console.log('gorgonIndex (virtual)', gorgonIndex);

          gorgonIndexes.push(gorgonIndex);

          const event1: PlaybackSequenceEvent = {
            frequency: workspace.frequency,
            type: 'note',
            duration: 1 * beat,
            time: 0,
          };

          events.push(event1);

          // Process the second note
          let event2Duration = 1 * beat;

          this.moveDistance(workspace, -1);

          if (noteElement.timeNeume != null) {
            event2Duration += this.timeMap.get(noteElement.timeNeume)! * beat;
          }

          // Calculate accidentals
          let alteredFrequency = workspace.frequency;

          if (noteElement.accidental != null) {
            const alteration = this.alterationMap.get(noteElement.accidental)!;
            alteredFrequency = this.changeFrequency(
              alteredFrequency,
              alteration,
            );
            console.log('alteration', alteration);
          }

          const event2: PlaybackSequenceEvent = {
            frequency: alteredFrequency,
            type: 'note',
            duration: event2Duration,
            time: 0,
          };

          events.push(event2);
        } else if (this.isRest(noteElement)) {
          let duration = this.restMap.get(noteElement.quantitativeNeume)!;

          const restEvent: PlaybackSequenceEvent = {
            type: 'rest',
            duration,
            time: 0,
          };

          events.push(restEvent);
        } else {
          this.moveDistance(workspace, distance);

          let duration = 1 * beat;

          // Calculate time
          if (noteElement.timeNeume != null) {
            duration += this.timeMap.get(noteElement.timeNeume)! * beat;
          }

          if (noteElement.gorgonNeume) {
            const gorgonIndex: GorgonIndex = {
              neume: noteElement.gorgonNeume,
              index: events.length,
              beat,
            };

            console.log('gorgonIndex', gorgonIndex);

            gorgonIndexes.push(gorgonIndex);
          }

          // Calculate accidentals
          let alteredFrequency = workspace.frequency;

          if (noteElement.accidental != null) {
            const alteration = this.alterationMap.get(noteElement.accidental)!;
            alteredFrequency = this.changeFrequency(
              alteredFrequency,
              alteration,
            );
            console.log('alteration', alteration);
          }

          let event: PlaybackSequenceEvent = {
            frequency: alteredFrequency,
            type: 'note',
            duration,
            time: 0,
          };

          events.push(event);
        }
      } else if (element.elementType === ElementType.ModeKey) {
        const modeKeyElement = element as ModeKeyElement;

        const frequencyDi = 392;
        let di = 4;

        if (modeKeyElement.scale === Scale.Diatonic) {
          workspace.scale = this.diatonicScale;
          workspace.note = this.diatonicScaleNoteMap.get(
            modeKeyElement.scaleNote,
          )!;
        } else if (modeKeyElement.scale === Scale.SoftChromatic) {
          workspace.scale = this.softChromaticScale;
          workspace.note = this.softChromaticScaleNoteMap.get(
            modeKeyElement.scaleNote,
          )!;
        } else if (modeKeyElement.scale === Scale.HardChromatic) {
          workspace.scale = this.hardChromaticScale;
          workspace.note = this.hardChromaticScaleNoteMap.get(
            modeKeyElement.scaleNote,
          )!;

          di = 3;
        }

        const moria = this.moriaBetweenNotes(
          di,
          workspace.scale,
          workspace.note - di,
        );

        workspace.frequency = this.changeFrequency(frequencyDi, moria);
        console.log(
          'frequency change',
          workspace.frequency,
          moria,
          di,
          workspace.note,
        );
      }
    }

    this.processGorgons(events, gorgonIndexes);

    // Calculate times
    let time = 0;

    for (let event of events) {
      event.time = time;
      time += event.duration;
    }

    console.log('playback events', events, startAtEventIndex);

    return { events, startAt: startAtEventIndex };
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

  moveDistance(workspace: PlaybackWorkspace, distance: number) {
    if (distance === 0) {
      return;
    }

    const moria = this.moriaBetweenNotes(
      workspace.note,
      workspace.scale,
      distance,
    );

    workspace.note += distance;

    workspace.frequency = this.changeFrequency(workspace.frequency, moria);
  }

  isKentimataCombo(element: NoteElement) {
    // Note that this does not contain
    // oligon with kentimata below because it is
    // a special case
    return [
      QuantitativeNeume.OligonPlusHamiliPlusKentemata,
      QuantitativeNeume.OligonPlusIsonPlusKentemata,
      QuantitativeNeume.OligonPlusHyporoePlusKentemata,
      QuantitativeNeume.OligonPlusElaphronPlusKentemata,
      QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
      QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
      QuantitativeNeume.OligonKentimaMiddleKentimata,
      QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft,
      QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight,
      QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
      QuantitativeNeume.OligonPlusKentemata,
    ].includes(element.quantitativeNeume);
  }

  isRest(element: NoteElement) {
    return [
      QuantitativeNeume.Breath,
      QuantitativeNeume.Cross,
      QuantitativeNeume.VareiaDotted,
      QuantitativeNeume.VareiaDotted2,
      QuantitativeNeume.VareiaDotted3,
      QuantitativeNeume.VareiaDotted4,
    ].includes(element.quantitativeNeume);
  }

  processGorgons(
    events: PlaybackSequenceEvent[],
    gorgonIndexes: GorgonIndex[],
  ) {
    for (let gorgon of gorgonIndexes) {
      const durations = this.gorgonMap.get(gorgon.neume)!;

      // TODO: handle the case where the user has made an
      // error and placed gorgons in a location where
      // affectedEvents.length < durations.length
      const affectedEvents = events.slice(
        gorgon.index - 1,
        gorgon.index + durations.length - 1,
      );

      for (let i = 0; i < durations.length; i++) {
        if (affectedEvents[i]) {
          affectedEvents[i].duration -= durations[i] * gorgon.beat;
        }
      }
    }
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

  gorgonMap = new Map<GorgonNeume, number[]>([
    [GorgonNeume.Gorgon_Top, [0.5, 0.5]],
    [GorgonNeume.Gorgon_Bottom, [0.5, 0.5]],
    [GorgonNeume.GorgonDottedLeft, [1 / 3, 2 / 3]],
    [GorgonNeume.GorgonDottedRight, [2 / 3, 1 / 3]],
    [GorgonNeume.Digorgon, [2 / 3, 2 / 3, 2 / 3]],
    [GorgonNeume.DigorgonDottedLeft1, [0.5, 0.75, 0.75]],
    [GorgonNeume.DigorgonDottedLeft2, [0.75, 0.5, 0.75]],
    [GorgonNeume.DigorgonDottedRight, [0.75, 0.75, 0.5]],
    [GorgonNeume.Trigorgon, [0.75, 0.75, 0.75, 0.75]],
    // TODO handle trigorgon dotted
    [GorgonNeume.TrigorgonDottedLeft1, [0.75, 0.75, 0.75, 0.75]],
    [GorgonNeume.TrigorgonDottedLeft2, [0.75, 0.75, 0.75, 0.75]],
    [GorgonNeume.TrigorgonDottedRight, [0.75, 0.75, 0.75, 0.75]],
    // Secondary
    [GorgonNeume.GorgonSecondary, [0.5, 0.5]],
    [GorgonNeume.GorgonDottedLeftSecondary, [1 / 3, 2 / 3]],
    [GorgonNeume.GorgonDottedRightSecondary, [2 / 3, 1 / 3]],
    [GorgonNeume.DigorgonSecondary, [2 / 3, 2 / 3, 2 / 3]],
    [GorgonNeume.DigorgonDottedLeft1Secondary, [0.5, 0.75, 0.75]],
    [GorgonNeume.DigorgonDottedRightSecondary, [0.75, 0.75, 0.5]],
    [GorgonNeume.TrigorgonSecondary, [0.75, 0.75, 0.75, 0.75]],
    // TODO handle trigorgon dotted
    [GorgonNeume.TrigorgonDottedLeft1Secondary, [0.75, 0.75, 0.75, 0.75]],
    [GorgonNeume.TrigorgonDottedRightSecondary, [0.75, 0.75, 0.75, 0.75]],
  ]);

  restMap = new Map<QuantitativeNeume, number>([
    [QuantitativeNeume.Breath, 0],
    [QuantitativeNeume.Cross, 0],
    [QuantitativeNeume.VareiaDotted, 1],
    [QuantitativeNeume.VareiaDotted2, 2],
    [QuantitativeNeume.VareiaDotted3, 3],
    [QuantitativeNeume.VareiaDotted4, 4],
  ]);

  timeMap = new Map<TimeNeume, number>([
    [TimeNeume.Klasma_Bottom, 1],
    [TimeNeume.Klasma_Top, 1],
    [TimeNeume.Hapli, 1],
    [TimeNeume.Dipli, 2],
    [TimeNeume.Tripli, 3],
  ]);
}

// For debugging
//(window as any)._audioService = new AudioService();
//(window as any)._playbackService = new PlaybackService();
