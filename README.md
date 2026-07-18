# obsidian-nnyj-syntax-highlight

<div align="center">

[![Stars](https://img.shields.io/github/stars/nnyj/obsidian-nnyj-syntax-highlight?style=for-the-badge&labelColor=555&color=e3b341)](https://github.com/nnyj/obsidian-nnyj-syntax-highlight/stargazers)

</div>

CM6 syntax decorations for markdown notes in Obsidian. Highlights colons, arrows, comments, and brackets with distinct colors. Mirrors the [NNYJ Syntax Highlight](https://github.com/nnyj/vscode-nnyj-syntax-highlight) VS Code extension.

## Patterns

| Pattern | Example | CSS class |
|---------|---------|-----------|
| Line comment | `; note` or `// note` | `nnyj-comment` |
| Key colon | `key: value` | `nnyj-colon` |
| Arrow | `--> <--` | `nnyj-arrow` |
| Parentheses | `(text)` | `nnyj-bracket` |

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
