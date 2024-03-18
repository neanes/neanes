# Neanes - A Byzantine Chant Scorewriter

[![CI](https://github.com/neanes/neanes/actions/workflows/ci.yml/badge.svg)](https://github.com/neanes/neanes/actions/workflows/ci.yml)

Neanes (pronounced neh-ah-ness) is a free and open source scorewriter for notating Byzantine Chant.

<img src="images/demo.png?raw=true" alt="Demo Screen" width="100%"/>

## Features

- WYSIWYG design
- Rapid entry of neumes and lyrics
- Automatic alignment of supporting neumes (i.e. fthoras, accidentals, klasmas, gorgons, et al)
- Automatic calculation of martyria
- Print or export to PDF
- Export to HTML using [ByzHtml](https://danielgarthur.github.io/byzhtml) web components
- Export to PNG

## Purpose

This software is intended to create simple scores that contain:

- A title
- A mode signature
- Neumes and lyrics

It is not intended to be a fully-featured word processor.

## Examples

Example files can be found in the [examples](examples/) folder.

## How to Download

Download the latest release on the [releases page](https://github.com/neanes/neanes/releases). The latest release can also be found [here](https://neanes.github.io/neanes/download).

A web version of the app with reduced functionality can be found [here](https://neanes.github.io/neanes/web-app/).

## How-to Guide

To learn how to use the software, read the [guide](https://neanes.github.io/neanes/guide).

## Building

### Prerequisites

- Node.js 20.x or later

### Project Setup

First install the project dependencies:

```
corepack enable npm
npm install
```

### Release Build

To create a release build, type:

```
npm run build
```

The build artifacts are found in `dist/`. For Windows, the installer will be called `Neanes Setup [version].exe`. The raw files can be found in `dist/win_unpacked`.

### Development

To run the development server, type:

```
npm run dev
```

This will launch the application in development mode. As changes are made to the source code, the app will reload automatically.

The [Vue Devtools](https://devtools-next.vuejs.org/) extension is available in development mode.
To enable it, add the following to `.env.local` and/or `.env.web.local`:

```
VITE_ENABLE_DEV_TOOLS=true
```

Any change that updates `package.json` _must_ include the corresponding update to `package-lock.json` after running `npm install`.

### Linting

To check that the code is linted, type:

```
npm run lint
```

To automatically fix any lint issues, type:

```
npm run lint:fix
```

### Tests

To run tests before committing, type:

```
npm test
```

### IDE Support

When using [Visual Studio Code](https://github.com/microsoft/vscode), install the following extension:

- [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

### Localization

To test localization support, add the following to `.env.local` and/or `.env.web.local`:

```
VITE_PSEUDOLOCALIZATION=true
```

This enables [pseudolocalization](https://en.wikipedia.org/wiki/Pseudolocalization) for all localized strings.

## License

This project is licensed under the [GNU General Public License, version 3](./LICENSE).

The following bundled fonts are licensed under the [SIL Open Font License (OFL), version 1.1](https://scripts.sil.org/OFL):

- [GFS Didot](https://www.greekfontsociety-gfs.gr/)
- [Noto Naskh Arabic](https://github.com/notofonts/arabic)
- [Source Serif](https://github.com/adobe-fonts/source-serif)

## Acknowledgements

This software uses the "EZ" Byzantine Music Font Package created at St. Anthony's Greek Orthodox Monastery. See [the monastery's website](https://stanthonysmonastery.org/pages/writing-with-byzantine-notation) for more details. Thank you for your work on these fonts, without which this program would not be possible.
