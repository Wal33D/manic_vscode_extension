import { describe, expect, it } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Snippets', () => {
  it('should have valid JSON snippets file', () => {
    const snippetsPath = path.join(__dirname, '../../snippets/manicminers.code-snippets');
    expect(fs.existsSync(snippetsPath)).toBe(true);

    const content = fs.readFileSync(snippetsPath, 'utf8');
    let snippets: any;

    expect(() => {
      snippets = JSON.parse(content);
    }).not.toThrow();

    // Check that we have snippets
    expect(Object.keys(snippets).length).toBeGreaterThan(0);
  });

  it('should have all expected snippet categories', () => {
    const snippetsPath = path.join(__dirname, '../../snippets/manicminers.code-snippets');
    const content = fs.readFileSync(snippetsPath, 'utf8');
    const snippets = JSON.parse(content);

    // Check for main categories
    const expectedSnippets = [
      'Basic Level Template',
      'Info Section',
      'Camera Position',
      'Objectives - Resources',
      'Building - Tool Store',
      'Script Event',
      'Tile Row',
      'Briefing Text',
    ];

    for (const snippetName of expectedSnippets) {
      expect(snippets[snippetName]).toBeDefined();
      expect(snippets[snippetName].prefix).toBeDefined();
      expect(snippets[snippetName].body).toBeDefined();
      expect(snippets[snippetName].description).toBeDefined();
    }
  });

  it('should have valid snippet structure', () => {
    const snippetsPath = path.join(__dirname, '../../snippets/manicminers.code-snippets');
    const content = fs.readFileSync(snippetsPath, 'utf8');
    const snippets = JSON.parse(content);

    for (const snippet of Object.values(snippets)) {
      // Check required fields
      expect(snippet).toHaveProperty('prefix');
      expect(snippet).toHaveProperty('body');
      expect(snippet).toHaveProperty('description');

      // Check types
      const s = snippet as any;
      expect(typeof s.prefix).toBe('string');
      expect(typeof s.description).toBe('string');
      expect(Array.isArray(s.body) || typeof s.body === 'string').toBe(true);

      // Check prefix is not empty
      expect(s.prefix.length).toBeGreaterThan(0);
    }
  });

  it('should have unique prefixes', () => {
    const snippetsPath = path.join(__dirname, '../../snippets/manicminers.code-snippets');
    const content = fs.readFileSync(snippetsPath, 'utf8');
    const snippets = JSON.parse(content);

    const prefixes = new Set<string>();
    for (const snippet of Object.values(snippets)) {
      const s = snippet as any;
      expect(prefixes.has(s.prefix)).toBe(false);
      prefixes.add(s.prefix);
    }
  });

  it('should have appropriate snippet content', () => {
    const snippetsPath = path.join(__dirname, '../../snippets/manicminers.code-snippets');
    const content = fs.readFileSync(snippetsPath, 'utf8');
    const snippets = JSON.parse(content);

    // Check specific snippets have expected content
    const basicLevel = snippets['Basic Level Template'];
    expect(basicLevel.body).toContain('info{');
    expect(basicLevel.body).toContain('tiles{');
    expect(basicLevel.body).toContain('height{');
    expect(basicLevel.body).toContain('objectives{');

    const cameraPos = snippets['Camera Position'];
    expect(cameraPos.body).toContain('Translation:');
    expect(cameraPos.body).toContain('Rotation:');
    expect(cameraPos.body).toContain('Scale');
  });
});
