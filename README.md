# NNYJ Syntax Highlight

CM6 syntax decorations for markdown notes. Highlights colons, arrows, comments, and brackets with distinct colors. Mirrors the [NNYJ Syntax Highlight](https://github.com/nnyj/vscode-nnyj-syntax-highlight) VS Code extension.

## Patterns

- `;` or `//` line comments → green
- `key:` colons → blue
- `-->` `<--` arrows → bright green bold
- `(parenthesized)` text → gold

Skips fenced code blocks and inline code.

## Features

- Sets save icon on `editor:save-file` command (Obsidian omits it by default)

## Install

Download `main.js`, `styles.css`, `manifest.json` from [Releases](https://github.com/nnyj/obsidian-nnyj-syntax-highlight/releases) into `.obsidian/plugins/nnyj-syntax-highlight/`.

## Build

```bash
npm install
npm run build
```

## Customization

Override colors in a CSS snippet:

```css
.nnyj-comment { color: #6a9955 !important; }
.nnyj-colon { color: #569cd6 !important; }
.nnyj-arrow { color: #4ec9b0 !important; }
.nnyj-bracket { color: #d7ba7d !important; }
```
