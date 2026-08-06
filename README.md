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

Incremental search over the blocks in the focused panel. Matches are painted with
the native CSS Custom Highlight API, so nothing is injected into Roam's markup.

| Key | Description |
|-----|-------------|
| `/` | Search in the current panel |
| `n` | Go to next match |
| `N` | Go to previous match |

### Hints

When a block is selected, clickable elements (links, references, checkboxes) show hint labels:

| Key | Description |
|-----|-------------|
| `q`, `w`, `e`, `r`, `t`, `b` | Click hint 0-5 |
| `Shift+` hint key | Shift-click hint (open in sidebar) |

Vimium-style hints for every link on the page:

| Key | Description |
|-----|-------------|
| `f` | Label all visible links; type a label to click it |
| `F` | Same, but shift-click (open in sidebar) |
| `Esc` | Cancel hinting |

### Other

| Key | Description |
|-----|-------------|
| `Escape` | Return to normal mode |
| `?` | Toggle help panel |

### Spacemacs-style Leader Key

Opt in via Settings > Vim Mode > "Enable Spacemacs-style Leader Key". Press `Space`
in Normal mode to open the which-key popup, then walk the tree.

| Sequence | Description |
|----------|-------------|
| `SPC b y` / `SPC b e` | Copy block reference / embed |
| `SPC b c` / `SPC b d` | Copy block text / delete block |
| `SPC b k` / `SPC b j` | Move block up / down |
| `SPC b z` / `SPC b r` | Toggle fold / expand references |
| `SPC g g` / `SPC g e` / `SPC g c` | First block / last block / center |
| `SPC p h` / `SPC p l` / `SPC p c` | Left panel / right panel / close sidebar page |
| `SPC s s` / `SPC s n` / `SPC s p` | Search / next match / previous match |
| `SPC f f` / `SPC f s` / `SPC f b` | Hint links / hint → sidebar / hint blocks |
| `SPC ?` | Help panel |

The tree lives in `src/leader-config.js` and is plain data — add a node there to add
a binding, or call `setLeaderConfig()` with your own tree.

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

# Build (writes the bundled extension.js that Roam Depot loads)
npm run build

# Watch mode (auto-rebuild on changes)
npm run watch

# Unit tests
npm test

# Build + test, as CI runs it
npm run check
```

`extension.js` is a build artifact but is committed, because that is what Roam
Depot loads. CI fails if it has drifted from `src/`, so always rebuild before
committing.

### Architecture

| File | Responsibility |
|------|----------------|
| `extension.js` | Roam Depot entry points, lifecycle, event wiring |
| `keybindings.js` | Keydown handler, multi-key sequences, leader mode |
| `commands.js` | The commands keys map to |
| `roam-api.js` | Thin wrapper over `window.roamAlphaAPI` |
| `roam.js` | Roam interaction, preferring the API over simulated input |
| `panel.js` | Main/sidebar panels and block selection |
| `mode.js` / `mode-events.js` | Derived mode state and change notifications |
| `search.js` | `/` search using the CSS Custom Highlight API |
| `page-hints.js` | Vimium-style `f` hints |
| `styles.js` | All injected CSS (single source of truth) |

To reload the extension after making changes:
- Disable and re-enable the extension in Roam Depot, or
- Refresh Roam Research

## Credits

This extension is a port of the vim-mode feature from [roam-toolkit](https://github.com/roam-unofficial/roam-toolkit), adapted to work as a standalone Roam Depot extension.

## License

MIT
