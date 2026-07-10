#!/usr/bin/env node

import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const allowedRoot = '/tmp/neanes-recovery-scenarios';
const schemaVersion = 1;
const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);
const defaultAppVersionPromise = loadAppVersion();

const scenarios = {
  'untitled-auto': seedUntitledAuto,
  'saved-source-matches': seedSavedSourceMatches,
  'saved-source-changed': seedSavedSourceChanged,
  'saved-source-missing': seedSavedSourceMissing,
  'two-files-to-recover': seedTwoFilesToRecover,
  'current-and-previous': seedCurrentAndPrevious,
  'corrupt-current': seedCorruptCurrent,
  'stale-temp': seedStaleTemp,
  'recent-temp': seedRecentTemp,
};

export async function seedRecoveryScenario({
  force = false,
  scenario,
  userDataDir,
} = {}) {
  if (typeof scenario !== 'string' || scenario.length === 0) {
    throw new Error('A recovery scenario name is required.');
  }

  const scenarioHandler = scenarios[scenario];

  if (scenarioHandler == null) {
    const supported = Object.keys(scenarios).sort().join(', ');
    throw new Error(
      `Unknown recovery scenario "${scenario}". Supported scenarios: ${supported}`,
    );
  }

  if (typeof userDataDir !== 'string' || userDataDir.length === 0) {
    throw new Error('A user-data directory is required.');
  }

  const resolvedUserDataDir = path.resolve(userDataDir);
  ensureSafeToDelete(resolvedUserDataDir, force);

  await fs.rm(resolvedUserDataDir, { force: true, recursive: true });
  await fs.mkdir(resolvedUserDataDir, { recursive: true });

  const recoveryDir = path.join(resolvedUserDataDir, 'recovery');
  await fs.mkdir(recoveryDir, { recursive: true });

  const context = {
    appVersion: await defaultAppVersionPromise,
    recoveryDir,
    resolvedUserDataDir,
    scenario,
  };

  await scenarioHandler(context);

  return {
    recoveryDir,
    resolvedUserDataDir,
    scenario,
  };
}

export function createRecoveryEnvelope({
  appVersion,
  createdAt,
  filePath,
  hasUnsavedChanges,
  score,
  snapshotId,
  sourceMtimeMs,
  sourceSize,
  tempFileName,
  updatedAt,
  workspaceId,
}) {
  const contentLength = Buffer.byteLength(score, 'utf8');
  const contentSha256 = crypto
    .createHash('sha256')
    .update(score, 'utf8')
    .digest('hex');

  return {
    schemaVersion,
    snapshotId,
    workspaceId,
    createdAt: createdAt ?? updatedAt,
    updatedAt,
    filePath,
    tempFileName,
    hasUnsavedChanges,
    score,
    sourceMtimeMs,
    sourceSize,
    appVersion,
    contentLength,
    contentSha256,
  };
}

async function seedUntitledAuto(context) {
  const score = await readExampleScore('examples/Rich Text.byzx');
  await writeSnapshotFile(
    path.join(context.recoveryDir, `${workspaceIds.untitledAuto}.json`),
    createRecoveryEnvelope({
      appVersion: context.appVersion,
      filePath: null,
      hasUnsavedChanges: true,
      score,
      snapshotId: snapshotIds.untitledAuto,
      sourceMtimeMs: null,
      sourceSize: null,
      tempFileName: 'untitled-auto.byzx',
      updatedAt: timestamps.untitledAuto,
      workspaceId: workspaceIds.untitledAuto,
    }),
  );
}

async function seedSavedSourceMatches(context) {
  const score = await readExampleScore(
    'examples/Greek - Resurrectional Apolytikion - First Mode.byzx',
  );
  const sourcePath = path.join(
    context.resolvedUserDataDir,
    'saved-source-matches-source.byzx',
  );
  const sourceStats = await writeSourceFile(sourcePath, score);

  await writeSnapshotFile(
    path.join(context.recoveryDir, `${workspaceIds.savedSourceMatches}.json`),
    createRecoveryEnvelope({
      appVersion: context.appVersion,
      filePath: sourcePath,
      hasUnsavedChanges: false,
      score,
      snapshotId: snapshotIds.savedSourceMatches,
      sourceMtimeMs: sourceStats.mtimeMs,
      sourceSize: sourceStats.size,
      tempFileName: 'saved-source-matches.byzx',
      updatedAt: timestamps.savedSourceMatches,
      workspaceId: workspaceIds.savedSourceMatches,
    }),
  );
}

