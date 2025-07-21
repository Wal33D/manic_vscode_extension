import * as vscode from 'vscode';
import { DatFileParser } from '../parser/datFileParser';

export interface MapVersion {
  hash: string;
  date: Date;
  message: string;
  author?: string;
  tiles?: number[][];
}

export interface MapDiff {
  added: { row: number; col: number; tile: number }[];
  removed: { row: number; col: number; tile: number }[];
  modified: { row: number; col: number; oldTile: number; newTile: number }[];
  statistics: {
    totalChanges: number;
    tilesAdded: number;
    tilesRemoved: number;
    tilesModified: number;
  };
}

export class MapVersionControl {
  private versions: Map<string, MapVersion> = new Map();
  private currentVersion?: string;

  constructor(private context: vscode.ExtensionContext) {
    this.loadVersionHistory();
  }

  /**
   * Create a new version from current document
   */
  public async createVersion(document: vscode.TextDocument, message: string): Promise<string> {
    const parser = new DatFileParser(document.getText());
    const tilesSection = parser.getSection('tiles');

    if (!tilesSection) {
      throw new Error('No tiles section found in document');
    }

    const tiles = this.parseTiles(tilesSection.content);
    const hash = this.generateHash(tiles);

    const version: MapVersion = {
      hash,
      date: new Date(),
      message,
      author: await this.getGitAuthor(),
      tiles,
    };

    this.versions.set(hash, version);
    this.currentVersion = hash;
    await this.saveVersionHistory();

    return hash;
  }

  /**
   * Get diff between two versions
   */
  public getDiff(fromHash: string, toHash: string): MapDiff | null {
    const fromVersion = this.versions.get(fromHash);
    const toVersion = this.versions.get(toHash);

    if (!fromVersion?.tiles || !toVersion?.tiles) {
      return null;
    }

    const diff: MapDiff = {
      added: [],
      removed: [],
      modified: [],
      statistics: {
        totalChanges: 0,
        tilesAdded: 0,
        tilesRemoved: 0,
        tilesModified: 0,
      },
    };

    const fromTiles = fromVersion.tiles;
    const toTiles = toVersion.tiles;

    // Compare tiles
    const maxRows = Math.max(fromTiles.length, toTiles.length);
    const maxCols = Math.max(fromTiles[0]?.length || 0, toTiles[0]?.length || 0);

    for (let row = 0; row < maxRows; row++) {
      for (let col = 0; col < maxCols; col++) {
        const fromTile = fromTiles[row]?.[col];
        const toTile = toTiles[row]?.[col];

        if (fromTile === undefined && toTile !== undefined) {
          diff.added.push({ row, col, tile: toTile });
          diff.statistics.tilesAdded++;
        } else if (fromTile !== undefined && toTile === undefined) {
          diff.removed.push({ row, col, tile: fromTile });
          diff.statistics.tilesRemoved++;
        } else if (fromTile !== toTile && fromTile !== undefined && toTile !== undefined) {
          diff.modified.push({ row, col, oldTile: fromTile, newTile: toTile });
          diff.statistics.tilesModified++;
        }
      }
    }

    diff.statistics.totalChanges =
      diff.statistics.tilesAdded + diff.statistics.tilesRemoved + diff.statistics.tilesModified;

    return diff;
  }

  /**
   * Get all versions
   */
  public getVersions(): MapVersion[] {
    return Array.from(this.versions.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  /**
   * Get a specific version
   */
  public getVersion(hash: string): MapVersion | undefined {
    return this.versions.get(hash);
  }

  /**
   * Restore a version to the document
   */
  public async restoreVersion(document: vscode.TextDocument, hash: string): Promise<boolean> {
    const version = this.versions.get(hash);
    if (!version?.tiles) {
      return false;
    }

    const parser = new DatFileParser(document.getText());
    const tilesSection = parser.getSection('tiles');

    if (!tilesSection) {
      return false;
    }

    // Convert tiles back to string format
    const tilesString = this.tilesToString(version.tiles);

    // Replace tiles section
    const edit = new vscode.WorkspaceEdit();
    // Find the position of tiles section in the document
    const lines = document.getText().split('\n');
    let startOffset = 0;
    let endOffset = 0;
    let currentOffset = 0;

    for (let i = 0; i < lines.length; i++) {
      if (i === tilesSection.startLine - 1) {
        startOffset = currentOffset;
      }
      if (i === tilesSection.endLine) {
        endOffset = currentOffset;
        break;
      }
      currentOffset += lines[i].length + 1; // +1 for newline
    }

    const startPos = document.positionAt(startOffset);
    const endPos = document.positionAt(endOffset);

    edit.replace(document.uri, new vscode.Range(startPos, endPos), `tiles{\n${tilesString}\n}`);

    const success = await vscode.workspace.applyEdit(edit);
    if (success) {
      this.currentVersion = hash;
    }

    return success;
  }

  /**
   * Get current version hash
   */
  public getCurrentVersion(): string | undefined {
    return this.currentVersion;
  }

  /**
   * Parse tiles from string to 2D array
   */
  private parseTiles(content: string): number[][] {
    const lines = content.trim().split('\n');
    const tiles: number[][] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        const row = trimmed
          .split(',')
          .map(t => t.trim())
          .filter(t => t)
          .map(t => parseInt(t, 10))
          .filter(n => !isNaN(n));

        if (row.length > 0) {
          tiles.push(row);
        }
      }
    }

    return tiles;
  }

  /**
   * Convert tiles array to string format
   */
  private tilesToString(tiles: number[][]): string {
    return tiles.map(row => row.join(',')).join('\n');
  }

  /**
   * Generate hash for tiles
   */
  private generateHash(tiles: number[][]): string {
    const content = JSON.stringify(tiles);
    let hash = 0;

    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Get git author if available
   */
  private async getGitAuthor(): Promise<string | undefined> {
    try {
      const gitExtension = vscode.extensions.getExtension('vscode.git');
      if (gitExtension) {
        const git = gitExtension.exports.getAPI(1);
        const repo = git.repositories[0];
        if (repo) {
          const config = await repo.getConfig('user.name');
          return config;
        }
      }
    } catch {
      // Ignore errors
    }
    return undefined;
  }

  /**
   * Load version history from storage
   */
  private async loadVersionHistory(): Promise<void> {
    const stored = this.context.globalState.get<string>('mapVersionHistory');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.versions = new Map(
          data.versions.map(
            (v: MapVersion) => [v.hash, { ...v, date: new Date(v.date) }] as [string, MapVersion]
          )
        );
        this.currentVersion = data.currentVersion;
      } catch {
        // Ignore parse errors
      }
    }
  }

  /**
   * Save version history to storage
   */
  private async saveVersionHistory(): Promise<void> {
    const data = {
      versions: Array.from(this.versions.entries()).map(([_hash, version]) => ({
        ...version,
        date: version.date.toISOString(),
      })),
      currentVersion: this.currentVersion,
    };

    await this.context.globalState.update('mapVersionHistory', JSON.stringify(data));
  }
}
