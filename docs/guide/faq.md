<script setup>
import { PhAlignRight } from '@phosphor-icons/vue';
</script>

# Frequently Asked Questions

## How do I copy and paste neumes with their lyrics?

Select the neumes and copy them. Select the element where the copied passage should begin, then choose `Edit > Paste with Lyrics`.

Ordinary **Paste** copies the music without its lyrics. **Paste with Lyrics** copies both. The active entry mode determines how the passage is placed: **Auto** begins replacing the following elements, **Insert** adds the passage after the selection, and **Single** begins replacing at the selected element.

See [Cut, copy, and paste](/guide/editor-basics.html#cut-copy-and-paste) for more about selection and entry modes.

## How do I override a martyria when the next hymn begins on a different note?

Select the martyria and open `View > Properties`. Turn off the martyria's **Auto** setting, then choose the **Note** and **Scale** that should introduce the next hymn.

For example, a hymn may end on Pa while the next hymn begins on Di. An automatic martyria describes the music that precedes it, so a manual martyria is needed to show Di instead.

If the note and scale are correct but the displayed martyria sign needs a different form, use **Martyria Sign Override** instead.

See [Insert a martyria](/guide/writing-music.html#insert-a-martyria) for the full martyria workflow.

## How do I add a neume next to a martyria to establish the next starting pitch?

Select the martyria and enable **Align Right** <PhAlignRight class="guide-action-icon" weight="duotone" aria-hidden="true" /> in its bottom toolbar. A **Neume** <span class="guide-inline-neume" aria-hidden="true">&#xe082;</span> control appears in the same toolbar. Open that control and choose the quantitative neume that supplies the interval needed to reach the starting pitch of the following phrase.

The quantitative neume appears directly to the right of the martyria and changes the pitch from which the following music is calculated. It belongs to the martyria; choosing a neume in the Neume Selector would create a separate score element instead.

This is useful, for example, when writing the prosomoion **Ὢ τοῦ παραδόξου θαύματος** and the neume beside the martyria establishes the pitch of the phrase that follows.

See [Insert a martyria](/guide/writing-music.html#insert-a-martyria) for more about right-aligned martyriæ.

## How do I show a diatonic fthora in the initial martyria?

Open the Initial Martyria dialog by double-clicking the initial martyria, right-clicking it and choosing `Change Initial Martyria`, or selecting it and using **Change Initial Martyria** in the bottom toolbar.

Enable **Show Diatonic Fthoræ** at the bottom of the dialog. Select the desired mode and initial-martyria template, then choose **Update**. Templates that provide an optional diatonic fthora will show it in their preview and in the score.

See [Choose the initial martyria](/guide/#_3-choose-the-initial-martyria) for the basic initial-martyria workflow.