async function seedSavedSourceChanged(context) {
  const score = await readExampleScore(
    'examples/English - Lord I Have Cried - First Mode.byzx',
  );
  const sourcePath = path.join(
    context.resolvedUserDataDir,
    'saved-source-changed-source.byzx',
  );
  const sourceStats = await writeSourceFile(sourcePath, score);

  await writeSnapshotFile(
    path.join(context.recoveryDir, `${workspaceIds.savedSourceChanged}.json`),
    createRecoveryEnvelope({
      appVersion: context.appVersion,
      filePath: sourcePath,
      hasUnsavedChanges: true,
      score,
      snapshotId: snapshotIds.savedSourceChanged,
      sourceMtimeMs: sourceStats.mtimeMs,
      sourceSize: sourceStats.size,
      tempFileName: 'saved-source-changed.byzx',
      updatedAt: timestamps.savedSourceChanged,
      workspaceId: workspaceIds.savedSourceChanged,
    }),
  );

  await fs.appendFile(sourcePath, '\n', 'utf8');
  const changedTime = new Date(timestamps.savedSourceChanged + 60_000);
  await fs.utimes(sourcePath, changedTime, changedTime);
}

async function seedSavedSourceMissing(context) {
  const score = await readExampleScore(
    'examples/Greek - Resurrectional Apolytikion - Second Mode.byzx',
  );
  const sourcePath = path.join(
    context.resolvedUserDataDir,
    'saved-source-missing-source.byzx',
  );

  await writeSnapshotFile(
    path.join(context.recoveryDir, `${workspaceIds.savedSourceMissing}.json`),
    createRecoveryEnvelope({
      appVersion: context.appVersion,
      filePath: sourcePath,
      hasUnsavedChanges: false,
      score,
      snapshotId: snapshotIds.savedSourceMissing,
      sourceMtimeMs: null,
      sourceSize: null,
      tempFileName: 'saved-source-missing.byzx',
      updatedAt: timestamps.savedSourceMissing,
      workspaceId: workspaceIds.savedSourceMissing,
    }),
  );
}

async function seedTwoFilesToRecover(context) {
  const firstScore = await readExampleScore(
    'examples/Greek - Resurrectional Apolytikion - First Mode.byzx',
  );
  const secondScore = await readExampleScore(
    'examples/English - Lord I Have Cried - First Mode.byzx',
  );

  await writeSnapshotFile(
    path.join(context.recoveryDir, `${workspaceIds.twoFilesFirst}.json`),
    createRecoveryEnvelope({
      appVersion: context.appVersion,
      filePath: path.join(context.resolvedUserDataDir, 'missing-a.byzx'),
      hasUnsavedChanges: false,
      score: firstScore,
      snapshotId: snapshotIds.twoFilesFirst,
      sourceMtimeMs: null,
      sourceSize: null,
      tempFileName: 'missing-a.byzx',
      updatedAt: timestamps.twoFilesFirst,
      workspaceId: workspaceIds.twoFilesFirst,
    }),
  );

  await writeSnapshotFile(
    path.join(context.recoveryDir, `${workspaceIds.twoFilesSecond}.json`),
    createRecoveryEnvelope({
      appVersion: context.appVersion,
      filePath: path.join(context.resolvedUserDataDir, 'missing-b.byzx'),
      hasUnsavedChanges: false,
      score: secondScore,
      snapshotId: snapshotIds.twoFilesSecond,
      sourceMtimeMs: null,
      sourceSize: null,
      tempFileName: 'missing-b.byzx',
      updatedAt: timestamps.twoFilesSecond,
      workspaceId: workspaceIds.twoFilesSecond,
    }),
  );
}

