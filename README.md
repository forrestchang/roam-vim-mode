# Roam Vim Mode

A Roam Research extension that provides Vim-like keyboard navigation for blocks. Ported from [roam-toolkit](https://github.com/roam-unofficial/roam-toolkit).

## Features

- **Block Navigation**: Navigate between blocks using `j`/`k` keys
- **Panel Navigation**: Switch between main panel and sidebar panels with `h`/`l`
- **Search**: Search within visible blocks with `/`
- **Hint System**: Quick access to links within blocks using hint keys
- **Mode Indicator**: Visual indicator showing current mode

## Key Bindings

### Navigation

| Key | Description |
|-----|-------------|
| `j` | Move down |
| `k` | Move up |
| `h` | Switch to left panel |
| `l` | Switch to right panel |
| `gg` | Jump to first block |
| `G` | Jump to last block |

### Editing

| Key | Description |
|-----|-------------|
| `i` | Enter insert mode (start) |
| `a` | Enter insert mode (end) |
| `o` | Insert block below |
| `O` | Insert block above |
| `V` | Enter visual mode (line) |
| `dd` | Delete block |
| `u` | Undo |
| `Ctrl+R` | Redo |
| `z` | Toggle fold |
| `c` | Center current block |

### Search

| Key | Description |
|-----|-------------|
| `/` | Search in visible blocks |
| `n` | Go to next match |
| `N` | Go to previous match |

### Hints

When a block is selected, clickable elements (links, references, checkboxes) show hint labels:

| Key | Description |
|-----|-------------|
| `q`, `w`, `e`, `r`, `t`, `b` | Click hint 0-5 |
| `Shift+` hint key | Shift-click hint (open in sidebar) |

### Other

| Key | Description |
|-----|-------------|
| `Escape` | Return to normal mode |
| `?` | Toggle help panel |

### Spacemacs-style Leader Key (Experimental)

> **Note:** This is an experimental feature with an empty default configuration. Enable it in Settings > Vim Mode > "Enable Spacemacs-style Leader Key".

Press `Space` in Normal mode to open the which-key popup. The framework is preserved for future use or user customization.

## Installation

### Via Roam Depot (Recommended)

1. Open Roam Research
2. Go to Settings > Roam Depot
3. Search for "Vim Mode"
4. Click Install

### Manual Installation (Developer Mode)

1. Clone this repository
2. Run `npm install && npm run build`
3. Open Roam Research
4. Go to Settings > Roam Depot
5. Enable Developer Mode
6. Click "Load unpacked extension"
7. Select the folder containing `extension.js`

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode (auto-rebuild on changes)
npm run watch
```

To reload the extension after making changes:
- Disable and re-enable the extension in Roam Depot, or
- Refresh Roam Research

## Credits

This extension is a port of the vim-mode feature from [roam-toolkit](https://github.com/roam-unofficial/roam-toolkit), adapted to work as a standalone Roam Depot extension.

## License

MIT
