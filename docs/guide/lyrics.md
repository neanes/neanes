# Lyrics

You can enter lyrics directly beneath the neumes or edit a whole passage in the Lyrics pane. Direct entry is convenient while writing a score. The Lyrics pane is better for replacing text, shifting syllables, or preparing a prosomoion.

## Enter lyrics directly

Click beneath a neume and type. The following keys help you move between the neumes and their lyrics:

- Press <kbd>Space</kbd> or <kbd>Tab</kbd> to move to the next lyric box.
- Press <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Right Arrow</kbd> to move to the next lyric box.
- Press <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Left Arrow</kbd> to move to the previous lyric box.
- Press <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Space</kbd> to enter an actual space.
- Press <kbd>Right Arrow</kbd> at the end of a lyric to move to the next box, or <kbd>Left Arrow</kbd> at the beginning to move to the previous box.
- Press <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Down Arrow</kbd> to move from a neume to its lyrics.
- Press <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Up Arrow</kbd> to return to the neume.

## Make a melisma

End a lyric with an underscore or hyphen (`_` or `-`) to start a melisma. Enter a single underscore or hyphen beneath each following neume that continues the syllable. Neanes draws the melisma for you.

To type `_` or `-` without advancing to the next lyric box, hold <kbd>Ctrl</kbd> on Windows or Linux, or <kbd>Option</kbd> on macOS.

### Greek melismata

When entering Greek directly beneath the neumes, use an underscore for a syllable that ends in a vowel. Neanes continues its final vowel or vowels, and the repeated text appears lighter than the original lyric.

For example, enter <kbd>και\_</kbd> <kbd>\_</kbd> <kbd>\_</kbd>:

![A Greek melisma continuing the final vowels of και](./images/guide-lyrics-greek-example-2.png)

For a syllable that ends in a consonant, use a hyphen to continue the vowel inside the syllable. For example, enter <kbd>τω-</kbd> <kbd>-</kbd> <kbd>ων</kbd>:

![A Greek melisma continuing the inner vowel of των](./images/guide-lyrics-greek-example-1.png)

These forms distinguish the single syllable `των` from the two words `τω ων`, even though their melismata can look alike in the score. In the Lyrics pane, the consonant-ending example is written `των___`; the two-word form is written `τω__ ων`. Neanes converts the compact pane text to the appropriate fragments beneath the neumes.

To use the non-Greek behavior instead, enable `Disable Greek Melismata` in `File > Page Setup`.

## Edit lyrics in the Lyrics pane

Choose `View > Lyrics` or press <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>L</kbd>. The pane shows the score's lyrics as editable text. Changes in the pane are assigned back to the neumes, and changes made beneath individual neumes are reflected in the pane.

This is a quick way to replace a passage or shift lyrics left or right without opening every lyric box.

Drop caps appear as part of the pane's text and receive the next non-space character when you replace the text. Blank lines mark passages separated by mode changes or by martyriæ that end a line or are aligned to the right. They show the score's structure but do not consume lyric positions.

![The Lyrics pane showing four lyrics assigned to four neumes](./images/guide-lyrics-toolbar-1.png)

When lyrics are not locked, they belong to their neumes. If you delete the neume carrying `two`, the pane changes from:

```text
one two three four
```

to:

```text
one three four
```

### Leave a neume blank

Use a single underscore separated by spaces as a placeholder when a neume should receive no lyric:

```text
one _ two
```

![An underscore leaving the middle neume without a lyric](./images/guide-lyrics-toolbar-blank-1.png)

## Lock lyrics while editing the melody

Enable `Lock Lyrics` in the Lyrics pane when you want the text to remain fixed while adding or removing neumes. While lyrics are locked, edit the text in the pane rather than beneath individual neumes.

Suppose four neumes have these lyrics:

```text
one two three four
```

![Four locked lyrics assigned to four neumes](./images/guide-lyrics-toolbar-locked-1.png)

If you delete the second neume, the text remains unchanged. Neanes assigns the four lyrics to the three remaining neumes as far as it can:

