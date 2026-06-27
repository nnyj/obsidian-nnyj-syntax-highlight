import { Plugin } from 'obsidian';
import { ViewPlugin, Decoration, EditorView, ViewUpdate, DecorationSet } from '@codemirror/view';
import { RangeSetBuilder, Text } from '@codemirror/state';

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

const highlightPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }
    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged)
        this.decorations = buildDecorations(update.view);
    }
  },
  { decorations: (v) => v.decorations }
);

export default class NnyjSyntaxHighlight extends Plugin {
  onload() {
    this.registerEditorExtension(highlightPlugin);
    this.app.workspace.onLayoutReady(() => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      const cmd = (this.app as any).commands.commands['editor:save-file'] as { icon?: string } | undefined;
      if (cmd && !cmd.icon) cmd.icon = 'save';
    });
  }
}
