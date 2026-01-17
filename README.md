# Roam Vim Mode

A Roam Research extension that provides Vim-like keyboard navigation for blocks. Ported from [roam-toolkit](https://github.com/roam-unofficial/roam-toolkit).

## Features

- **Four Modes**: Normal, Insert, Visual, and Hint modes
- **Block Navigation**: Navigate between blocks using `j`/`k` keys
- **Panel Navigation**: Switch between main panel and sidebar panels with `h`/`l`
- **Visual Selection**: Select multiple blocks for copying/cutting
- **Hint System**: Quick access to links within blocks using hint keys
- **Spacemacs-style Leader Key**: Press `Space` to access command menu with which-key popup
- **User Customization**: Define custom keybindings via Roam page
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
| `za` | Toggle fold block |
| `zz` | Center current block |

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
| `q`, `w`, `e`, `r`, `t`, `b` | Click hint 0-5 |
| `Shift+` hint key | Shift-click hint (open in sidebar) |
| `Ctrl+Shift+` hint key | Ctrl+Shift-click hint |
| `f` | Show page-wide hints |
| `F` | Show page-wide hints (open in sidebar) |
| `gf` | Show block hints to edit |

### Leader Key (Spacemacs-style) - Experimental

> **Note:** This is an experimental feature. Enable it in Settings > Vim Mode > "Enable Spacemacs-style Leader Key".

Press `Space` in Normal mode to open the which-key popup showing available commands.

#### Block Operations (`SPC b`)

| Key | Description |
|-----|-------------|
| `SPC b y` | Copy block |
| `SPC b r` | Copy block reference |
| `SPC b e` | Copy block embed |
| `SPC b p` | Paste after |
| `SPC b P` | Paste before |
| `SPC b d` | Delete block |
| `SPC b x` | Cut block |
| `SPC b n` | New block below |
| `SPC b N` | New block above |
| `SPC b o` | Open block in sidebar |
| `SPC b m` | Show block mentions |
| `SPC b z` | Zoom into block |

#### Goto/Navigation (`SPC g`)

| Key | Description |
|-----|-------------|
| `SPC g g` | First block |
| `SPC g G` | Last block |
| `SPC g d` | Daily Notes |
| `SPC g h` | Go home (Daily Notes) |
| `SPC g p` | Go to page (prompt) |
| `SPC g b` | Go to block (prompt) |
| `SPC g l` | Go to linked refs |

#### Window/Sidebar (`SPC w`)

| Key | Description |
|-----|-------------|
| `SPC w h` | Panel left |
| `SPC w l` | Panel right |
| `SPC w o` | Open right sidebar |
| `SPC w c` | Close right sidebar |
| `SPC w d` | Close sidebar page |
| `SPC w L` | Toggle left sidebar |
| `SPC w a` | Add block to sidebar |
| `SPC w m` | Add mentions to sidebar |
| `SPC w g` | Add graph to sidebar |
| `SPC w s` | Search in sidebar |

#### Search (`SPC s`)

| Key | Description |
|-----|-------------|
| `SPC s s` | Command palette |
| `SPC s p` | Find page |
| `SPC s /` | Browser find (Cmd+F) |
| `SPC s r` | Search in sidebar |
| `SPC s g` | Graph search |

#### Page Operations (`SPC p`)

| Key | Description |
|-----|-------------|
| `SPC p n` | New page (prompt) |
| `SPC p d` | Delete page |
| `SPC p r` | Rename page (prompt) |
| `SPC p o` | Open page in sidebar |
| `SPC p m` | Show page mentions |
| `SPC p g` | Show page graph |

#### Toggle (`SPC t`)

| Key | Description |
|-----|-------------|
| `SPC t f` | Toggle fold |
| `SPC t l` | Toggle left sidebar |
| `SPC t r` | Toggle right sidebar |

#### Focus (`SPC f`)

| Key | Description |
|-----|-------------|
| `SPC f f` | Focus first block |
| `SPC f b` | Focus current block |

#### Quick Commands

| Key | Description |
|-----|-------------|
| `SPC u` | Undo |
| `SPC r` | Redo |
| `SPC ?` | Help |

### Search (Normal Mode)

| Key | Description |
|-----|-------------|
| `/` | Search in visible blocks |
| `n` | Go to next match |
| `N` | Go to previous match |

### Other

| Key | Description |
|-----|-------------|
| `Ctrl+W` | Close page in sidebar |
| `?` | Toggle help panel |

## User Configuration

You can define custom keybindings by creating a configuration page in Roam.

### Setup

1. Create a page named `roam/js/vim-mode`
2. Add a `javascript` code block with your configuration
3. Reload the extension (or refresh Roam)

### Configuration Format

The configuration should return a JavaScript object that defines key groups and commands:

```javascript
return {
  // Define a new key group
  'x': {
    name: '+custom',
    keys: {
      'y': { name: 'My action', command: 'copyBlock' },
      'z': {
        name: 'Custom action',
        action: () => alert('Hello!')
      }
    }
  },

  // Override existing groups
  's': {
    name: '+search',
    keys: {
      's': { name: 'Search', command: 'openSearch' },
      'p': {
        name: 'Find page',
        action: () => window.roamAlphaAPI.ui.mainWindow.openPage({page: {title: 'TODO'}})
      }
    }
  }
}
```

### Command Types

#### 1. Predefined Commands

Use the `command` field to reference built-in commands:

```javascript
{ name: 'Copy block', command: 'copyBlock' }
```

**Available predefined commands:**

| Command | Description |
|---------|-------------|
| **Block Operations** | |
| `copyBlock` | Copy the selected block |
| `copyBlockReference` | Copy as `((uid))` |
| `copyBlockEmbed` | Copy as `{{embed: ((uid))}}` |
| `paste` | Paste after current block |
| `pasteBefore` | Paste before current block |
| `cutBlock` | Cut the selected block |
| `deleteBlock` | Delete the selected block |
| `createBlockBelow` | Create new block below |
| `createBlockAbove` | Create new block above |
| `openBlockInSidebar` | Open block in sidebar |
| `showBlockMentions` | Show block mentions in sidebar |
| `zoomIntoBlock` | Zoom into the selected block |
| **Navigation** | |
| `selectFirstBlock` | Jump to first block |
| `selectLastBlock` | Jump to last block |
| `gotoDailyNotes` | Navigate to Daily Notes |
| `gotoPage` | Go to page (prompt) |
| `gotoBlock` | Go to block (prompt) |
| `gotoLinkedRefs` | Scroll to linked refs |
| **Window/Panel** | |
| `selectPanelLeft` | Switch to left panel |
| `selectPanelRight` | Switch to right panel |
| `closeSidebarPage` | Close the sidebar page |
| `openRightSidebar` | Open right sidebar |
| `closeRightSidebar` | Close right sidebar |
| `toggleLeftSidebar` | Toggle left sidebar |
| `toggleRightSidebar` | Toggle right sidebar |
| `showGraphInSidebar` | Show page graph in sidebar |
| `searchInSidebar` | Search in sidebar (prompt) |
| **Search** | |
| `openCommandPalette` | Open command palette |
| `openSearch` | Open search/find page |
| `searchInPage` | Browser find (Cmd+F) |
| `graphSearch` | Search graph data |
| **Page Operations** | |
| `createPage` | Create new page (prompt) |
| `deletePage` | Delete current page |
| `renamePage` | Rename current page |
| `openPageInSidebar` | Open page in sidebar |
| `showPageMentions` | Show page mentions in sidebar |
| `showPageGraph` | Show page graph in sidebar |
| **Other** | |
| `toggleFold` | Toggle block fold |
| `focusFirstBlock` | Focus first block |
| `focusCurrentBlock` | Focus current block |
| `undo` | Undo last action |
| `redo` | Redo last action |
| `showHelpPanel` | Show help panel |

#### 2. Custom Actions

Use the `action` field to define custom JavaScript functions:

```javascript
{
  name: 'Open graph',
  action: () => window.roamAlphaAPI.ui.graphView.open()
}
```

You can use any Roam Alpha API or DOM manipulation in your custom actions.

### Example: Full Custom Configuration

```javascript
return {
  // Navigation
  'g': {
    name: '+goto',
    keys: {
      'g': { name: 'First block', command: 'selectFirstBlock' },
      'G': { name: 'Last block', command: 'selectLastBlock' },
      'd': { name: 'Daily Notes', command: 'gotoDailyNotes' },
      'i': {
        name: 'Inbox',
        action: () => window.roamAlphaAPI.ui.mainWindow.openPage({page: {title: 'Inbox'}})
      }
    }
  },

  // Open various views
  'o': {
    name: '+open',
    keys: {
      'g': {
        name: 'Graph view',
        action: () => window.roamAlphaAPI.ui.graphView.open()
      },
      's': {
        name: 'Sidebar',
        action: () => window.roamAlphaAPI.ui.rightSidebar.open()
      }
    }
  },

  // Quick insert
  'i': {
    name: '+insert',
    keys: {
      't': {
        name: 'TODO',
        action: () => {
          const uid = window.roamAlphaAPI.ui.getFocusedBlock()?.['block-uid'];
          if (uid) {
            const text = window.roamAlphaAPI.pull('[*]', [':block/uid', uid])?.[':block/string'] || '';
            window.roamAlphaAPI.updateBlock({block: {uid, string: `{{[[TODO]]}} ${text}`}});
          }
        }
      }
    }
  }
}
```

### Tips

- User configuration is **merged** with default config (not replaced)
- Press `Escape` to cancel leader mode at any time
- The which-key popup shows after 400ms delay (experienced users can type sequences before it appears)
- Check browser console for configuration loading errors

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
