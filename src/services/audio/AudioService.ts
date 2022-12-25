import * as Tone from 'tone';
import {
  ElementType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  ScoreElement,
  TempoElement,
} from '@/models/Element';
import { getNeumeValue } from '@/models/NeumeValues';
import { ToneEvent } from 'tone';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  Ison,
  QuantitativeNeume,
  TempoSign,
  TimeNeume,
} from '@/models/Neumes';
import {
  getIsonValue,
  getScaleNoteValue,
  Scale,
  ScaleNote,
} from '@/models/Scales';

import { EventBus } from '@/eventBus';

export interface PlaybackSequenceEvent {
  frequency?: number;
  isonFrequency?: number;
  type: 'note' | 'rest';
  duration: number;
  time: number;
  elementIndex: number;
}

interface PlaybackWorkspace {
  frequency: number;
  // To move up, move up scale.intervals[intervalIndex] moria
  // To move down, move down scale.intervals[intervalIndex - 1] moria,
  // wrapping around to the end of the scale.intervals array, if necessary
  intervalIndex: number;
  scale: PlaybackScale;
}

interface GorgonIndex {
  index: number;
  neume: GorgonNeume;
  beat: number;
}

enum PlaybackScaleName {
  Diatonic,
  SoftChromatic,
  HardChromatic,
}

