export interface WebviewContextMenuItem {
  id?: string;
  label?: string;
  icon?: string;
  enabled?: boolean;
  separator?: boolean;
  submenu?: WebviewContextMenuItem[];
  action?: string;
  data?: Record<string, unknown>;
}

export class WebviewContextMenuProvider {
  /**
   * Generate context menu HTML/CSS for webview
   */
  public static getContextMenuStyles(): string {
    return `
      .context-menu {
        position: fixed;
        background: var(--vscode-menu-background);
        border: 1px solid var(--vscode-menu-border);
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        padding: 4px 0;
        min-width: 180px;
        z-index: 10000;
        display: none;
        font-size: 13px;
      }

      .context-menu.show {
        display: block;
      }

      .context-menu-item {
        padding: 6px 20px 6px 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--vscode-menu-foreground);
        position: relative;
      }

      .context-menu-item:hover:not(.disabled):not(.separator) {
        background: var(--vscode-menu-selectionBackground);
        color: var(--vscode-menu-selectionForeground);
      }

      .context-menu-item.disabled {
        opacity: 0.5;
        cursor: default;
      }

      .context-menu-item.separator {
        height: 1px;
        background: var(--vscode-menu-separatorBackground);
        margin: 4px 0;
        padding: 0;
        cursor: default;
      }

      .context-menu-icon {
        width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }

      .context-menu-label {
        flex: 1;
      }

      .context-menu-shortcut {
        font-size: 11px;
        opacity: 0.7;
        margin-left: 20px;
      }

      .context-menu-submenu {
        position: absolute;
        left: 100%;
        top: 0;
        margin-left: 4px;
        background: var(--vscode-menu-background);
        border: 1px solid var(--vscode-menu-border);
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        padding: 4px 0;
        min-width: 180px;
        display: none;
      }

      .context-menu-item:hover .context-menu-submenu {
        display: block;
      }

      .context-menu-arrow {
        position: absolute;
        right: 8px;
        opacity: 0.7;
      }
    `;
  }

  /**
   * Generate context menu JavaScript for webview
   */
  public static getContextMenuScript(): string {
    return `
      class ContextMenu {
        constructor() {
          this.menu = null;
          this.currentTarget = null;
          this.init();
        }

        init() {
          // Create context menu container
          this.menu = document.createElement('div');
          this.menu.className = 'context-menu';
          document.body.appendChild(this.menu);

          // Close menu on click outside
          document.addEventListener('click', () => this.hide());
          
          // Prevent default context menu
          document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.map-cell, .tile-palette-item, .tool-button')) {
              e.preventDefault();
              this.show(e);
            }
          });
        }

        show(event) {
          this.currentTarget = event.target;
          const items = this.getMenuItems(event.target);
          
          if (items.length === 0) return;

          this.menu.innerHTML = this.renderMenuItems(items);
          this.attachEventListeners();

          // Position menu
          const x = event.clientX;
          const y = event.clientY;
          const menuWidth = 200;
          const menuHeight = items.length * 32;

          // Adjust position to keep menu on screen
          let left = x;
          let top = y;

          if (x + menuWidth > window.innerWidth) {
            left = x - menuWidth;
          }

          if (y + menuHeight > window.innerHeight) {
            top = y - menuHeight;
          }

          this.menu.style.left = left + 'px';
          this.menu.style.top = top + 'px';
          this.menu.classList.add('show');
        }

        hide() {
          this.menu.classList.remove('show');
          this.currentTarget = null;
        }

        getMenuItems(target) {
          const items = [];

          // Map cell context menu
          if (target.classList.contains('map-cell')) {
            const row = target.dataset.row;
            const col = target.dataset.col;
            const value = target.dataset.value;

            items.push({
              id: 'paint',
              label: 'Paint Tile',
              icon: '🖌️',
              action: 'paintTile',
              data: { row, col }
            });

            items.push({
              id: 'fill',
              label: 'Fill Area',
              icon: '🪣',
              action: 'fillArea',
              data: { row, col, value }
            });

            items.push({
              id: 'pick',
              label: 'Pick Tile Color',
              icon: '💧',
              action: 'pickColor',
              data: { value }
            });

            items.push({ separator: true });

            items.push({
              id: 'info',
              label: 'Tile Info',
              icon: 'ℹ️',
              action: 'showTileInfo',
              data: { row, col, value }
            });
          }

          // Tile palette context menu
          else if (target.classList.contains('tile-palette-item')) {
            const tileId = target.dataset.tileId;

            items.push({
              id: 'select',
              label: 'Select Tile',
              icon: '✓',
              action: 'selectTile',
              data: { tileId }
            });

            items.push({
              id: 'fillAll',
              label: 'Fill All with This Tile',
              icon: '🪣',
              action: 'fillAll',
              data: { tileId }
            });

            items.push({ separator: true });

            items.push({
              id: 'tileInfo',
              label: 'Tile Properties',
              icon: 'ℹ️',
              action: 'showTileProperties',
              data: { tileId }
            });
          }

          // Tool button context menu
          else if (target.classList.contains('tool-button')) {
            const tool = target.dataset.tool;

            items.push({
              id: 'help',
              label: 'Tool Help',
              icon: '❓',
              action: 'showToolHelp',
              data: { tool }
            });

            items.push({
              id: 'shortcut',
              label: 'Keyboard Shortcut',
              icon: '⌨️',
              action: 'showShortcut',
              data: { tool }
            });
          }

          // Add common items
          if (items.length > 0) {
            items.push({ separator: true });
            
            items.push({
              id: 'undo',
              label: 'Undo',
              icon: '↶',
              action: 'undo',
              shortcut: 'Ctrl+Z'
            });

            items.push({
              id: 'redo',
              label: 'Redo',
              icon: '↷',
              action: 'redo',
              shortcut: 'Ctrl+Y'
            });
          }

          return items;
        }

        renderMenuItems(items) {
          return items.map(item => {
            if (item.separator) {
              return '<div class="context-menu-item separator"></div>';
            }

            const disabled = item.enabled === false ? 'disabled' : '';
            const icon = item.icon ? \`<span class="context-menu-icon">\${item.icon}</span>\` : '';
            const shortcut = item.shortcut ? \`<span class="context-menu-shortcut">\${item.shortcut}</span>\` : '';
            const arrow = item.submenu ? '<span class="context-menu-arrow">▶</span>' : '';

            return \`
              <div class="context-menu-item \${disabled}" data-action="\${item.action}" data-item='\${JSON.stringify(item.data || {})}'>
                \${icon}
                <span class="context-menu-label">\${item.label}</span>
                \${shortcut}
                \${arrow}
              </div>
            \`;
          }).join('');
        }

        attachEventListeners() {
          const items = this.menu.querySelectorAll('.context-menu-item:not(.separator):not(.disabled)');
          
          items.forEach(item => {
            item.addEventListener('click', (e) => {
              e.stopPropagation();
              const action = item.dataset.action;
              const data = JSON.parse(item.dataset.item || '{}');
              
              this.handleAction(action, data);
              this.hide();
            });
          });
        }

        handleAction(action, data) {
          // Send message to VS Code
          vscode.postMessage({
            command: 'contextMenuAction',
            action: action,
            data: data
          });
        }
      }

      // Initialize context menu
      const contextMenu = new ContextMenu();
    `;
  }

