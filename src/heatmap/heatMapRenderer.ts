import { HeatMapData } from './pathfindingAnalyzer';

export interface HeatMapColorScheme {
  name: string;
  colors: string[];
  nullColor: string;
}

export class HeatMapRenderer {
  private static readonly COLOR_SCHEMES: Map<string, HeatMapColorScheme> = new Map([
    [
      'traffic',
      {
        name: 'Traffic',
        colors: [
          '#0000FF', // Blue (low traffic)
          '#00FFFF', // Cyan
          '#00FF00', // Green
          '#FFFF00', // Yellow
          '#FFA500', // Orange
          '#FF0000', // Red (high traffic)
        ],
        nullColor: '#333333',
      },
    ],
    [
      'accessibility',
      {
        name: 'Accessibility',
        colors: [
          '#00FF00', // Green (close/accessible)
          '#7FFF00', // Chartreuse
          '#FFFF00', // Yellow
          '#FFA500', // Orange
          '#FF4500', // Orange Red
          '#FF0000', // Red (far/less accessible)
        ],
        nullColor: '#000000', // Black for unreachable
      },
    ],
    [
      'chokepoint',
      {
        name: 'Chokepoint',
        colors: [
          '#FFFFFF', // White (no chokepoint)
          '#FFFF99', // Light Yellow
          '#FFCC66', // Light Orange
          '#FF9933', // Orange
          '#FF6600', // Dark Orange
          '#FF0000', // Red (severe chokepoint)
        ],
        nullColor: '#333333',
      },
    ],
    [
      'temperature',
      {
        name: 'Temperature',
        colors: [
          '#0033FF', // Deep Blue
          '#0099FF', // Blue
          '#00FFFF', // Cyan
          '#99FF00', // Green-Yellow
          '#FFFF00', // Yellow
          '#FF9900', // Orange
          '#FF3300', // Red
          '#CC0000', // Dark Red
        ],
        nullColor: '#333333',
      },
    ],
  ]);

  /**
   * Generate heat map as data structure for webview rendering
   */
  public static generateHeatMapRenderData(
    heatMapData: HeatMapData,
    colorScheme: string
  ): {
    grid: Array<Array<{ value: number; color: string }>>;
    scheme: HeatMapColorScheme;
    hotspots: Array<{ row: number; col: number; value: number }>;
  } {
    const scheme = this.COLOR_SCHEMES.get(colorScheme) || this.COLOR_SCHEMES.get('traffic')!;
    const { grid, maxValue, minValue } = heatMapData;

    const colorGrid = grid.map(row =>
      row.map(value => {
        let color: string;
        if (value < 0) {
          color = scheme.nullColor;
        } else if (maxValue === minValue) {
          color = scheme.colors[0];
        } else {
          const normalized = (value - minValue) / (maxValue - minValue);
          color = this.getColorForValue(normalized, scheme.colors);
        }
        return { value, color };
      })
    );

    return {
      grid: colorGrid,
      scheme,
      hotspots: heatMapData.hotspots.slice(0, 10),
    };
  }

  /**
   * Generate legend data for webview rendering
   */
  public static generateLegendData(
    colorScheme: string,
    minValue: number,
    maxValue: number
  ): {
    scheme: HeatMapColorScheme;
    minValue: number;
    maxValue: number;
    midValue: number;
  } {
    const scheme = this.COLOR_SCHEMES.get(colorScheme) || this.COLOR_SCHEMES.get('traffic')!;
    const midValue = (maxValue + minValue) / 2;

    return {
      scheme,
      minValue,
      maxValue,
      midValue,
    };
  }

  /**
   * Get interpolated color for normalized value
   */
  private static getColorForValue(normalized: number, colors: string[]): string {
    // Clamp value
    normalized = Math.max(0, Math.min(1, normalized));

    // Find color segment
    const segments = colors.length - 1;
    const segment = normalized * segments;
    const segmentIndex = Math.floor(segment);
    const segmentFraction = segment - segmentIndex;

    if (segmentIndex >= segments) {
      return colors[colors.length - 1];
    }

    // Interpolate between colors
    const color1 = colors[segmentIndex];
    const color2 = colors[segmentIndex + 1];

    return this.interpolateColor(color1, color2, segmentFraction);
  }

  /**
   * Interpolate between two hex colors
   */
  private static interpolateColor(color1: string, color2: string, fraction: number): string {
    // Parse hex colors
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    // Interpolate
    const r = Math.round(r1 + (r2 - r1) * fraction);
    const g = Math.round(g1 + (g2 - g1) * fraction);
    const b = Math.round(b1 + (b2 - b1) * fraction);

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  /**
   * Generate heat map statistics
   */
  public static generateStatistics(heatMapData: HeatMapData): string {
    const { grid, maxValue, minValue, hotspots, coldspots } = heatMapData;

    // Calculate average
    let sum = 0;
    let count = 0;
    let zeros = 0;

    for (const row of grid) {
      for (const value of row) {
        if (value >= 0) {
          sum += value;
          count++;
          if (value === 0) {
            zeros++;
          }
        }
      }
    }

    const average = count > 0 ? sum / count : 0;

    // Generate report
    const lines = [
      '=== Heat Map Statistics ===',
      `Range: ${minValue.toFixed(2)} - ${maxValue.toFixed(2)}`,
      `Average: ${average.toFixed(2)}`,
      `Zero values: ${zeros}`,
      '',
      'Top 5 Hotspots:',
      ...hotspots
        .slice(0, 5)
        .map((h, i) => `  ${i + 1}. Row ${h.row}, Col ${h.col}: ${h.value.toFixed(2)}`),
      '',
      'Top 5 Coldspots:',
      ...coldspots
        .slice(0, 5)
        .map((c, i) => `  ${i + 1}. Row ${c.row}, Col ${c.col}: ${c.value.toFixed(2)}`),
    ];

    return lines.join('\n');
  }
}
