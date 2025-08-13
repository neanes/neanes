# Contributing to Neanes

## Building

### Prerequisites

- Node.js 22.x or later

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

#### Debugging the Audio and Playback services

To turn on log messages for the audio and playback services, add the following to `.env.local`.

```
VITE_AUDIO_SERVICE_LOGGING_ENABLED=true
VITE_PLAYBACK_SERVICE_LOGGING_ENABLED=true
```

## Linting

To check that the code is linted, type:

```
npm run lint
```

To automatically fix any lint issues, type:

```
npm run lint:fix
```

## Tests

To run tests before committing, type:

```
npm test
```

## IDE Support

When using [Visual Studio Code](https://github.com/microsoft/vscode), install the following extension:

- [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Localization

To test localization support, add the following to `.env.local` and/or `.env.web.local`:

```
VITE_PSEUDOLOCALIZATION=true
```

This enables [pseudolocalization](https://en.wikipedia.org/wiki/Pseudolocalization) for all localized strings.
