import { describe, expect, it, beforeEach } from '@jest/globals';
import * as vscode from 'vscode';
import { DatHoverProvider } from './hoverProvider';

// Access the mocked classes
const TextDocument = (vscode as any).TextDocument;
const CancellationToken = (vscode as any).CancellationToken;

describe('DatHoverProvider - Enhanced Features', () => {
  let provider: DatHoverProvider;
  let cancellationToken: vscode.CancellationToken;

  beforeEach(() => {
    provider = new DatHoverProvider('/test/extension/path');
    cancellationToken = new CancellationToken();
  });

  describe('Enhanced Tile Hover', () => {
    it('should show drill time for drillable tiles', () => {
      const document = new TextDocument('tiles {\n  26,30,34\n}', 'manicminers');
      const position = new vscode.Position(1, 3); // Position on '26' (dirt wall)

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeInstanceOf(vscode.Hover);
      const content = (hover as any)?.contents;
      expect(content.value).toContain('*Drill time:* 2 seconds');
    });

    it('should show reinforced tile information', () => {
      const document = new TextDocument('tiles {\n  76,88,92\n}', 'manicminers');
      const position = new vscode.Position(1, 3); // Position on '76' (reinforced dirt)

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeInstanceOf(vscode.Hover);
      const content = (hover as any)?.contents;
      expect(content.value).toContain('⚠️ *Reinforced tile*');
      expect(content.value).toContain('Requires more drilling effort');
      expect(content.value).toContain('Base tile:');
      expect(content.value).toContain('Dirt Regular');
    });

    it('should show resource yields for resource tiles', () => {
      const document = new TextDocument('tiles {\n  42,46,50\n}', 'manicminers');

      // Test crystal seam
      let position = new vscode.Position(1, 3); // Position on '42'
      let hover = provider.provideHover(document, position, cancellationToken);
      let content = (hover as any)?.contents;
      expect(content.value).toContain('💎 *Yield:* 1-5 energy crystals');
      expect(content.value).toContain('*Drill time:* 3 seconds');

      // Test ore seam
      position = new vscode.Position(1, 6); // Position on '46'
      hover = provider.provideHover(document, position, cancellationToken);
      content = (hover as any)?.contents;
      expect(content.value).toContain('⛏️ *Yield:* 1-3 ore');
      expect(content.value).toContain('*Drill time:* 3 seconds');

      // Test recharge seam
      position = new vscode.Position(1, 9); // Position on '50'
      hover = provider.provideHover(document, position, cancellationToken);
      content = (hover as any)?.contents;
      expect(content.value).toContain('⚡ *Function:* Powers electric fences');
      expect(content.value).toContain('*Drill time:* 4 seconds');
    });

    it('should show hazard warnings', () => {
      const document = new TextDocument('tiles {\n  6,11,12\n}', 'manicminers');

      // Test lava
      let position = new vscode.Position(1, 3); // Position on '6'
      let hover = provider.provideHover(document, position, cancellationToken);
      let content = (hover as any)?.contents;
      expect(content.value).toContain('🔥 *Danger:*');
      expect(content.value).toContain('Damages vehicles and miners');
      expect(content.value).toContain('*Sound:* Lava bubbling effect');

      // Test water
      position = new vscode.Position(1, 5); // Position on '11'
      hover = provider.provideHover(document, position, cancellationToken);
      content = (hover as any)?.contents;
      expect(content.value).toContain('💧 *Effect:*');
      expect(content.value).toContain('Slows vehicles without hover upgrade');
      expect(content.value).toContain('*Sound:* Water splash effect');

      // Test electric fence
      position = new vscode.Position(1, 8); // Position on '12'
      hover = provider.provideHover(document, position, cancellationToken);
      content = (hover as any)?.contents;
      expect(content.value).toContain('⚡ *Effect:*');
      expect(content.value).toContain('Stops creatures when powered');
      expect(content.value).toContain('*Requires:* Connection to recharge seam');
    });

    it('should show tile variant information', () => {
      const document = new TextDocument('tiles {\n  42,43,44,45\n}', 'manicminers');

      // Tiles 42,43,44,45 have variants based on tileId % 4
      // 42 % 4 = 2 (Edge), 43 % 4 = 3 (Intersect), 44 % 4 = 0 (Regular), 45 % 4 = 1 (Corner)
      const expectedVariants = ['Edge', 'Intersect', 'Regular', 'Corner'];
      for (let i = 0; i < 4; i++) {
        const position = new vscode.Position(1, 3 + i * 3);
        const hover = provider.provideHover(document, position, cancellationToken);
        const content = (hover as any)?.contents;
        expect(content.value).toContain(`*Variant:* ${expectedVariants[i]}`);
      }
    });

    it('should show tile color information', () => {
      const document = new TextDocument('tiles {\n  1,6,11\n}', 'manicminers');

      // Test ground tile color
      let position = new vscode.Position(1, 3); // Position on '1'
      let hover = provider.provideHover(document, position, cancellationToken);
      let content = (hover as any)?.contents;
      expect(content.value).toContain('*Color:*');
      expect(content.value).toContain('RGB(124, 92, 70)');

      // Test lava tile color
      position = new vscode.Position(1, 5); // Position on '6'
      hover = provider.provideHover(document, position, cancellationToken);
      content = (hover as any)?.contents;
      expect(content.value).toContain('RGB(255, 50, 0)');
    });
  });

  describe('Building Hover Enhancements', () => {
    it('should show detailed building information', () => {
      const document = new TextDocument('buildings {\n  BuildingToolStore_C\n}', 'manicminers');
      const position = new vscode.Position(1, 20); // Position on building name (middle of BuildingToolStore_C)

      const hover = provider.provideHover(document, position, cancellationToken);

      expect(hover).toBeInstanceOf(vscode.Hover);
      const content = (hover as any)?.contents;
      expect(content.value).toContain('**Building: Tool Store**');
      expect(content.value).toContain('The most important building');
      expect(content.value).toContain('*Power requirement:* Self-powered');
      expect(content.value).toContain('*Function:* Teleport pad');
    });

    it('should show power station details', () => {
      const document = new TextDocument('buildings {\n  BuildingPowerStation_C\n}', 'manicminers');
      const position = new vscode.Position(1, 20);

      const hover = provider.provideHover(document, position, cancellationToken);

      const content = (hover as any)?.contents;
      expect(content.value).toContain('**Building: Power Station**');
      expect(content.value).toContain('Generates power for your base');
      expect(content.value).toContain('*Power output:* Powers adjacent buildings');
      expect(content.value).toContain('*Upgrade benefit:* Increased power range');
    });

    it('should show mining laser details', () => {
      const document = new TextDocument('buildings {\n  BuildingMiningLaser_C\n}', 'manicminers');
      const position = new vscode.Position(1, 20);

      const hover = provider.provideHover(document, position, cancellationToken);

      const content = (hover as any)?.contents;
      expect(content.value).toContain('**Building: Mining Laser**');
      expect(content.value).toContain('Automated laser that drills walls');
      expect(content.value).toContain('*Power requirement:* High power consumption');
      expect(content.value).toContain('*Range:* 5 tiles');
      expect(content.value).toContain('*Drill speed:* Faster than vehicles');
    });

    it('should explain power path connections', () => {
      const document = new TextDocument('buildings {\n  Powerpaths=X=1\n}', 'manicminers');
      const position = new vscode.Position(1, 4); // Position on 'Powerpaths'

      const hover = provider.provideHover(document, position, cancellationToken);

      const content = (hover as any)?.contents;
      expect(content.value).toContain('**Power Path Connections**');
      expect(content.value).toContain('Defines where power cables connect');
      expect(content.value).toContain('*Format:* X=dx Y=dy Z=dz/');
      expect(content.value).toContain('*Directions:* X=1 (east)');
    });
  });

  describe('Vehicle Hover Enhancements', () => {
    it('should show vehicle details', () => {
      const document = new TextDocument('vehicles {\n  VehicleSmallDigger_C\n}', 'manicminers');
      const position = new vscode.Position(1, 15);

      const hover = provider.provideHover(document, position, cancellationToken);

      const content = (hover as any)?.contents;
      expect(content.value).toContain('**Vehicle: Small Digger**');
      expect(content.value).toContain('Small drilling vehicle');
      expect(content.value).toContain('*Cargo:* 2 units');
      expect(content.value).toContain('*Speed:* Fast');
      expect(content.value).toContain('*Upgrades:* Engine, Drill, Scanner');
    });

    it('should show hover scout details', () => {
      const document = new TextDocument('vehicles {\n  VehicleHoverScout_C\n}', 'manicminers');
      const position = new vscode.Position(1, 15);

      const hover = provider.provideHover(document, position, cancellationToken);

      const content = (hover as any)?.contents;
      expect(content.value).toContain('**Vehicle: Hover Scout**');
      expect(content.value).toContain('Fast hover vehicle that can travel over water');
      expect(content.value).toContain('*Cargo:* 1 unit');
      expect(content.value).toContain('*Speed:* Very fast');
      expect(content.value).toContain('*Special:* Can cross water tiles');
    });

    it('should show vehicle upgrade details', () => {
      const document = new TextDocument('vehicles {\n  upgrades=UpEngine\n}', 'manicminers');
      const position = new vscode.Position(1, 12); // Position on 'UpEngine'

      const hover = provider.provideHover(document, position, cancellationToken);

      const content = (hover as any)?.contents;
      expect(content.value).toContain('**Vehicle Upgrade: UpEngine**');
      expect(content.value).toContain('Engine upgrade - Increases vehicle speed and acceleration');
    });
  });

  describe('Timed Event Hover', () => {
    it('should show landslide event details', () => {
      const document = new TextDocument(
        'landslidefrequency {\n  30:10,15/12,15/\n}',
        'manicminers'
      );
      const position = new vscode.Position(1, 3); // Position on '30'

      const hover = provider.provideHover(document, position, cancellationToken);

      const content = (hover as any)?.contents;
      expect(content.value).toContain('**Landslide Event**');
      expect(content.value).toContain('*Time:* 30 seconds after level start');
      expect(content.value).toContain('*Format:* time:x1,y1/x2,y2/');
      expect(content.value).toContain('*Effect:* Causes landslides at specified coordinates');
    });

    it('should show lava spread event details', () => {
      const document = new TextDocument('lavaspread {\n  60:5,5/5,6/5,7/\n}', 'manicminers');
      const position = new vscode.Position(1, 3); // Position on '60'

      const hover = provider.provideHover(document, position, cancellationToken);

      const content = (hover as any)?.contents;
      expect(content.value).toContain('**Lava Spread Event**');
      expect(content.value).toContain('*Time:* 60 seconds after level start');
      expect(content.value).toContain('*Format:* time:x1,y1/x2,y2/');
      expect(content.value).toContain('*Effect:* Spreads lava to specified coordinates');
    });

    it('should show section hover for timed events', () => {
      const document = new TextDocument('landslidefrequency {\n  \n}', 'manicminers');
      const position = new vscode.Position(0, 10); // Position on section name

      const hover = provider.provideHover(document, position, cancellationToken);

      const content = (hover as any)?.contents;
      expect(content.value).toContain('**landslidefrequency section**');
      expect(content.value).toContain('Optional section defining landslide probability');
    });
  });

  describe('Script Hover Enhancements', () => {
    it('should show script command details', () => {
      const scriptCommands = [
        { cmd: 'msg', contains: 'Display a message to the player' },
        { cmd: 'pan', contains: 'Pan the camera to the specified grid coordinates' },
        { cmd: 'drill', contains: 'Drill the wall at coordinates' },
        { cmd: 'emerge', contains: 'Make a creature emerge from the ground' },
      ];

      scriptCommands.forEach(({ cmd, contains }) => {
        const document = new TextDocument(`script {\n  ${cmd}:params\n}`, 'manicminers');
        const position = new vscode.Position(1, 3);

        const hover = provider.provideHover(document, position, cancellationToken);
        const content = (hover as any)?.contents;
        expect(content.value).toContain(`**${cmd} command**`);
        expect(content.value).toContain(contains);
      });
    });

    it.skip('should show miner equipment hover', () => {
      const document = new TextDocument('miners {\n  Drill/Shovel/Dynamite\n}', 'manicminers');

      // Test Drill
      let position = new vscode.Position(1, 3);
      let hover = provider.provideHover(document, position, cancellationToken);
      let content = (hover as any)?.contents;
      expect(content.value).toContain('**Miner Equipment: Drill**');
      expect(content.value).toContain('Handheld drill for breaking through walls');

      // Test Dynamite
      position = new vscode.Position(1, 15);
      hover = provider.provideHover(document, position, cancellationToken);
      content = (hover as any)?.contents;
      expect(content.value).toContain('**Miner Equipment: Dynamite**');
      expect(content.value).toContain('Explosives for clearing large areas');
    });

    it.skip('should show miner job hover', () => {
      const document = new TextDocument('miners {\n  JobPilot/JobGeologist\n}', 'manicminers');

      // Test Pilot
      let position = new vscode.Position(1, 5);
      let hover = provider.provideHover(document, position, cancellationToken);
      let content = (hover as any)?.contents;
      expect(content.value).toContain('**Miner Job: JobPilot**');
      expect(content.value).toContain('Pilot - Can operate flying vehicles');

      // Test Geologist
      position = new vscode.Position(1, 15);
      hover = provider.provideHover(document, position, cancellationToken);
      content = (hover as any)?.contents;
      expect(content.value).toContain('**Miner Job: JobGeologist**');
      expect(content.value).toContain('Geologist - Can analyze and find resources');
    });
  });
});
