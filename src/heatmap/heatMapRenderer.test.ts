import { describe, expect, it } from '@jest/globals';
import { HeatMapRenderer } from './heatMapRenderer';
import { HeatMapData } from './pathfindingAnalyzer';

describe('HeatMapRenderer', () => {
  describe('generateHeatMapRenderData', () => {
    it('should generate render data with color mappings', () => {
      const heatMapData: HeatMapData = {
        grid: [
          [0, 5, 10],
          [2, 7, 3],
          [-1, 0, 5],
        ],
        maxValue: 10,
        minValue: 0,
        hotspots: [
          { row: 0, col: 2, value: 10 },
          { row: 1, col: 1, value: 7 },
        ],
        coldspots: [
          { row: 0, col: 0, value: 0 },
          { row: 2, col: 1, value: 0 },
        ],
      };

      const renderData = HeatMapRenderer.generateHeatMapRenderData(heatMapData, 'traffic');

      expect(renderData.grid).toHaveLength(3);
      expect(renderData.grid[0]).toHaveLength(3);

      // Check that each cell has value and color
      expect(renderData.grid[0][0]).toHaveProperty('value', 0);
      expect(renderData.grid[0][0]).toHaveProperty('color');
      expect(renderData.grid[0][0].color).toMatch(/^#[0-9A-F]{6}$/i);

      // Check negative values get null color
      expect(renderData.grid[2][0].value).toBe(-1);
      expect(renderData.grid[2][0].color).toBe('#333333');

      // Check hotspots are included
      expect(renderData.hotspots).toHaveLength(2);
      expect(renderData.hotspots[0]).toEqual({ row: 0, col: 2, value: 10 });
    });

    it('should handle different color schemes', () => {
      const heatMapData: HeatMapData = {
        grid: [[0, 5, 10]],
        maxValue: 10,
        minValue: 0,
        hotspots: [],
        coldspots: [],
      };

      const trafficData = HeatMapRenderer.generateHeatMapRenderData(heatMapData, 'traffic');
      const accessibilityData = HeatMapRenderer.generateHeatMapRenderData(
        heatMapData,
        'accessibility'
      );
      const chokepointData = HeatMapRenderer.generateHeatMapRenderData(heatMapData, 'chokepoint');

      // Different schemes should produce different colors for the same value
      expect(trafficData.scheme.name).toBe('Traffic');
      expect(accessibilityData.scheme.name).toBe('Accessibility');
      expect(chokepointData.scheme.name).toBe('Chokepoint');

      // Colors should be different between schemes
      expect(trafficData.grid[0][1].color).not.toBe(accessibilityData.grid[0][1].color);
      expect(accessibilityData.grid[0][1].color).not.toBe(chokepointData.grid[0][1].color);
    });

    it('should handle edge cases', () => {
      // All same values
      const uniformData: HeatMapData = {
        grid: [
          [5, 5],
          [5, 5],
        ],
        maxValue: 5,
        minValue: 5,
        hotspots: [],
        coldspots: [],
      };

      const renderData = HeatMapRenderer.generateHeatMapRenderData(uniformData, 'traffic');

      // Should use first color when all values are the same
      expect(renderData.grid[0][0].color).toBe('#0000FF');
      expect(renderData.grid[0][1].color).toBe('#0000FF');
    });
  });

  describe('generateLegendData', () => {
    it('should generate legend data with correct values', () => {
      const legendData = HeatMapRenderer.generateLegendData('traffic', 0, 100);

      expect(legendData.scheme.name).toBe('Traffic');
      expect(legendData.minValue).toBe(0);
      expect(legendData.maxValue).toBe(100);
      expect(legendData.midValue).toBe(50);
    });

    it('should calculate correct mid value', () => {
      const legendData = HeatMapRenderer.generateLegendData('accessibility', 10, 30);

      expect(legendData.midValue).toBe(20);
    });
  });

  describe('generateStatistics', () => {
    it('should generate comprehensive statistics', () => {
      const heatMapData: HeatMapData = {
        grid: [
          [0, 5, 10],
          [2, 0, 3],
          [-1, 0, 5],
        ],
        maxValue: 10,
        minValue: 0,
        hotspots: [
          { row: 0, col: 2, value: 10 },
          { row: 0, col: 1, value: 5 },
          { row: 2, col: 2, value: 5 },
        ],
        coldspots: [
          { row: 0, col: 0, value: 0 },
          { row: 1, col: 1, value: 0 },
          { row: 2, col: 1, value: 0 },
        ],
      };

      const stats = HeatMapRenderer.generateStatistics(heatMapData);

      expect(stats).toContain('Heat Map Statistics');
      expect(stats).toContain('Range: 0.00 - 10.00');
      expect(stats).toContain('Average:');
      expect(stats).toContain('Zero values: 3');
      expect(stats).toContain('Top 5 Hotspots:');
      expect(stats).toContain('1. Row 0, Col 2: 10.00');
      expect(stats).toContain('Top 5 Coldspots:');
      expect(stats).toContain('1. Row 0, Col 0: 0.00');
    });

    it('should handle empty heat maps', () => {
      const emptyData: HeatMapData = {
        grid: [
          [-1, -1],
          [-1, -1],
        ],
        maxValue: -Infinity,
        minValue: Infinity,
        hotspots: [],
        coldspots: [],
      };

      const stats = HeatMapRenderer.generateStatistics(emptyData);

      expect(stats).toContain('Heat Map Statistics');
      expect(stats).toContain('Average: 0.00');
      expect(stats).toContain('Zero values: 0');
    });
  });

  describe('color interpolation', () => {
    it('should interpolate colors correctly', () => {
      const heatMapData: HeatMapData = {
        grid: [[0, 2.5, 5, 7.5, 10]],
        maxValue: 10,
        minValue: 0,
        hotspots: [],
        coldspots: [],
      };

      const renderData = HeatMapRenderer.generateHeatMapRenderData(heatMapData, 'traffic');

      // Check that colors are interpolated between the scheme colors
      const colors = renderData.grid[0].map(cell => cell.color);

      // First should be blue (low traffic)
      expect(colors[0]).toBe('#0000FF');

      // Last should be red (high traffic)
      expect(colors[4]).toBe('#FF0000');

      // Middle values should be interpolated
      expect(colors[1]).not.toBe('#0000FF');
      expect(colors[1]).not.toBe('#FF0000');
      expect(colors[2]).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });
});