interface PlaybackScale {
  name: PlaybackScaleName;
  intervals: number[];
  scaleNoteMap: Map<ScaleNote, number>;
  fthoraMap: Map<Fthora, number>;
}

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
    startAt: PlaybackSequenceEvent | undefined,
  ) {
    const synth = this.synth;
    const isonSynth = this.isonSynth;

    this.stop();

    let currentIsonFrequency = 0;

    this.state = AudioState.Playing;

    for (let event of events) {
      if (event.type === 'note') {
        const toneEvent = new ToneEvent((time) => {
          //synth.set({ portamento: 0.25 });

          synth.triggerAttackRelease(event.frequency!, event.duration, time);

          const isonUnison = event.isonFrequency === -1;

          if (isonUnison) {
            isonSynth.triggerAttack(event.frequency!, time);
          } else if (event.isonFrequency !== currentIsonFrequency) {
            isonSynth.triggerAttack(event.isonFrequency!, time);
          }

          EventBus.$emit(AudioServiceEventNames.EventPlay, event);

          console.log(time, event);
        });

        toneEvent.start(event.time);
        this.toneEvents.push(toneEvent);
      } else if (event.type === 'rest') {
        const toneEvent = new ToneEvent((time) => {
          EventBus.$emit(AudioServiceEventNames.EventPlay, event);

          console.log(time, event);
        });

        toneEvent.start(event.time);
        this.toneEvents.push(toneEvent);
      }
    }

    const finishEvent = new ToneEvent((time) => {
      console.log('playback finished', time);
      Tone.Transport.stop();
      isonSynth.triggerRelease();
      synth.triggerRelease();

      EventBus.$emit(AudioServiceEventNames.Stop);

      this.state = AudioState.Stopped;
    });

    const lastEvent = events[events.length - 1];
    finishEvent.start(lastEvent.time + lastEvent.duration);
    this.toneEvents.push(finishEvent);

    const startTime = startAt != null ? startAt.time : 0;

    if (startAt != null) {
      console.log('starting at', startAt);
    }

    // TODO is there a better way to handle this?
    // Tone.js sometimes starts late and misses the first ToneEvent,
    // So we set the position to be just a little bit earlier
    Tone.Transport.position = Math.max(startTime - 0.01, 0);

    Tone.Transport.start();
  }

  stop() {
    console.log('stop');

    // Reset the transport
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    Tone.Transport.cancel();

    // Stop the synths
    this.isonSynth.triggerRelease();
    this.synth.triggerRelease();

    this.toneEvents.forEach((e) => e.dispose());
    this.toneEvents = [];

    EventBus.$emit(AudioServiceEventNames.Stop);
    this.state = AudioState.Stopped;
  }

  pause() {
    if (this.state === AudioState.Playing) {
      console.log('pause', Tone.Transport.position);

      Tone.Transport.pause();

      this.isonSynth.triggerRelease();
      this.synth.triggerRelease();

      this.state = AudioState.Paused;
    }
  }

  resume() {
    if (this.state === AudioState.Paused) {
      console.log('resume', Tone.Transport.position);

      Tone.Transport.start();

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
    Tone.Transport.position = event.time;
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
  computePlaybackSequence(elements: ScoreElement[]) {
    const events: PlaybackSequenceEvent[] = [];
    const gorgonIndexes: GorgonIndex[] = [];

    const frequencyPa = 146.83;
    const frequencyDi = 196;

    // const frequencyPa = 293.66;
    // const frequencyDi = 392;

    let workspace: PlaybackWorkspace = {
      intervalIndex: 0,
      frequency: frequencyPa,
      scale: this.diatonicScale,
    };

    let beat = this.beatLengthFromBpm(160);
    let isonFrequency = 0;

    for (let i = 0; i < elements.length; i++) {
      let element = elements[i];

      if (element.elementType === ElementType.Note) {
        const noteElement = element as NoteElement;

        // Check ison
        if (noteElement.ison) {
          isonFrequency = -1;

          if (noteElement.ison !== Ison.Unison) {
            const di = workspace.scale.scaleNoteMap.get(ScaleNote.Thi)!;

            const distance =
              getIsonValue(noteElement.ison) - getScaleNoteValue(ScaleNote.Thi);

            const moria = this.moriaBetweenNotes(
              di,
              workspace.scale.intervals,
              distance,
            );

            isonFrequency = this.changeFrequency(frequencyDi, moria);

            console.log(
              'change ison frequency',
              i,
              isonFrequency,
              moria,
              noteElement,
            );
          } else {
            console.log(
              'change ison frequency',
              i,
              isonFrequency,
              0,
              noteElement,
            );
          }
        }

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
            isonFrequency,
            type: 'note',
            duration: 1 * beat,
            time: 0,
            elementIndex: i,
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
            isonFrequency,
            type: 'note',
            duration: 1 * beat,
            time: 0,
            elementIndex: i,
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
            isonFrequency,
            type: 'note',
            duration: 1 * beat,
            time: 0,
            elementIndex: i,
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
            isonFrequency,
            type: 'note',
            duration: oligonDuration,
            time: 0,
            elementIndex: i,
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
            isonFrequency,
            type: 'note',
            duration: 1 * beat,
            time: 0,
            elementIndex: i,
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
            isonFrequency,
            type: 'note',
            duration: event2Duration,
            time: 0,
            elementIndex: i,
          };

          events.push(event2);
        } else if (
          noteElement.quantitativeNeume === QuantitativeNeume.DoubleApostrophos
        ) {
          // Process first note
          const initialDistance = -1;

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

          const event1: PlaybackSequenceEvent = {
            frequency: workspace.frequency,
            isonFrequency,
            type: 'note',
            duration: 1 * beat,
            time: 0,
            elementIndex: i,
          };

          events.push(event1);

          // Process the kentimata
          let event2Duration = 1 * beat;

          this.moveDistance(workspace, -1);

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

          const event2: PlaybackSequenceEvent = {
            frequency: alteredFrequency,
            isonFrequency,
            type: 'note',
            duration: event2Duration,
            time: 0,
            elementIndex: i,
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
            isonFrequency,
            type: 'note',
            duration: 1 * beat,
            time: 0,
            elementIndex: i,
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
            isonFrequency,

            type: 'note',
            duration: event2Duration,
            time: 0,
            elementIndex: i,
          };

          events.push(event2);
        } else if (this.isRest(noteElement)) {
          let duration = this.restMap.get(noteElement.quantitativeNeume)!;

          const restEvent: PlaybackSequenceEvent = {
            type: 'rest',
            duration,
            time: 0,
            elementIndex: i,
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
            isonFrequency,
            type: 'note',
            duration,
            time: 0,
            elementIndex: i,
          };

          events.push(event);
        }

        if (noteElement.fthora != null) {
          this.applyFthora(noteElement.fthora, workspace);
        }
      } else if (element.elementType === ElementType.ModeKey) {
        const modeKeyElement = element as ModeKeyElement;

        if (modeKeyElement.scale === Scale.Diatonic) {
          workspace.scale = this.diatonicScale;
        } else if (modeKeyElement.scale === Scale.SoftChromatic) {
          workspace.scale = this.softChromaticScale;
        } else if (modeKeyElement.scale === Scale.HardChromatic) {
          workspace.scale = this.hardChromaticScale;
        }

        const di = workspace.scale.scaleNoteMap.get(ScaleNote.Thi)!;

        const distance =
          getScaleNoteValue(modeKeyElement.scaleNote) -
          getScaleNoteValue(ScaleNote.Thi);

        workspace.intervalIndex = workspace.scale.scaleNoteMap.get(
          modeKeyElement.scaleNote,
        )!;

        if (modeKeyElement.fthora) {
          this.applyFthora(modeKeyElement.fthora, workspace);
        }

        const moria = this.moriaBetweenNotes(
          di,
          workspace.scale.intervals,
          distance,
        );

        workspace.frequency = this.changeFrequency(frequencyDi, moria);

        console.log(
          'mode key change',
          workspace.frequency,
          moria,
          di,
          workspace.intervalIndex,
        );
      } else if (element.elementType === ElementType.Martyria) {
        const martyriaElement = element as MartyriaElement;

        if (martyriaElement.tempo != null) {
          // TODO add bpm to tempo element and use tempoToBpmMap
          // as a fallback
          const bpm = this.tempoToBpmMap.get(martyriaElement.tempo)!;
          beat = this.beatLengthFromBpm(bpm);
        }

        if (martyriaElement.fthora) {
          this.applyFthora(martyriaElement.fthora, workspace);
        }
      } else if (element.elementType === ElementType.Tempo) {
        const tempoElement = element as TempoElement;

        // TODO add bpm to tempo element and use tempoToBpmMap
        // as a fallback
        const bpm = this.tempoToBpmMap.get(tempoElement.neume)!;
        beat = this.beatLengthFromBpm(bpm);
      }
    }

    this.processGorgons(events, gorgonIndexes);

    // Calculate times
    let time = 0;

    for (let event of events) {
      event.time = time;
      time += event.duration;
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

  beatLengthFromBpm(bpm: number) {
    return (1 / bpm) * 60;
  }

  moriaBetweenNotes(
    intervalIndex: number,
    intervals: number[],
    distance: number,
  ) {
    let moria = 0;

    const abs = Math.abs(distance);
    const sign = Math.sign(distance);

    for (let i = 0; i < abs; i++) {
      let index =
        sign > 0
          ? intervalIndex
          : this.mod(intervalIndex - 1, intervals.length);

      moria += intervals[index] * sign;

      intervalIndex = this.mod(intervalIndex + sign, intervals.length);
    }

    return moria;
  }

  moveDistance(workspace: PlaybackWorkspace, distance: number) {
    if (distance === 0) {
      return;
    }

    const moria = this.moriaBetweenNotes(
      workspace.intervalIndex,
      workspace.scale.intervals,
      distance,
    );

    workspace.intervalIndex = this.mod(
      workspace.intervalIndex + distance,
      workspace.scale.intervals.length,
    );

    workspace.frequency = this.changeFrequency(workspace.frequency, moria);
  }

  getScaleFromFthora(fthora: Fthora) {
    return this.scales.find(
      (x) => x.name === this.fthoraToScaleMap.get(fthora),
    );
  }

  applyFthora(fthora: Fthora, workspace: PlaybackWorkspace) {
    if (!this.getScaleFromFthora(fthora)) {
      return;
    }

    workspace.scale = this.getScaleFromFthora(fthora)!;

    workspace.intervalIndex =
      workspace.scale.fthoraMap.get(fthora) ?? workspace.intervalIndex;

    console.log('applyFthora', fthora);
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

  fthoraToScaleMap = new Map<Fthora, PlaybackScaleName>([
    [Fthora.DiatonicNiLow_Top, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicNiLow_Bottom, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicPa_Top, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicPa_Bottom, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicVou_Top, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicGa_Top, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicThi_Top, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicThi_Bottom, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicKe_Top, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicKe_Bottom, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicZo_Top, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicNiHigh_Top, PlaybackScaleName.Diatonic],
    [Fthora.DiatonicNiHigh_Bottom, PlaybackScaleName.Diatonic],

    [Fthora.SoftChromaticPa_Top, PlaybackScaleName.SoftChromatic],
    [Fthora.SoftChromaticPa_Bottom, PlaybackScaleName.SoftChromatic],
    [Fthora.SoftChromaticThi_Top, PlaybackScaleName.SoftChromatic],
    [Fthora.SoftChromaticThi_Bottom, PlaybackScaleName.SoftChromatic],

    [Fthora.HardChromaticPa_Top, PlaybackScaleName.HardChromatic],
    [Fthora.HardChromaticPa_Bottom, PlaybackScaleName.HardChromatic],
    [Fthora.HardChromaticThi_Top, PlaybackScaleName.HardChromatic],
    [Fthora.HardChromaticThi_Bottom, PlaybackScaleName.HardChromatic],
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

    [GorgonNeume.Argon, [0.5, 0.5, -1]],
    [GorgonNeume.Hemiolion, [0.5, 0.5, -2]],
    [GorgonNeume.Diargon, [0.5, 0.5, -3]],
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

  tempoToBpmMap = new Map<TempoSign, number>([
    [TempoSign.VerySlow, 40], // < 56 triargon?
    [TempoSign.Slower, 56], // 56 - 80 diargon
    [TempoSign.Slow, 80], // 80 - 100 hemiolion
    [TempoSign.Moderate, 100], // 100 - 168 argon
    [TempoSign.Medium, 130], // 130 argon + gorgon
    [TempoSign.Quick, 168], // 168 - 208 gorgon
    [TempoSign.Quicker, 208], // 208+ digorgon
    [TempoSign.VeryQuick, 250], // unattested? trigorgon
  ]);

  /////////////////////////
  // Scales
  /////////////////////////

  diatonicScale: PlaybackScale = {
    name: PlaybackScaleName.Diatonic,
    intervals: [12, 10, 8, 12, 12, 10, 8],
    scaleNoteMap: new Map<ScaleNote, number>([
      [ScaleNote.VouLow, 2],
      [ScaleNote.GaLow, 3],
      [ScaleNote.ThiLow, 4],
      [ScaleNote.KeLow, 5],
      [ScaleNote.Zo, 6],
      [ScaleNote.Ni, 0],
      [ScaleNote.Pa, 1],
      [ScaleNote.Vou, 2],
      [ScaleNote.Ga, 3],
      [ScaleNote.Thi, 4],
      [ScaleNote.Ke, 5],
      [ScaleNote.Zo, 6],
      [ScaleNote.NiHigh, 0],
      [ScaleNote.PaHigh, 1],
      [ScaleNote.VouHigh, 2],
      [ScaleNote.GaHigh, 3],
      [ScaleNote.ThiHigh, 4],
      [ScaleNote.KeHigh, 5],
    ]),
    fthoraMap: new Map<Fthora, number>([
      [Fthora.DiatonicNiLow_Top, 0],
      [Fthora.DiatonicNiLow_Bottom, 0],
      [Fthora.DiatonicPa_Top, 1],
      [Fthora.DiatonicPa_Bottom, 1],
      [Fthora.DiatonicVou_Top, 2],
      [Fthora.DiatonicGa_Top, 3],
      [Fthora.DiatonicThi_Top, 4],
      [Fthora.DiatonicThi_Bottom, 4],
      [Fthora.DiatonicKe_Top, 5],
      [Fthora.DiatonicKe_Bottom, 5],
      [Fthora.DiatonicZo_Top, 6],
      [Fthora.DiatonicNiHigh_Top, 0],
      [Fthora.DiatonicNiHigh_Bottom, 0],
    ]),
  };

  hardChromaticScale: PlaybackScale = {
    name: PlaybackScaleName.HardChromatic,
    intervals: [6, 20, 4, 12],
    scaleNoteMap: new Map<ScaleNote, number>([
      [ScaleNote.VouLow, 2],
      [ScaleNote.GaLow, 3],
      [ScaleNote.ThiLow, 0],
      [ScaleNote.KeLow, 1],
      [ScaleNote.Zo, 2],
      [ScaleNote.Ni, 3],
      [ScaleNote.Pa, 0],
      [ScaleNote.Vou, 1],
      [ScaleNote.Ga, 2],
      [ScaleNote.Thi, 3],
      [ScaleNote.Ke, 0],
      [ScaleNote.Zo, 1],
      [ScaleNote.NiHigh, 2],
      [ScaleNote.PaHigh, 3],
      [ScaleNote.VouHigh, 0],
      [ScaleNote.GaHigh, 1],
      [ScaleNote.ThiHigh, 2],
      [ScaleNote.KeHigh, 3],
    ]),
    fthoraMap: new Map<Fthora, number>([
      [Fthora.HardChromaticPa_Top, 0],
      [Fthora.HardChromaticPa_Bottom, 0],
      [Fthora.HardChromaticThi_Top, 3],
      [Fthora.HardChromaticThi_Bottom, 3],
    ]),
  };

  softChromaticScale: PlaybackScale = {
    name: PlaybackScaleName.SoftChromatic,

    intervals: [8, 14, 8, 12],
    scaleNoteMap: new Map<ScaleNote, number>([
      [ScaleNote.VouLow, 3],
      [ScaleNote.GaLow, 0],
      [ScaleNote.ThiLow, 1],
      [ScaleNote.KeLow, 2],
      [ScaleNote.Zo, 3],
      [ScaleNote.Ni, 0],
      [ScaleNote.Pa, 1],
      [ScaleNote.Vou, 2],
      [ScaleNote.Ga, 3],
      [ScaleNote.Thi, 0],
      [ScaleNote.Ke, 1],
      [ScaleNote.Zo, 2],
      [ScaleNote.NiHigh, 3],
      [ScaleNote.PaHigh, 0],
      [ScaleNote.VouHigh, 1],
      [ScaleNote.GaHigh, 2],
      [ScaleNote.ThiHigh, 3],
      [ScaleNote.KeHigh, 0],
    ]),
    fthoraMap: new Map<Fthora, number>([
      [Fthora.SoftChromaticPa_Top, 3],
      [Fthora.SoftChromaticPa_Bottom, 3],
      [Fthora.SoftChromaticThi_Top, 0],
      [Fthora.SoftChromaticThi_Bottom, 0],
    ]),
  };

  scales: PlaybackScale[] = [
    this.diatonicScale,
    this.softChromaticScale,
    this.hardChromaticScale,
  ];
}

// For debugging
//(window as any)._audioService = new AudioService();
//(window as any)._playbackService = new PlaybackService();