async function seedCurrentAndPrevious(context) {
  const scoreCurrent = await readExampleScore(
    'examples/English - Prosomia - With What Fair Crowns.byzx',
  );
  const scorePrevious = await readExampleScore(
    'examples/Custom Mode Key Demo.byzx',
  );
  const sourcePath = path.join(
    context.resolvedUserDataDir,
    'current-and-previous-source.byzx',
  );
  const sourceStats = await writeSourceFile(sourcePath, scoreCurrent);

  await writeSnapshotFile(
    path.join(context.recoveryDir, `${workspaceIds.currentAndPrevious}.json`),
    createRecoveryEnvelope({
      appVersion: context.appVersion,
      filePath: sourcePath,
      hasUnsavedChanges: true,
      score: scoreCurrent,
      snapshotId: snapshotIds.currentAndPrevious,
      sourceMtimeMs: sourceStats.mtimeMs,
      sourceSize: sourceStats.size,
      tempFileName: 'current-and-previous.byzx',
      updatedAt: timestamps.currentAndPreviousCurrent,
      workspaceId: workspaceIds.currentAndPrevious,
    }),
  );

  await writeSnapshotFile(
    path.join(
      context.recoveryDir,
      `${workspaceIds.currentAndPrevious}.prev.json`,
    ),
    createRecoveryEnvelope({
      appVersion: context.appVersion,
      createdAt: timestamps.currentAndPreviousPrevious,
      filePath: sourcePath,
      hasUnsavedChanges: true,
      score: scorePrevious,
      snapshotId: snapshotIds.currentAndPreviousPrevious,
      sourceMtimeMs: sourceStats.mtimeMs,
      sourceSize: sourceStats.size,
      tempFileName: 'current-and-previous.prev.byzx',
      updatedAt: timestamps.currentAndPreviousPrevious,
      workspaceId: workspaceIds.currentAndPrevious,
    }),
  );
}

async function seedCorruptCurrent(context) {
  const score = await readExampleScore(
    'examples/Greek - Stathis Series - Let My Prayer.byzx',
  );
  const sourcePath = path.join(
    context.resolvedUserDataDir,
    'corrupt-current-source.byzx',
  );
  const sourceStats = await writeSourceFile(sourcePath, score);

  await fs.writeFile(
    path.join(context.recoveryDir, `${workspaceIds.corruptCurrent}.json`),
    '{not-json',
    'utf8',
  );

  await writeSnapshotFile(
    path.join(context.recoveryDir, `${workspaceIds.corruptCurrent}.prev.json`),
    createRecoveryEnvelope({
      appVersion: context.appVersion,
      filePath: sourcePath,
      hasUnsavedChanges: false,
      score,
      snapshotId: snapshotIds.corruptCurrentPrevious,
      sourceMtimeMs: sourceStats.mtimeMs,
      sourceSize: sourceStats.size,
      tempFileName: 'corrupt-current.prev.byzx',
      updatedAt: timestamps.corruptCurrentPrevious,
      workspaceId: workspaceIds.corruptCurrent,
    }),
  );
}

async function seedStaleTemp(context) {
  const score = await readExampleScore('examples/Rich Text.byzx');
  const tempPath = path.join(
    context.recoveryDir,
    `${workspaceIds.staleTemp}.tmp.json`,
  );

  await writeSnapshotFile(
    tempPath,
    createRecoveryEnvelope({
      appVersion: context.appVersion,
      filePath: null,
      hasUnsavedChanges: true,
      score,
      snapshotId: snapshotIds.staleTemp,
      sourceMtimeMs: null,
      sourceSize: null,
      tempFileName: 'stale-temp.byzx',
      updatedAt: timestamps.staleTemp,
      workspaceId: workspaceIds.staleTemp,
    }),
  );

  const staleTime = new Date(Date.now() - 26 * 60 * 60 * 1000);
  await fs.utimes(tempPath, staleTime, staleTime);
}

async function seedRecentTemp(context) {
  const score = await readExampleScore('examples/Rich Text.byzx');
  const tempPath = path.join(
    context.recoveryDir,
    `${workspaceIds.recentTemp}.tmp.json`,
  );

  await writeSnapshotFile(
    tempPath,
    createRecoveryEnvelope({
      appVersion: context.appVersion,
      filePath: null,
      hasUnsavedChanges: true,
      score,
      snapshotId: snapshotIds.recentTemp,
      sourceMtimeMs: null,
      sourceSize: null,
      tempFileName: 'recent-temp.byzx',
      updatedAt: timestamps.recentTemp,
      workspaceId: workspaceIds.recentTemp,
    }),
  );
}

async function writeSnapshotFile(filePath, envelope) {
  await fs.writeFile(filePath, JSON.stringify({ envelope }, null, 2), 'utf8');
}

async function writeSourceFile(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf8');
  const stats = await fs.stat(filePath);

  return {
    mtimeMs: stats.mtimeMs,
    size: stats.size,
  };
}

async function readExampleScore(exampleRelativePath) {
  return await fs.readFile(path.resolve(repoRoot, exampleRelativePath), 'utf8');
}

async function loadAppVersion() {
  const raw = await fs.readFile(path.join(repoRoot, 'package.json'), 'utf8');
  return JSON.parse(raw).version ?? 'unknown';
}