![The same locked lyrics after the second neume is deleted](./images/guide-lyrics-toolbar-locked-2.png)

If you add a fourth neume, it receives `four`:

![The final locked lyric assigned after adding a fourth neume](./images/guide-lyrics-toolbar-locked-3.png)

## Choose which neumes receive lyrics

Select a neume and open `View > Properties`. The `Accepts Lyrics` setting controls how the Lyrics pane treats that neume.

| Value        | Meaning                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------- |
| Default      | Uses the neume's normal behavior. For example, rests do not receive lyrics by default.                            |
| Yes          | Assigns the next ordinary lyric to the neume.                                                                     |
| No           | Skips the neume when assigning text from the Lyrics pane.                                                         |
| Melisma Only | Assigns a melisma continuation, represented by a hyphen or underscore, without consuming the next ordinary lyric. |

`Melisma Only` is especially useful in templates. It lets the Lyrics pane skip the continuation neumes automatically, so replacement text does not need to contain a run of underscores or hyphens.

![A phrase whose middle neumes carry melisma continuations](./images/guide-lyrics-toolbar-accept-1.png)

With every neume set to `Default`, you must write the continuations explicitly:

```text
With___ what fair
```

If the second and third neumes are set to `Melisma Only`, you can write:

```text
With what fair
```

Neanes supplies the continuations on those two neumes.

Choose `Save Current Melismas` in the Lyrics pane to set `Accepts Lyrics` throughout the score from the lyrics that are already present. Melisma continuation neumes become `Melisma Only`, blank non-melismatic neumes become `No`, and the remaining neumes return to `Default`.

## Format lyrics

Select a lyric beneath a neume to use the text controls in the bottom toolbar. You can apply a paragraph style, choose a font and size, add bold, italic, or underline formatting, and insert the supplied special characters. The Properties pane contains additional settings for the selected lyric.

For consistent formatting throughout the score, choose `Format > Paragraph Styles` and modify the built-in **Lyrics** style instead of formatting each neume separately. See [Apply a paragraph style](/guide/text-and-styles.html#apply-a-paragraph-style).

## Create a prosomoion from an automelon

A prosomoion uses the melodic pattern of an automelon with different words. Neanes can preserve the automelon's syllable and melisma pattern while you replace its text.

### Prepare the template

1. Create the automelon with its melody and original lyrics.
2. Open the Lyrics pane and choose `Save Current Melismas`. This records which neumes carry syllables and which carry only melisma continuations.
3. Enable `Lock Lyrics`.
4. Save the score as your template.

Keep the original template unchanged. Make a copy whenever you want to create a new prosomoion.

### Prepare the new text

For languages that use written syllable breaks, hyphenate the new text before pasting it. For example:

```text
With what fair crowns of praise shall we crown the di-vine and all-laud-a-ble hier-arch?
```

Paste the text into the Lyrics pane. Neanes assigns each syllable to the neumes that accept ordinary lyrics and fills the `Melisma Only` positions automatically.

The new text may not match the automelon's pattern perfectly. After pasting, check the score. Add or remove syllable breaks and blank placeholders in the pane, or change individual `Accepts Lyrics` settings where necessary.

You can compare the result with the project's example: [editable BYZX](https://github.com/neanes/neanes/blob/master/examples/English%20-%20Prosomia%20-%20With%20What%20Fair%20Crowns.byzx) and [PDF](https://github.com/neanes/neanes/blob/master/examples/English%20-%20Prosomia%20-%20With%20What%20Fair%20Crowns.pdf).

### Use Greek text

In the Lyrics pane, Greek text uses spaces rather than written hyphens between syllables. Separate the syllables with single spaces and use underscores for melismata. This differs from direct entry beneath the neumes, where a hyphen marks a consonant-ending melisma. In the pane, place the underscore at the end of the complete syllable instead.

For example, `των___` spreads the single syllable `των` across three neumes:

![The Greek lyric των followed by a melisma](./images/guide-lyrics-greek-example-1.png)
