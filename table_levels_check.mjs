import { existsSync, readFileSync } from 'fs';

// src/table_levels.ts is a copy from the VS Code twin checked out beside this repo, CI has no twin so the check skips
const original = '../vscode-nnyj-syntax-highlight/src/inline/parser/table_levels.ts';
const copy = 'src/table_levels.ts';
const read = path => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
if (existsSync(original) && read(original) !== read(copy)) {
  console.error(`${copy} differs from ${original}: edit the original, then run cp ${original} ${copy}`);
  process.exit(1);
}