function ensureSafeToDelete(targetPath, force) {
  if (force) {
    return;
  }

  const rootWithSeparator = `${allowedRoot}${path.sep}`;
  if (targetPath === allowedRoot || targetPath.startsWith(rootWithSeparator)) {
    return;
  }

  throw new Error(
    `Refusing to delete ${targetPath}. Use --force to allow paths outside ${allowedRoot}.`,
  );
}

function parseArgs(argv) {
  const args = {
    force: false,
    scenario: undefined,
    userDataDir: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--force') {
      args.force = true;
      continue;
    }

    if (value === '--user-data-dir') {
      args.userDataDir = argv[index + 1];
      index += 1;
      continue;
    }

    if (value === '--help' || value === '-h') {
      args.scenario = 'help';
      continue;
    }

    if (args.scenario == null) {
      args.scenario = value;
    }
  }

  return args;
}

function printUsage() {
  const supported = Object.keys(scenarios).sort().join(' | ');
  console.log(
    `Usage: seed-recovery.mjs [--force] [--user-data-dir DIR] <scenario>`,
  );
  console.log(`Scenarios: ${supported}`);
  console.log(`Default user-data base: ${allowedRoot}`);
}

const workspaceIds = {
  corruptCurrent: '10000000-0000-4000-8000-000000000001',
  currentAndPrevious: '10000000-0000-4000-8000-000000000002',
  recentTemp: '10000000-0000-4000-8000-000000000003',
  savedSourceChanged: '10000000-0000-4000-8000-000000000004',
  savedSourceMatches: '10000000-0000-4000-8000-000000000005',
  savedSourceMissing: '10000000-0000-4000-8000-000000000006',
  staleTemp: '10000000-0000-4000-8000-000000000007',
  untitledAuto: '10000000-0000-4000-8000-000000000008',
  twoFilesFirst: '10000000-0000-4000-8000-000000000009',
  twoFilesSecond: '10000000-0000-4000-8000-00000000000a',
};

const snapshotIds = {
  corruptCurrentPrevious: '20000000-0000-4000-8000-000000000001',
  currentAndPrevious: '20000000-0000-4000-8000-000000000002',
  currentAndPreviousPrevious: '20000000-0000-4000-8000-000000000003',
  recentTemp: '20000000-0000-4000-8000-000000000004',
  savedSourceChanged: '20000000-0000-4000-8000-000000000005',
  savedSourceMatches: '20000000-0000-4000-8000-000000000006',
  savedSourceMissing: '20000000-0000-4000-8000-000000000007',
  staleTemp: '20000000-0000-4000-8000-000000000008',
  untitledAuto: '20000000-0000-4000-8000-000000000009',
  twoFilesFirst: '20000000-0000-4000-8000-00000000000a',
  twoFilesSecond: '20000000-0000-4000-8000-00000000000b',
};

const timestamps = {
  corruptCurrentPrevious: Date.UTC(2024, 0, 1, 10, 0, 0),
  currentAndPreviousCurrent: Date.UTC(2024, 0, 1, 12, 30, 0),
  currentAndPreviousPrevious: Date.UTC(2024, 0, 1, 11, 45, 0),
  recentTemp: Date.UTC(2024, 0, 1, 13, 0, 0),
  savedSourceChanged: Date.UTC(2024, 0, 1, 12, 15, 0),
  savedSourceMatches: Date.UTC(2024, 0, 1, 12, 5, 0),
  savedSourceMissing: Date.UTC(2024, 0, 1, 12, 10, 0),
  staleTemp: Date.UTC(2024, 0, 1, 8, 0, 0),
  untitledAuto: Date.UTC(2024, 0, 1, 12, 0, 0),
  twoFilesFirst: Date.UTC(2024, 0, 1, 12, 20, 0),
  twoFilesSecond: Date.UTC(2024, 0, 1, 12, 18, 0),
};

if (
  process.argv[1] != null &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  const args = parseArgs(process.argv.slice(2));

  if (args.scenario === 'help' || args.scenario == null) {
    printUsage();
    process.exit(args.scenario == null ? 1 : 0);
  }

  const userDataDir =
    args.userDataDir ?? path.join(allowedRoot, args.scenario, 'userData');

  try {
    const result = await seedRecoveryScenario({
      force: args.force,
      scenario: args.scenario,
      userDataDir,
    });

    console.log(
      `Seeded recovery scenario "${result.scenario}" in ${result.resolvedUserDataDir}`,
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
