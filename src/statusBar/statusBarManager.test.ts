import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import * as vscode from 'vscode';
import { StatusBarManager } from './statusBarManager';
import { DatFileParser } from '../parser/datFileParser';

// Mock the DatFileParser
jest.mock('../parser/datFileParser');

describe('StatusBarManager', () => {
  let statusBarManager: StatusBarManager;
  let mockStatusBarItems: {
    mapInfoItem: any;
    tileInfoItem: any;
    validationItem: any;
    performanceItem: any;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock status bar items
    mockStatusBarItems = {
      mapInfoItem: {
        text: '',
        tooltip: '',
        command: '',
        backgroundColor: undefined,
        show: jest.fn(),
        hide: jest.fn(),
        dispose: jest.fn(),
      },
      tileInfoItem: {
        text: '',
        tooltip: '',
        command: '',
        backgroundColor: undefined,
        show: jest.fn(),
        hide: jest.fn(),
        dispose: jest.fn(),
      },
      validationItem: {
        text: '',
        tooltip: '',
        command: '',
        backgroundColor: undefined,
        show: jest.fn(),
        hide: jest.fn(),
        dispose: jest.fn(),
      },
      performanceItem: {
        text: '',
        tooltip: '',
        command: '',
        backgroundColor: undefined,
        show: jest.fn(),
        hide: jest.fn(),
        dispose: jest.fn(),
      },
    };

    // Mock window.createStatusBarItem to return our mocks in order
    (vscode.window.createStatusBarItem as jest.Mock)
      .mockReturnValueOnce(mockStatusBarItems.mapInfoItem)
      .mockReturnValueOnce(mockStatusBarItems.tileInfoItem)
      .mockReturnValueOnce(mockStatusBarItems.validationItem)
      .mockReturnValueOnce(mockStatusBarItems.performanceItem);

    statusBarManager = new StatusBarManager();
  });

  describe('constructor', () => {
    it('should create and show all status bar items', () => {
      expect(vscode.window.createStatusBarItem).toHaveBeenCalledTimes(4);

      // Check alignments and priorities
      expect(vscode.window.createStatusBarItem).toHaveBeenNthCalledWith(
        1,
        vscode.StatusBarAlignment.Left,
        100
      );
      expect(vscode.window.createStatusBarItem).toHaveBeenNthCalledWith(
        2,
        vscode.StatusBarAlignment.Left,
        99
      );
      expect(vscode.window.createStatusBarItem).toHaveBeenNthCalledWith(
        3,
        vscode.StatusBarAlignment.Left,
        98
      );
      expect(vscode.window.createStatusBarItem).toHaveBeenNthCalledWith(
        4,
        vscode.StatusBarAlignment.Right,
        100
      );

      // Check all items are shown
      expect(mockStatusBarItems.mapInfoItem.show).toHaveBeenCalled();
      expect(mockStatusBarItems.tileInfoItem.show).toHaveBeenCalled();
      expect(mockStatusBarItems.validationItem.show).toHaveBeenCalled();
      expect(mockStatusBarItems.performanceItem.show).toHaveBeenCalled();
    });

    it('should set commands for interactive items', () => {
      expect(mockStatusBarItems.mapInfoItem.command).toBe('manicMiners.showMapInfo');
      expect(mockStatusBarItems.tileInfoItem.command).toBe('manicMiners.showTilePalette');
      expect(mockStatusBarItems.validationItem.command).toBe('manicMiners.runValidation');
    });

    it('should set initial state', () => {
      expect(mockStatusBarItems.mapInfoItem.text).toBe('$(map) No map open');
      expect(mockStatusBarItems.tileInfoItem.text).toBe('$(symbol-color) Tile: 1 - Ground');
      expect(mockStatusBarItems.validationItem.text).toBe('$(sync~spin) Validation...');
    });
  });

  describe('updateMapInfo', () => {
    it('should update map info with valid data', () => {
      statusBarManager.updateMapInfo({
        rows: 50,
        cols: 50,
        title: 'Test Map',
        biome: 'lava',
      });

      expect(mockStatusBarItems.mapInfoItem.text).toBe('$(map) Test Map (50×50)');
      expect(mockStatusBarItems.mapInfoItem.tooltip).toBeInstanceOf(vscode.MarkdownString);
    });

    it('should show no map message when info is undefined', () => {
      statusBarManager.updateMapInfo(undefined);

      expect(mockStatusBarItems.mapInfoItem.text).toBe('$(map) No map open');
      expect(mockStatusBarItems.mapInfoItem.tooltip).toBe(
        'Open a .dat file to see map information'
      );
    });
  });

  describe('updateTileInfo', () => {
    it('should update tile info correctly', () => {
      statusBarManager.updateTileInfo(42, 'Energy Crystal');

      expect(mockStatusBarItems.tileInfoItem.text).toBe(
        '$(symbol-color) Tile: 42 - Energy Crystal'
      );
      expect(mockStatusBarItems.tileInfoItem.tooltip).toBe('Click to open tile palette');
    });
  });

  describe('updateValidation', () => {
    it('should show valid status', () => {
      statusBarManager.updateValidation('valid');

      expect(mockStatusBarItems.validationItem.text).toBe('$(check) Valid');
      expect(mockStatusBarItems.validationItem.tooltip).toBe('Map validation passed');
      expect(mockStatusBarItems.validationItem.backgroundColor).toBeUndefined();
    });

    it('should show error status with count', () => {
      statusBarManager.updateValidation('errors', { errors: 5, warnings: 0 });

      expect(mockStatusBarItems.validationItem.text).toBe('$(error) 5 errors');
      expect(mockStatusBarItems.validationItem.tooltip).toBe('Click to run validation');
      expect(mockStatusBarItems.validationItem.backgroundColor).toBeInstanceOf(vscode.ThemeColor);
    });

    it('should show warning status with count', () => {
      statusBarManager.updateValidation('warnings', { errors: 0, warnings: 3 });

      expect(mockStatusBarItems.validationItem.text).toBe('$(warning) 3 warnings');
      expect(mockStatusBarItems.validationItem.tooltip).toBe('Click to run validation');
      expect(mockStatusBarItems.validationItem.backgroundColor).toBeInstanceOf(vscode.ThemeColor);
    });

    it('should show pending status', () => {
      statusBarManager.updateValidation('pending');

      expect(mockStatusBarItems.validationItem.text).toBe('$(sync~spin) Validation...');
      expect(mockStatusBarItems.validationItem.tooltip).toBe('Validation in progress');
      expect(mockStatusBarItems.validationItem.backgroundColor).toBeUndefined();
    });
  });

  describe('updatePerformance', () => {
    it('should update performance stats', () => {
      statusBarManager.updatePerformance({
        tileCount: 2500,
        crystals: 10,
        ore: 5,
      });

      expect(mockStatusBarItems.performanceItem.text).toBe(
        '$(dashboard) Tiles: 2500 | $(gem) 10 | $(database) 5'
      );
      expect(mockStatusBarItems.performanceItem.tooltip).toBeInstanceOf(vscode.MarkdownString);
    });
  });

  describe('updateActiveDocument', () => {
    it('should update all items for valid .dat document', () => {
      const mockDocument = {
        fileName: '/test/map.dat',
        getText: jest.fn(() => 'mock content'),
      } as any;

      const mockDatFile = {
        info: {
          rowcount: 30,
          colcount: 40,
          levelname: 'Test Level',
          biome: 'ice',
        },
        tiles: Array(30).fill(Array(40).fill(1)),
      };

      // Mock the parser
      const mockParse = jest.fn(() => mockDatFile);
      (DatFileParser as jest.MockedClass<typeof DatFileParser>).mockImplementation(
        () =>
          ({
            parse: mockParse,
          }) as any
      );

      statusBarManager.updateActiveDocument(mockDocument);

      // Check parser was used
      expect(DatFileParser).toHaveBeenCalledWith('mock content');
      expect(mockParse).toHaveBeenCalled();

      // Check map info was updated
      expect(mockStatusBarItems.mapInfoItem.text).toBe('$(map) Test Level (30×40)');

      // Check performance info was updated
      expect(mockStatusBarItems.performanceItem.text).toContain('Tiles: 1200');
    });

    it('should count crystals and ore correctly', () => {
      const mockDocument = {
        fileName: '/test/map.dat',
        getText: jest.fn(() => 'mock content'),
      } as any;

      // Create tiles with crystals (42-45) and ore (46-49)
      const tiles = [];
      for (let i = 0; i < 10; i++) {
        const row = [];
        for (let j = 0; j < 10; j++) {
          if (i < 3)
            row.push(42); // Crystal
          else if (i < 5)
            row.push(46); // Ore
          else row.push(1); // Ground
        }
        tiles.push(row);
      }

      const mockDatFile = {
        info: {
          rowcount: 10,
          colcount: 10,
          levelname: 'Resource Test',
          biome: 'rock',
        },
        tiles: tiles,
      };

      const mockParse = jest.fn(() => mockDatFile);
      (DatFileParser as jest.MockedClass<typeof DatFileParser>).mockImplementation(
        () =>
          ({
            parse: mockParse,
          }) as any
      );

      statusBarManager.updateActiveDocument(mockDocument);

      // Should count 30 crystals and 20 ore
      expect(mockStatusBarItems.performanceItem.text).toBe(
        '$(dashboard) Tiles: 100 | $(gem) 30 | $(database) 20'
      );
    });

    it('should handle non-.dat documents', () => {
      const mockDocument = {
        fileName: '/test/file.txt',
        getText: jest.fn(),
      } as any;

      statusBarManager.updateActiveDocument(mockDocument);

      expect(mockStatusBarItems.mapInfoItem.text).toBe('$(map) No map open');
      expect(DatFileParser).not.toHaveBeenCalled();
    });

    it('should handle undefined document', () => {
      statusBarManager.updateActiveDocument(undefined);

      expect(mockStatusBarItems.mapInfoItem.text).toBe('$(map) No map open');
    });

    it('should handle parser errors gracefully', () => {
      const mockDocument = {
        fileName: '/test/map.dat',
        getText: jest.fn(() => 'invalid content'),
      } as any;

      const mockParse = jest.fn(() => {
        throw new Error('Parse error');
      });
      (DatFileParser as jest.MockedClass<typeof DatFileParser>).mockImplementation(
        () =>
          ({
            parse: mockParse,
          }) as any
      );

      statusBarManager.updateActiveDocument(mockDocument);

      expect(mockStatusBarItems.mapInfoItem.text).toBe('$(map) No map open');
    });
  });

  describe('updateStatusBarItem', () => {
    it('should update selected tile from string', () => {
      statusBarManager.updateStatusBarItem({
        selectedTile: 'Tile: 99 - Custom Tile',
      });

      expect(mockStatusBarItems.tileInfoItem.text).toBe('$(symbol-color) Tile: 99 - Custom Tile');
    });

    it('should update validation status from error string', () => {
      statusBarManager.updateStatusBarItem({
        validation: '3 errors found',
      });

      expect(mockStatusBarItems.validationItem.text).toBe('$(error) 3 errors');
    });

    it('should update validation status from warning string', () => {
      statusBarManager.updateStatusBarItem({
        validation: '2 warnings found',
      });

      expect(mockStatusBarItems.validationItem.text).toBe('$(warning) 2 warnings');
    });

    it('should update validation status from valid string', () => {
      statusBarManager.updateStatusBarItem({
        validation: 'Valid',
      });

      expect(mockStatusBarItems.validationItem.text).toBe('$(check) Valid');
    });

    it('should handle multiple updates', () => {
      statusBarManager.updateStatusBarItem({
        selectedTile: 'Tile: 10 - Wall',
        validation: '1 error found',
      });

      expect(mockStatusBarItems.tileInfoItem.text).toBe('$(symbol-color) Tile: 10 - Wall');
      expect(mockStatusBarItems.validationItem.text).toBe('$(error) 1 errors');
    });
  });

  describe('dispose', () => {
    it('should dispose all status bar items', () => {
      statusBarManager.dispose();

      expect(mockStatusBarItems.mapInfoItem.dispose).toHaveBeenCalled();
      expect(mockStatusBarItems.tileInfoItem.dispose).toHaveBeenCalled();
      expect(mockStatusBarItems.validationItem.dispose).toHaveBeenCalled();
      expect(mockStatusBarItems.performanceItem.dispose).toHaveBeenCalled();
    });
  });
});
