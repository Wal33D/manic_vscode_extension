/**
 * Type definitions for Manic Miner .dat file format
 */

// Tile type constants
export enum TileType {
  Ground = 1,
  Rubble1 = 2,
  Rubble2 = 3,
  Rubble3 = 4,
  Lava1 = 6,
  Lava2 = 7,
  Lava = 11,
  PowerPath = 12,
  Dirt = 14,
  LooseRock = 24,
  SolidRock = 26,
  Water = 30,
  EnergyCrystalSeam = 34,
  SolidWall = 38,
  OreSeam = 42,
  CrystalSeam = 46,
  ReinforcedWall = 50,
  Erosion1 = 60,
  Erosion2 = 61,
  Erosion3 = 62,
  SpecialTerrain = 63,
  SlugHole = 84,
  RechargeSeam = 88,
  DiggableTerrain = 101,
  IceTerrain = 103,
  Special1 = 105,
  Special2 = 106,
  Water1 = 111,
  Water2 = 114,
  HardRock = 124,
  SuperHardRock = 163,
}

// Biome types
export enum BiomeType {
  Rock = 'rock',
  Ice = 'ice',
  Lava = 'lava',
}

// Building types
export enum BuildingType {
  ToolStore = 'BuildingToolStore_C',
  PowerStation = 'BuildingPowerStation_C',
  TeleportPad = 'BuildingTeleportPad_C',
  SuperTeleport = 'BuildingSuperTeleport_C',
  OreRefinery = 'BuildingOreRefinery_C',
  Canteen = 'BuildingCanteen_C',
  GeologicalCenter = 'BuildingGeologicalCenter_C',
  SupportStation = 'BuildingSupportStation_C',
  UpgradeStation = 'BuildingUpgradeStation_C',
  Docks = 'BuildingDocks_C',
  ElectricFence = 'BuildingElectricFence_C',
  MiningLaser = 'BuildingMiningLaser_C',
}

// Vehicle types
export enum VehicleType {
  SmallTransportTruck = 'VehicleSmallTransportTruck_C',
  LMLC = 'VehicleLMLC_C',
  SMLC = 'VehicleSMLC_C',
  LoaderDozer = 'VehicleLoaderDozer_C',
  GraniteGrinder = 'VehicleGraniteGrinder_C',
  TunnelScout = 'VehicleTunnelScout_C',
  TunnelTransport = 'VehicleTunnelTransport_C',
  ChromeCrusher = 'VehicleChromeCrusher_C',
  CargoCarrier = 'VehicleCargoCarrier_C',
  SmallDigger = 'VehicleSmallDigger_C',
  RapidRider = 'VehicleRapidRider_C',
  HoverScout = 'VehicleHoverScout_C',
}

// Creature types
export enum CreatureType {
  RockMonster = 'CreatureRockMonster_C',
  LavaMonster = 'CreatureLavaMonster_C',
  IceMonster = 'CreatureIceMonster_C',
  SlimySlug = 'CreatureSlimySlug_C',
  SmallSpider = 'CreatureSmallSpider_C',
  Bat = 'CreatureBat_C',
}

// Coordinate system
export interface Coordinates {
  translation: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    p: number; // Pitch
    y: number; // Yaw
    r: number; // Roll
  };
  scale: {
    x: number;
    y: number;
    z: number;
  };
}

// Entity property types
export type EntityPropertyValue = string | number | boolean;

// Entity with position
export interface Entity {
  type: string;
  coordinates: Coordinates;
  properties?: Record<string, EntityPropertyValue>;
}

// Info section
export interface InfoSection {
  rowcount: number;
  colcount: number;
  camerapos?: Coordinates;
  camerazoom?: number;
  biome?: BiomeType;
  creator?: string;
  levelname?: string;
  version?: string;
  opencaves?: string;
  oxygen?: number;
  initialcrystals?: number;
  initialore?: number;
  spiderrate?: number;
  spidermin?: number;
  spidermax?: number;
  erosioninitialwaittime?: number;
  erosionscale?: number;
}

// Objective types
export interface ResourceObjective {
  type: 'resources';
  crystals: number;
  ore: number;
  studs: number;
}

export interface BuildingObjective {
  type: 'building';
  building: BuildingType;
}

export interface DiscoverObjective {
  type: 'discovertile';
  x: number;
  y: number;
  description: string;
}

export interface VariableObjective {
  type: 'variable';
  condition: string;
  description: string;
}

export interface FindMinerObjective {
  type: 'findminer';
  minerID: number;
}

export interface FindBuildingObjective {
  type: 'findbuilding';
  x: number;
  y: number;
}

export type Objective =
  | ResourceObjective
  | BuildingObjective
  | DiscoverObjective
  | VariableObjective
  | FindMinerObjective
  | FindBuildingObjective;

// Script types
export type ScriptVariableValue = string | number | boolean;

// Script commands
export interface ScriptCommand {
  command: string;
  parameters: string[];
}

export interface ScriptEvent {
  name: string;
  condition?: string;
  commands: ScriptCommand[];
}

export interface ScriptSection {
  variables: Map<string, ScriptVariableValue>;
  events: ScriptEvent[];
}

// Complete DAT file structure
export interface DatFile {
  comments?: string[];
  info: InfoSection;
  tiles: number[][];
  height: number[][];
  resources?: {
    crystals?: number[][];
    ore?: number[][];
  };
  objectives?: Objective[];
  buildings?: Entity[];
  vehicles?: Entity[];
  creatures?: Entity[];
  miners?: Entity[];
  blocks?: number[][];
  script?: ScriptSection;
  briefing?: string;
  briefingsuccess?: string;
  briefingfailure?: string;
  landslidefrequency?: number[][];
  lavaspread?: number[][];
}

// Parser error types
export class DatParseError extends Error {
  constructor(
    message: string,
    public line: number,
    public column: number,
    public section?: string
  ) {
    super(message);
    this.name = 'DatParseError';
  }
}

// Validation error types
export interface ValidationError {
  severity: 'error' | 'warning';
  message: string;
  line: number;
  column: number;
  section?: string;
}

// Section info for parser
export interface SectionInfo {
  name: string;
  startLine: number;
  endLine: number;
  content: string;
}
