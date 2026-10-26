import { Plugin } from 'obsidian';
import { ViewPlugin, Decoration, EditorView, ViewUpdate, DecorationSet } from '@codemirror/view';
import { RangeSetBuilder, Text, type Range } from '@codemirror/state';

interface Pattern {
  re: () => RegExp;
  cls: string;
}

const PATTERNS: Pattern[] = [
  { re: () => /^;.*|^\/\/.*/, cls: 'nnyj-comment' },
  { re: () => /^[^|[\]:=*]+:(?!\\)(?!\/)/, cls: 'nnyj-colon' },
  { re: () => /[^`'"|:=*]*?:(?=\s)/g, cls: 'nnyj-colon' },
  { re: () => /(-+>|<-+)/g, cls: 'nnyj-arrow' },
  { re: () => /\([^)]*\)/g, cls: 'nnyj-bracket' },
];

function inlineCodeRanges(text: string): [number, number][] {
  const ranges: [number, number][] = [];
  const re = /`[^`]+`/g;
  let m;
  while ((m = re.exec(text)) !== null)
    ranges.push([m.index, m.index + m[0].length]);
  return ranges;
}

function overlapsCode(from: number, to: number, codeRanges: [number, number][]): boolean {
  return codeRanges.some(([a, b]) => from < b && to > a);
}

function fencedCodeRanges(doc: Text): [number, number][] {
  const ranges: [number, number][] = [];
  let inside = false, start = 0;
  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    if (/^```/.test(line.text)) {
      if (inside) {
        ranges.push([start, line.to]);
        inside = false;
      } else {
        start = line.from;
        inside = true;
      }
    }
  }
  return ranges;
}

interface Match {
  from: number;
  to: number;
  cls: string;
}

function buildDecorations(view: EditorView): DecorationSet {
  const { doc } = view.state;
  const fenced = fencedCodeRanges(doc);
  const matches: Match[] = [];

  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos < to;) {
      const line = doc.lineAt(pos);
      pos = line.to + 1;

      if (fenced.some(([a, b]) => line.from >= a && line.to <= b)) continue;

      const text = line.text;
      const codes = inlineCodeRanges(text);

      for (const { re, cls } of PATTERNS) {
        const regex = re();
        regex.lastIndex = 0;
        let m;
        while ((m = regex.exec(text)) !== null) {
          const mFrom = m.index;
          const mTo = m.index + m[0].length;
          if (!overlapsCode(mFrom, mTo, codes))
            matches.push({ from: line.from + mFrom, to: line.from + mTo, cls });
          if (!regex.global) break;
        }
      }
    }
  }

  matches.sort((a, b) => a.from - b.from || a.to - b.to);

  const builder = new RangeSetBuilder<Decoration>();
  let last = -1;
  for (const { from, to, cls } of matches) {
    if (from < last) continue;
    builder.add(from, to, Decoration.mark({ class: cls }));
    last = to;
  }
  return builder.finish();
}

const LEVEL_CLASSES = [0, 1, 2, 3, 4].map(level => `nnyj-level-${level}`);
const CIRCLE_LEVELS: Record<string, number> = { '🔴': 0, '🟡': 2, '🟢': 4 };
// Leading number after an optional `~` or `$`, trailing text like ` ms` or ` (1.2x)` is ignored.
const RE_NUMBER = /^[~$]*([-+]?\d[\d,]*(?:\.\d+)?)/;
const RE_ROW = /^\s*\|.*\|\s*$/;
const RE_SEP = /^\s*\|[\s:|-]+\|\s*$/;

// Circle cells take the circle's level. Numeric cells scale min..max to red..green, `↓` in the header flips it.
function columnLevels(head: string, cells: string[]): (number | undefined)[] {
  const values = cells.map(cell => {
    const match = RE_NUMBER.exec(cell);
    return match ? parseFloat(match[1]!.replace(/,/g, '')) : undefined;
  });
  const numbers = values.filter(value => value !== undefined);
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  return cells.map((cell, k) => {
    const circle = CIRCLE_LEVELS[[...cell][0] ?? ''];
    const value = values[k];
    if (circle !== undefined || value === undefined || max === min) return circle;
    const level = Math.round((value - min) / (max - min) * 4);
    return head.includes('↓') ? 4 - level : level;
  });
}

function shadeTable(table: HTMLTableElement) {
  const [head, ...rows] = Array.from(table.rows);
  if (!head) return;
  Array.from(head.cells).forEach((headCell, col) => {
    const cells = rows.map(row => row.cells[col]);
    const levels = columnLevels(headCell.textContent, cells.map(cell => cell?.textContent.trim() ?? ''));
    // toggle with force skips unchanged classes, a DOM write would retrigger CodeMirror's observer
    cells.forEach((cell, k) => LEVEL_CLASSES.forEach((cls, level) => cell?.classList.toggle(cls, levels[k] === level)));
  });
}

// Cell spans between unescaped pipes.
function rowCells(text: string): { from: number; to: number; text: string }[] {
  const pipes: number[] = [];
  for (let c = 0; c < text.length; c++)
    if (text[c] === '|' && text[c - 1] !== '\\') pipes.push(c);
  return pipes.slice(1).map((to, k) => ({ from: pipes[k]! + 1, to, text: text.slice(pipes[k]! + 1, to).trim() }));
}

// Shades raw Markdown tables, e.g. indented under a list item or in source mode.
function buildTableDecorations(view: EditorView): DecorationSet {
  const { doc } = view.state;
  const fenced = fencedCodeRanges(doc);
  const ranges: Range<Decoration>[] = [];
  let i = 1;
  while (i <= doc.lines) {
    let j = i;
    while (j <= doc.lines && RE_ROW.test(doc.line(j).text)) j++;
    const first = doc.line(i);
    const isFenced = fenced.some(([a, b]) => first.from >= a && first.to <= b);
    if (j - i >= 3 && !isFenced && RE_SEP.test(doc.line(i + 1).text)) {
      const rows: { from: number; cells: ReturnType<typeof rowCells> }[] = [];
      for (let n = i + 2; n < j; n++) {
        const line = doc.line(n);
        rows.push({ from: line.from, cells: rowCells(line.text) });
      }
      rowCells(first.text).forEach((head, col) => {
        const levels = columnLevels(head.text, rows.map(row => row.cells[col]?.text ?? ''));
        rows.forEach((row, k) => {
          const cell = row.cells[col];
          const level = levels[k];
          if (cell && level !== undefined)
            ranges.push(Decoration.mark({ class: LEVEL_CLASSES[level]! }).range(row.from + cell.from, row.from + cell.to));
        });
      });
    }
    i = Math.max(j, i + 1);
  }
  return Decoration.set(ranges, true);
}

const tablePlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildTableDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged) this.decorations = buildTableDecorations(update.view);
    }
  },
  { decorations: (v) => v.decorations }
);

const highlightPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (!update.docChanged && !update.viewportChanged) return;
      this.decorations = buildDecorations(update.view);
      // Live Preview table widgets render after this update, so shade on the next frame.
      window.requestAnimationFrame(() => update.view.dom.querySelectorAll('table').forEach(shadeTable));
    }
  },
  { decorations: (v) => v.decorations }
);

export default class NnyjSyntaxHighlight extends Plugin {
  onload() {
    this.registerEditorExtension([highlightPlugin, tablePlugin]);
    this.registerMarkdownPostProcessor(element => element.querySelectorAll('table').forEach(shadeTable));
    this.app.workspace.onLayoutReady(() => {
      const app = this.app as unknown as { commands: { commands: Record<string, { icon?: string } | undefined> } };
      const cmd = app.commands.commands['editor:save-file'];
      if (cmd && !cmd.icon) cmd.icon = 'save';
    });
  }
}
