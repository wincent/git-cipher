/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import {open} from 'node:fs/promises';
import {join, relative, resolve} from 'node:path';

import Config from '../Config.mjs';
import commonOptions from '../commonOptions.mjs';
import * as log from '../log.mjs';

export const description = 'what this thing does';

export const longDescription = `
  long description here
`;

export async function execute(invocation: Invocation): Promise<number> {
  if (!invocation.args.length) {
    log.error(`\`git-cipher add\` expects one or more files to add`);
    return 1;
  }

  const config = new Config();

  // Note: these are relative to the top-level.
  const managedFiles = await config.managedFiles();
  if (!managedFiles) {
    log.warn('proceeding without list of managed files');
  }

  const topLevel = await config.topLevel();
  if (!topLevel) {
    log.error('cannot do `add` operation without top-level');
    return 1;
  }

  const filesToAdd = [];
  const managedFilesSet = new Set(managedFiles);
  for (const file of invocation.args) {
    const normalized = relative(topLevel, resolve(file));
    if (managedFilesSet.has(normalized)) {
      log.info(`file ${file} is already managed by git-cipher`);
      // TODO: freshen definition... in case it is missing some fields
    } else {
      // TODO: confirm that this is actually a file (ie. existing, not a directory)
      log.info(`file ${file} is not yet managed by git-cipher`);
      filesToAdd.push(normalized);
    }
  }

  const output = filesToAdd
    .map(
      (file) =>
        `${quotePath(file)}\tdiff=git-cipher\tfilter=git-cipher\tmerge=git-cipher\n`
    )
    .join('');

  // A racy check to see whether the file already has a final newline is better
  // than no check at all.
  const gitattributes = await open(join(topLevel, '.gitattributes'), 'as+');
  const stat = await gitattributes.stat();
  let needsNewline = false;
  if (stat.size) {
    const data = await gitattributes.read({
      length: 1,
      position: stat.size - 1,
    });
    if (data.bytesRead && data.buffer[0] !== '\n'.charCodeAt(0)) {
      needsNewline = true;
    }
  }

  await gitattributes.appendFile(needsNewline ? `\n${output}` : output);

  // TODO add encrypted version to index

  return 0;
}

function quotePath(path: string): string {
  const escaped = path
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');

  if (escaped === path && !path.includes(' ')) {
    return path;
  } else {
    return  `"${escaped}"`;
  }
}

export const optionsSchema = {
  ...commonOptions,
} as const;