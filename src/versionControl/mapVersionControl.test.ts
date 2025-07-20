import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import * as vscode from 'vscode';
import { MapVersionControl } from './mapVersionControl';

// Mock vscode
jest.mock('vscode', () => ({
  ExtensionContext: jest.fn(),
  extensions: {
    getExtension: jest.fn().mockReturnValue(null),
  },
  WorkspaceEdit: jest.fn().mockImplementation(() => ({
    replace: jest.fn(),
  })),
  workspace: {
    applyEdit: jest.fn(() => Promise.resolve(true)),
  },
  Range: jest.fn().mockImplementation((start, end) => ({ start, end })),
}));

describe('MapVersionControl', () => {
  let versionControl: MapVersionControl;
  let mockContext: any;
  let mockDocument: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock context
    mockContext = {
      globalState: {
        get: jest.fn(() => null),
        update: jest.fn(() => Promise.resolve()),
      },
    } as any;

    // Create mock document
    mockDocument = {
      getText: jest.fn().mockReturnValue(`
tiles{
1,1,1,1,1
1,26,26,26,1
1,26,42,26,1
1,26,26,26,1
1,1,1,1,1
}
      `),
      uri: { toString: () => 'test.dat' },
      positionAt: jest.fn().mockImplementation(offset => ({ line: 0, character: offset })),
    };

    versionControl = new MapVersionControl(mockContext);
  });

  describe('createVersion', () => {
    it('should create a new version from document', async () => {
      const hash = await versionControl.createVersion(mockDocument, 'Test version');

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should store version with correct properties', async () => {
      const message = 'Test version';
      const hash = await versionControl.createVersion(mockDocument, message);
      const version = versionControl.getVersion(hash);

      expect(version).toBeDefined();
      expect(version?.message).toBe(message);
      expect(version?.date).toBeInstanceOf(Date);
      expect(version?.tiles).toBeDefined();
      expect(version?.tiles?.length).toBe(5);
      expect(version?.tiles?.[0].length).toBe(5);
    });

    it('should throw error if no tiles section', async () => {
      mockDocument.getText.mockReturnValue('no tiles here');

      await expect(versionControl.createVersion(mockDocument, 'Test')).rejects.toThrow(
        'No tiles section found'
      );
    });
  });

  describe('getDiff', () => {
    it('should return null for non-existent versions', () => {
      const diff = versionControl.getDiff('invalid1', 'invalid2');
      expect(diff).toBeNull();
    });

    it('should calculate diff between versions', async () => {
      // Create first version
      const hash1 = await versionControl.createVersion(mockDocument, 'Version 1');

      // Modify document
      mockDocument.getText.mockReturnValue(`
tiles{
1,1,1,1,1
1,26,26,26,1
1,26,46,26,1
1,26,26,26,1
1,1,1,1,2
}
      `);

      // Create second version
      const hash2 = await versionControl.createVersion(mockDocument, 'Version 2');

      // Get diff
      const diff = versionControl.getDiff(hash1, hash2);

      expect(diff).toBeDefined();
      expect(diff?.statistics.totalChanges).toBe(2);
      expect(diff?.statistics.tilesModified).toBe(2); // Changed tiles at [2,2] and [4,4]
      expect(diff?.modified).toHaveLength(2);
      expect(diff?.modified[0]).toEqual({
        row: 2,
        col: 2,
        oldTile: 42,
        newTile: 46,
      });
    });

    it('should handle added and removed tiles', async () => {
      // Create first version with smaller map
      mockDocument.getText.mockReturnValue(`
tiles{
1,1,1
1,26,1
1,1,1
}
      `);
      const hash1 = await versionControl.createVersion(mockDocument, 'Small map');

      // Create second version with larger map
      mockDocument.getText.mockReturnValue(`
tiles{
1,1,1,1,1
1,26,1,26,1
1,1,1,1,1
1,1,1,1,1
}
      `);
      const hash2 = await versionControl.createVersion(mockDocument, 'Large map');

      const diff = versionControl.getDiff(hash1, hash2);

      expect(diff).toBeDefined();
      expect(diff?.statistics.tilesAdded).toBeGreaterThan(0);
      expect(diff?.added.length).toBeGreaterThan(0);
    });
  });

  describe('getVersions', () => {
    it('should return empty array when no versions', () => {
      const versions = versionControl.getVersions();
      expect(versions).toEqual([]);
    });

    it('should return versions sorted by date', async () => {
      await versionControl.createVersion(mockDocument, 'Version 1');

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Change content to get different hash
      mockDocument.getText.mockReturnValue(`
tiles{
1,1,1,1,1
1,26,26,26,1
1,26,46,26,1
1,26,26,26,1
1,1,1,1,1
}
      `);

      await versionControl.createVersion(mockDocument, 'Version 2');

      const versions = versionControl.getVersions();

      expect(versions).toHaveLength(2);
      expect(versions[0].message).toBe('Version 2'); // Most recent first
      expect(versions[1].message).toBe('Version 1');
    });
  });

  describe('restoreVersion', () => {
    it('should restore version to document', async () => {
      // Create a version first
      const hash = await versionControl.createVersion(mockDocument, 'Original');

      // Clear previous calls
      jest.clearAllMocks();

      // Restore it
      const success = await versionControl.restoreVersion(mockDocument, hash);

      expect(success).toBe(true);
      expect(vscode.WorkspaceEdit).toHaveBeenCalled();
      expect(vscode.workspace.applyEdit).toHaveBeenCalled();

      // Check that replace was called on the WorkspaceEdit instance
      const workspaceEditInstance = (vscode.WorkspaceEdit as jest.MockedFunction<any>).mock
        .results[0].value;
      expect(workspaceEditInstance.replace).toHaveBeenCalled();
    });

    it('should return false for non-existent version', async () => {
      const success = await versionControl.restoreVersion(mockDocument, 'invalid');
      expect(success).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should save version history', async () => {
      await versionControl.createVersion(mockDocument, 'Test');

      expect(mockContext.globalState.update).toHaveBeenCalledWith(
        'mapVersionHistory',
        expect.any(String)
      );
    });

    it('should load version history on creation', () => {
      const storedData = {
        versions: [
          {
            hash: 'abc123',
            date: new Date().toISOString(),
            message: 'Stored version',
            tiles: [[1, 2, 3]],
          },
        ],
        currentVersion: 'abc123',
      };

      mockContext.globalState.get.mockReturnValue(JSON.stringify(storedData));

      const newVersionControl = new MapVersionControl(mockContext);
      const versions = newVersionControl.getVersions();

      expect(versions).toHaveLength(1);
      expect(versions[0].message).toBe('Stored version');
      expect(newVersionControl.getCurrentVersion()).toBe('abc123');
    });
  });
});
