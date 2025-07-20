# Image Asset Integration Plan for Manic Miners VSCode Extension

## Executive Summary

This document outlines a comprehensive plan for integrating real game assets (images) into the Manic Miners VSCode extension. The goal is to enhance the visual experience across all extension features including hover tooltips, map preview, objective builder, and entity visualization.

## Current State Analysis

### Available Image Assets

1. **Building Images** (11 assets)
   - `docks.png` - BuildingDocks_C
   - `geological_center.png` - BuildingGeologicalCenter_C
   - `mining_laser.png` - BuildingMiningLaser_C
   - `ore_refinery.png` - BuildingOreRefinery_C
   - `power_station.png` - BuildingPowerStation_C
   - `super_teleport.png` - BuildingSuperTeleport_C
   - `support_station.png` - BuildingSupportStation_C
   - `teleport_pad.png` - BuildingTeleportPad_C
   - `tool_store.png` - BuildingToolStore_C
   - `upgrade_station.png` - BuildingUpgradeStation_C
   - **Missing**: `canteen.png` for BuildingCanteen_C

2. **Vehicle Images** (12 assets)
   - `cargo_carrier.png` - VehicleCargoCarrier_C
   - `chrome_crusher.png` - VehicleChromeCrusher_C
   - `granite_grinder.png` - VehicleGraniteGrinder_C
   - `hover_scout.png` - VehicleHoverScout_C
   - `large_mobile_laser_cutter.png` - VehicleLMLC_C
   - `loader_dozer.png` - VehicleLoaderDozer_C
   - `rapid_rider.png` - VehicleRapidRider_C
   - `small_digger.png` - VehicleSmallDigger_C
   - `small_mobile_laser_cutter.png` - VehicleSMLC_C
   - `small_transport_truck.png` - VehicleSmallTransportTruck_C
   - `tunnel_scout.png` - VehicleTunnelScout_C
   - `tunnel_transport.png` - VehicleTunnelTransport_C

3. **Tile Images** (3 assets)
   - `crystal_energy.png` - Crystal seam tiles (42-45, 92-95)
   - `crystal_energy_drained.png` - For future depleted crystal feature
   - `ore_resource.png` - Ore seam tiles (46-49, 96-99)
   - **Currently using**: crystal_energy.png as placeholder for recharge seams (50-53, 100-103)

4. **Icons**
   - `icon.png` - Extension icon
   - `manic-miners-128.png` - High-res icon
   - `manic-miners.ico` - Windows icon format

### Current Image Usage

1. **Hover Provider** (`src/hoverProvider.ts`)
   - Already displays tile images for resource tiles (crystal, ore, recharge)
   - Uses `getTileImagePath()` method to map tile IDs to image files
   - Images shown at 48x48 pixels in hover tooltips

2. **Map Preview** (`src/mapPreview/mapPreviewProvider.ts`)
   - Currently uses color-based rendering only
   - No image integration yet
   - Has canvas-based rendering system ready for enhancement

3. **Other Components**
   - No image usage in objective builder
   - No image usage in completion providers
   - No image usage for buildings/vehicles

## Integration Plan

### Phase 1: Enhanced Tile Image System

1. **Expand Tile Image Coverage**
   - Add images for common tiles (ground, lava, water, walls)
   - Create or source images for all 115+ tile types
   - Implement fallback to color rendering when images unavailable

2. **Map Preview Enhancement**
   - Add toggle for "Image Mode" vs "Color Mode"
   - Implement tile image rendering in canvas
   - Add image caching for performance
   - Support different zoom levels with image scaling

3. **Implementation Details**
   ```typescript
   // Add to mapPreviewProvider.ts
   private tileImageCache: Map<number, HTMLImageElement> = new Map();
   
   private async loadTileImage(tileId: number): Promise<HTMLImageElement | null> {
     if (this.tileImageCache.has(tileId)) {
       return this.tileImageCache.get(tileId)!;
     }
     
     const imagePath = this.getTileImagePath(tileId);
     if (!imagePath) return null;
     
     const img = new Image();
     img.src = imagePath;
     await img.decode();
     this.tileImageCache.set(tileId, img);
     return img;
   }
   ```

