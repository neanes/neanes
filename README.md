# Neanes - A Byzantine Chant Scorewriter

[![CI](https://github.com/danielgarthur/neanes/actions/workflows/ci.yml/badge.svg)](https://github.com/danielgarthur/neanes/actions/workflows/ci.yml)

Neanes (pronounced neh-ah-ness) is a free and open source scorewriter for notating Byzantine Chant.

<img src="images/demo.png?raw=true" alt="Demo Screen" width="100%"/>

## Features

- WYSIWYG design
- Rapid entry of neumes and lyrics
- Automatic alignment of supporting neumes (i.e. fthoras, accidentals, klasmas, gorgons, et al)
- Automatic calculation of martyria
- Print or export to PDF

## Purpose

This software is intended to create simple scores that contain:

- A title
- A mode signature
- Neumes and lyrics

It is not intended to be a fully-featured word processor.

## Examples

Example files can be found in the [examples](examples/) folder.

## How to Download

Go to the [releases page](https://github.com/danielgarthur/neanes/releases) and download the setup EXE from the latest release.

## How-to Guide

To learn how to use the software, read the [Getting Started Guide](docs/getting_started.md).

## Building

### Project Setup

First install the project dependencies:

```
npm install
```

### Release Build

To create a release build, type:

```
npm run electron:build
```

The build artifacts are found in `dist_electron/`. For Windows, the installer will be called `Neanes Setup [version].exe`. The raw files can be found in `dist_electron/win_unpacked`.

### Development

To run the development server, type:

```
npm run electron:serve
```

This will launch the application in development mode. As changes are made to the source code, the app will reload automatically.

### Code Formatting

To format the code before committing, type:

```
npm run prettier
```

### Tests

To run tests before committing, type:

```
npm test
```

## Acknowledgements

This software uses the "EZ" Byzantine Music Font Package created at St. Anthony's Greek Orthodox Monastery. See [the monastery's website](https://stanthonysmonastery.org/pages/writing-with-byzantine-notation) for more details. Thank you for your work on these fonts, without which this program would not be possible.
