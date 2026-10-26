# obsidian-nnyj-syntax-highlight

<div align="center">

[![Stars](https://img.shields.io/github/stars/nnyj/obsidian-nnyj-syntax-highlight?style=for-the-badge&labelColor=555&color=e3b341)](https://github.com/nnyj/obsidian-nnyj-syntax-highlight/stargazers)
[![Downloads](https://img.shields.io/github/downloads/nnyj/obsidian-nnyj-syntax-highlight/total?style=for-the-badge&labelColor=555&color=2ea44f)](https://github.com/nnyj/obsidian-nnyj-syntax-highlight/releases)
[![Latest Release](https://img.shields.io/github/v/release/nnyj/obsidian-nnyj-syntax-highlight?style=for-the-badge&label=Latest%20Release&labelColor=555&color=3572d6)](https://github.com/nnyj/obsidian-nnyj-syntax-highlight/releases/latest)
[![Build](https://img.shields.io/github/actions/workflow/status/nnyj/obsidian-nnyj-syntax-highlight/release.yml?style=for-the-badge&labelColor=555)](https://github.com/nnyj/obsidian-nnyj-syntax-highlight/actions)

</div>

CM6 syntax decorations for markdown notes in Obsidian. Highlights colons, arrows, comments, and brackets with distinct colors. Mirrors the [NNYJ Syntax Highlight](https://github.com/nnyj/vscode-nnyj-syntax-highlight) VS Code extension.

## Patterns

| Pattern | Example | CSS class |
|---------|---------|-----------|
| Line comment | `; note` or `// note` | `nnyj-comment` |
| Key colon | `key: value` | `nnyj-colon` |
| Arrow | `--> <--` | `nnyj-arrow` |
| Parentheses | `(text)` | `nnyj-bracket` |

Table cells starting with 🔴, 🟡 or 🟢 get a matching background. Columns shade red (lowest) to green (highest) by the number each cell starts with, after an optional `~` or `$`. `↓` in the header flips the scale. Other cells are skipped.

Fenced code blocks and inline code are skipped.

## Customization

Override colors in a CSS snippet:

```css
.nnyj-comment { color: #6a9955 !important; }
.nnyj-colon   { color: #569cd6 !important; }
.nnyj-arrow   { color: #4ec9b0 !important; font-weight: bold; }
.nnyj-bracket { color: #d7ba7d !important; }
```

## Install

Download `main.js`, `styles.css`, `manifest.json` from [Releases](https://github.com/nnyj/obsidian-nnyj-syntax-highlight/releases) into `.obsidian/plugins/nnyj-syntax-highlight/`.

## Build

```sh
npm install
npm run build
```

## License

[MIT](LICENSE)
