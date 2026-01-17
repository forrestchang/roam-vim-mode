# Roam Vim Mode

A Roam Research extension that provides Vim-like keyboard navigation for blocks. Ported from [roam-toolkit](https://github.com/roam-unofficial/roam-toolkit).

## Features

- **Three Modes**: Normal, Insert, and Visual modes just like Vim
- **Block Navigation**: Navigate between blocks using `j`/`k` keys
- **Panel Navigation**: Switch between main panel and sidebar panels with `h`/`l`
- **Visual Selection**: Select multiple blocks for copying/cutting
- **Hint System**: Quick access to links within blocks using hint keys
- **Mode Indicator**: Visual indicator showing current mode

## Key Bindings

### Mode Switching

| Key | Description |
|-----|-------------|
| `Escape` | Return to Normal mode |
| `i` | Enter Insert mode (edit from start) |
| `a` | Enter Insert mode (edit from end) |
| `v` | Enter Visual mode |

### Navigation (Normal Mode)

| Key | Description |
|-----|-------------|
| `j` | Select block down |
| `k` | Select block up |
| `h` | Select panel left |
| `l` | Select panel right |
| `Shift+H` | Select first visible block |
| `Shift+L` | Select last visible block |
| `gg` | Select first block |
| `Shift+G` | Select last block |
| `Ctrl+U` | Select many blocks up (8) |
| `Ctrl+D` | Select many blocks down (8) |
| `Ctrl+Y` | Scroll up |
| `Ctrl+E` | Scroll down |

### Editing (Normal Mode)

| Key | Description |
|-----|-------------|
| `o` | Insert block after |
| `Shift+O` | Insert block before |
| `z` | Toggle fold block |

### Clipboard (Normal/Visual Mode)

| Key | Description |
|-----|-------------|
| `y` | Copy selected block(s) |
| `Alt+Y` | Copy block reference |
| `Shift+Y` | Copy block embed |
| `d` | Enter visual / Cut in visual mode |
| `p` | Paste after |
| `Shift+P` | Paste before |

### History

| Key | Description |
|-----|-------------|
| `u` | Undo |
| `Ctrl+R` | Redo |

### Block Manipulation

| Key | Description |
|-----|-------------|
| `Cmd+Shift+K` | Move block up |
| `Cmd+Shift+J` | Move block down |

### Visual Mode

| Key | Description |
|-----|-------------|
| `j`/`k` | Navigate selection |
| `Shift+J` | Grow selection down |
| `Shift+K` | Grow selection up |

### Hint System

When a block is selected, clickable elements (links, references, checkboxes) show hint labels:

| Key | Description |
|-----|-------------|
| `q`, `w`, `e`, `r`, `t`, `f`, `b` | Click hint 0-6 |
| `Shift+` hint key | Shift-click hint (open in sidebar) |
| `Ctrl+Shift+` hint key | Ctrl+Shift-click hint |

### Other

| Key | Description |
|-----|-------------|
| `Ctrl+W` | Close page in sidebar |

## Installation

### Via Roam Depot (Recommended)

1. Open Roam Research
2. Go to Settings > Roam Depot
3. Search for "Vim Mode"
4. Click Install

### Manual Installation (Developer Mode)

1. Clone this repository
2. Open Roam Research
3. Go to Settings > Roam Depot
4. Enable Developer Mode
5. Click "Load unpacked extension"
6. Select the folder containing `extension.js`

## Development

To reload the extension after making changes:
- Use `Ctrl+D, Ctrl+R` in Roam Research

## Credits

This extension is a port of the vim-mode feature from [roam-toolkit](https://github.com/roam-unofficial/roam-toolkit), adapted to work as a standalone Roam Depot extension.

## License

MIT
