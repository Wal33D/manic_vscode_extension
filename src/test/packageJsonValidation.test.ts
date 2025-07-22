import * as fs from 'fs';
import * as path from 'path';

interface PackageJsonCommand {
  command: string;
  title?: string;
  category?: string;
  icon?: string;
}

interface PackageJson {
  contributes: {
    commands: PackageJsonCommand[];
    menus?: Record<string, Array<{ command?: string; when?: string }>>;
    keybindings?: Array<{ command: string }>;
    views?: Record<string, Array<{ id: string }>>;
  };
}

describe('Package.json Validation', () => {
  let packageJson: PackageJson;

  beforeAll(() => {
    const packageJsonPath = path.join(__dirname, '../../package.json');
    const content = fs.readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(content);
  });

  describe('Menu Commands', () => {
    it('should have all menu commands defined in commands section', () => {
      const definedCommands = new Set(
        packageJson.contributes.commands.map(cmd => cmd.command)
      );

      const menuCommands = new Set<string>();

      // Collect all commands referenced in menus
      const menus = packageJson.contributes.menus;
      if (menus) {
        for (const menuType of Object.keys(menus)) {
          const menuItems = menus[menuType];
          if (Array.isArray(menuItems)) {
            menuItems.forEach(item => {
              if (item.command) {
                menuCommands.add(item.command);
              }
            });
          }
        }
      }

      // Check that all menu commands are defined
      const undefinedCommands: string[] = [];
      menuCommands.forEach(command => {
        if (!definedCommands.has(command)) {
          undefinedCommands.push(command);
        }
      });

      if (undefinedCommands.length > 0) {
        throw new Error(
          `The following commands are referenced in menus but not defined in commands section:\n` +
            undefinedCommands.map(cmd => `  - ${cmd}`).join('\n')
        );
      }
    });

    it('should have all commands used in menus have proper metadata', () => {
      const commands = new Map(
        packageJson.contributes.commands.map(cmd => [cmd.command, cmd])
      );

      const menuCommands = new Set<string>();

      // Collect all commands referenced in menus
      const menus = packageJson.contributes.menus;
      if (menus) {
        for (const menuType of Object.keys(menus)) {
          const menuItems = menus[menuType];
          if (Array.isArray(menuItems)) {
            menuItems.forEach(item => {
              if (item.command) {
                menuCommands.add(item.command);
              }
            });
          }
        }
      }

      const commandsWithoutTitle: string[] = [];
      const commandsWithoutCategory: string[] = [];

      menuCommands.forEach(commandId => {
        const command = commands.get(commandId);
        if (command) {
          if (!command.title) {
            commandsWithoutTitle.push(commandId);
          }
          if (!command.category && commandId.startsWith('manicMiners.')) {
            commandsWithoutCategory.push(commandId);
          }
        }
      });

      if (commandsWithoutTitle.length > 0) {
        throw new Error(
          `The following commands are missing titles:\n` +
            commandsWithoutTitle.map(cmd => `  - ${cmd}`).join('\n')
        );
      }

      if (commandsWithoutCategory.length > 0) {
        console.warn(
          `The following commands should have category "Manic Miners":\n` +
            commandsWithoutCategory.map(cmd => `  - ${cmd}`).join('\n')
        );
      }
    });
  });

  describe('Command Registration', () => {
    it('should have unique command IDs', () => {
      const commandIds = packageJson.contributes.commands.map(cmd => cmd.command);
      const uniqueIds = new Set(commandIds);

      if (commandIds.length !== uniqueIds.size) {
        const duplicates = commandIds.filter(
          (id: string, index: number) => commandIds.indexOf(id) !== index
        );
        throw new Error(`Duplicate command IDs found: ${duplicates.join(', ')}`);
      }
    });

    it('should follow naming convention for all commands', () => {
      const invalidCommands: string[] = [];

      packageJson.contributes.commands.forEach(cmd => {
        if (cmd.command.startsWith('manicMiners.') && !/^manicMiners\.[a-zA-Z][a-zA-Z0-9]*$/.test(cmd.command)) {
          invalidCommands.push(cmd.command);
        }
      });

      if (invalidCommands.length > 0) {
        throw new Error(
          `The following commands don't follow the naming convention (manicMiners.camelCase):\n` +
            invalidCommands.map(cmd => `  - ${cmd}`).join('\n')
        );
      }
    });
  });

  describe('Keybindings', () => {
    it('should have all keybinding commands defined', () => {
      if (!packageJson.contributes.keybindings) {
        return;
      }

      const definedCommands = new Set(
        packageJson.contributes.commands.map(cmd => cmd.command)
      );

      const undefinedCommands: string[] = [];

      packageJson.contributes.keybindings.forEach(binding => {
        if (!definedCommands.has(binding.command)) {
          undefinedCommands.push(binding.command);
        }
      });

      if (undefinedCommands.length > 0) {
        throw new Error(
          `The following commands are used in keybindings but not defined:\n` +
            undefinedCommands.map(cmd => `  - ${cmd}`).join('\n')
        );
      }
    });
  });

  describe('View Containers', () => {
    it('should have all view references in valid containers', () => {
      const viewIds = new Set<string>();

      // Collect all view IDs from views
      if (packageJson.contributes.views) {
        Object.values(packageJson.contributes.views).forEach(viewList => {
          if (Array.isArray(viewList)) {
            viewList.forEach(view => {
              viewIds.add(view.id);
            });
          }
        });
      }

      // Check view/item/context menu references
      if (packageJson.contributes.menus?.['view/item/context']) {
        const invalidViewRefs: string[] = [];

        packageJson.contributes.menus['view/item/context'].forEach(item => {
          if (item.when) {
            const match = item.when.match(/view == ([a-zA-Z0-9._-]+)/);
            if (match && !viewIds.has(match[1])) {
              invalidViewRefs.push(match[1]);
            }
          }
        });

        if (invalidViewRefs.length > 0) {
          throw new Error(
            `The following view IDs are referenced but not defined:\n` +
              invalidViewRefs.map(id => `  - ${id}`).join('\n')
          );
        }
      }
    });
  });
});