### Phase 2: Building & Vehicle Visualization

1. **Create Image Mapping System**
   ```typescript
   // New file: src/data/entityImageMap.ts
   export const BUILDING_IMAGE_MAP = new Map<BuildingType, string>([
     [BuildingType.ToolStore, 'tool_store.png'],
     [BuildingType.PowerStation, 'power_station.png'],
     // ... etc
   ]);
   
   export const VEHICLE_IMAGE_MAP = new Map<VehicleType, string>([
     [VehicleType.LoaderDozer, 'loader_dozer.png'],
     [VehicleType.ChromeCrusher, 'chrome_crusher.png'],
     // ... etc
   ]);
   ```

2. **Enhanced Hover Provider**
   - Add image display for building references in objectives
   - Show vehicle images when hovering over vehicle types
   - Display creature images (when available)

3. **Building/Vehicle Preview Panel**
   - New webview panel showing all buildings/vehicles in level
   - Visual representation with images
   - Click to navigate to definition in file

### Phase 3: Objective Builder Enhancement

1. **Visual Objective Selection**
   - Show building images when selecting building objectives
   - Display resource icons for resource objectives
   - Visual tile picker for location-based objectives

2. **Implementation**
   - Enhance objectiveBuilderProvider.ts with image support
   - Update webview HTML/CSS for image display
   - Add image-based selection UI

### Phase 4: Advanced Features

1. **Mini-Map with Images**
   - Small overview map using tile images
   - Real-time position tracking
   - Quick navigation

2. **Entity Inspector**
   - Visual list of all entities in level
   - Grouped by type with images
   - Properties panel for selected entity

3. **Visual Tile Palette**
   - Tile selection panel with images
   - Categories and search
   - Drag-and-drop support

## Technical Implementation Details

### Image Loading Strategy

1. **Lazy Loading**
   - Load images only when needed
   - Cache loaded images in memory
   - Clear cache on extension deactivation

2. **Performance Optimization**
   - Use appropriate image sizes (thumbnails for lists, full size for preview)
   - Implement virtual scrolling for large tile lists
   - Use CSS sprites for small, frequently used images

3. **Fallback Handling**
   - Always provide color-based fallback
   - Show placeholder image for missing assets
   - Log missing images for tracking

### File Structure

```
images/
├── tiles/
│   ├── terrain/
│   │   ├── ground.png
│   │   ├── lava.png
│   │   └── water.png
│   ├── walls/
│   │   ├── dirt/
│   │   ├── loose_rock/
│   │   └── hard_rock/
│   └── resources/
│       ├── crystal_energy.png
│       └── ore_resource.png
├── buildings/
│   └── [existing files]
├── vehicles/
│   └── [existing files]
└── creatures/
    ├── rock_monster.png
    ├── lava_monster.png
    └── slimy_slug.png
```

## Priority Implementation Order

1. **High Priority**
   - Complete tile image integration in map preview
   - Add building/vehicle images to hover tooltips
   - Create image mapping system

2. **Medium Priority**
   - Enhance objective builder with images
   - Add visual entity inspector
   - Implement tile palette

3. **Low Priority**
   - Mini-map feature
   - Advanced image effects (animations, overlays)
   - Custom image pack support

## Resource Requirements

1. **Missing Images Needed**
   - Canteen building
   - All creature types (6 total)
   - Most tile types (100+ tiles)
   - UI elements (power paths, erosion states, etc.)

2. **Development Time Estimate**
   - Phase 1: 2-3 days
   - Phase 2: 2-3 days
   - Phase 3: 1-2 days
   - Phase 4: 3-4 days
   - Total: 8-12 days

## Success Metrics

1. **Performance**
   - Map preview renders at 60 FPS with images
   - Image loading doesn't block UI
   - Memory usage stays under 100MB

2. **User Experience**
   - All tooltips show relevant images
   - Map preview is more intuitive
   - Visual feedback improves productivity

3. **Coverage**
   - 100% of buildings have images
   - 100% of vehicles have images
   - 80%+ of common tiles have images

## Conclusion

This comprehensive plan will transform the Manic Miners VSCode extension from a text-based tool to a visually rich development environment. The phased approach ensures steady progress while maintaining extension stability and performance.