  /**
   * Create context menu items for the editor
   */
  public static getEditorContextMenuItems(
    elementType: string,
    data: Record<string, unknown>
  ): WebviewContextMenuItem[] {
    const items: WebviewContextMenuItem[] = [];

    switch (elementType) {
      case 'mapCell':
        items.push(
          {
            id: 'paint',
            label: 'Paint Tile',
            icon: '🖌️',
            action: 'paintTile',
            data,
          },
          {
            id: 'fill',
            label: 'Fill Area',
            icon: '🪣',
            action: 'fillArea',
            data,
          },
          {
            id: 'pick',
            label: 'Pick Color',
            icon: '💧',
            action: 'pickColor',
            data,
          },
          { separator: true },
          {
            id: 'copy',
            label: 'Copy',
            icon: '📋',
            action: 'copy',
            data,
          },
          {
            id: 'paste',
            label: 'Paste',
            icon: '📄',
            action: 'paste',
            data,
          }
        );
        break;

      case 'tilePalette':
        items.push(
          {
            id: 'select',
            label: 'Select Tile',
            icon: '✓',
            action: 'selectTile',
            data,
          },
          {
            id: 'fillAll',
            label: 'Fill All',
            icon: '🪣',
            action: 'fillAllWithTile',
            data,
          },
          {
            id: 'replace',
            label: 'Replace All',
            icon: '🔄',
            action: 'replaceAllTiles',
            data,
          }
        );
        break;

      case 'toolbar':
        items.push(
          {
            id: 'resetTools',
            label: 'Reset Tools',
            icon: '🔄',
            action: 'resetTools',
          },
          {
            id: 'toolHelp',
            label: 'Tool Help',
            icon: '❓',
            action: 'showToolHelp',
          }
        );
        break;
    }

    // Add common actions
    if (items.length > 0) {
      items.push(
        { separator: true },
        {
          id: 'undo',
          label: 'Undo',
          icon: '↶',
          action: 'undo',
        },
        {
          id: 'redo',
          label: 'Redo',
          icon: '↷',
          action: 'redo',
        }
      );
    }

    return items;
  }
}
