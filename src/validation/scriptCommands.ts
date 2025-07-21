/**
 * Complete list of script commands with their validation rules
 * Based on game documentation
 */

export interface ScriptCommandDef {
  name: string;
  params: {
    min: number;
    max?: number;
    format?: string;
    description: string;
  };
  description: string;
  category:
    | 'message'
    | 'resource'
    | 'map'
    | 'entity'
    | 'camera'
    | 'flow'
    | 'sound'
    | 'visual'
    | 'timer'
    | 'math'
    | 'save';
}

export const SCRIPT_COMMANDS: Record<string, ScriptCommandDef> = {
  // Message Events
  msg: {
    name: 'msg',
    params: { min: 1, max: 1, description: 'Message string variable' },
    description: 'Display message in message panel',
    category: 'message',
  },
  qmsg: {
    name: 'qmsg',
    params: { min: 1, max: 1, description: 'Message string variable' },
    description: 'Display message and wait for acknowledgment',
    category: 'message',
  },
  msgchief: {
    name: 'msgChief',
    params: { min: 3, max: 3, format: 'row,col,audiofile', description: 'row, col, audio file' },
    description: 'Show Chief portrait with message and pan camera',
    category: 'message',
  },

  // Resource Events
  crystals: {
    name: 'crystals',
    params: { min: 1, max: 1, description: 'Amount to add/remove' },
    description: 'Add/remove energy crystals',
    category: 'resource',
  },
  ore: {
    name: 'ore',
    params: { min: 1, max: 1, description: 'Amount to add/remove' },
    description: 'Add/remove ore',
    category: 'resource',
  },
  studs: {
    name: 'studs',
    params: { min: 1, max: 1, description: 'Amount to add/remove' },
    description: 'Add/remove building studs',
    category: 'resource',
  },
  air: {
    name: 'air',
    params: { min: 1, max: 1, description: 'Amount to add/remove' },
    description: 'Add/remove oxygen (if oxygen enabled)',
    category: 'resource',
  },
  drain: {
    name: 'drain',
    params: { min: 1, max: 1, description: 'Amount to drain' },
    description: 'Drain crystals (like Slimy Slug)',
    category: 'resource',
  },

  // Map Modification
  place: {
    name: 'place',
    params: { min: 3, max: 3, format: 'row,col,tileID', description: 'row, col, tile ID' },
    description: 'Change tile at location',
    category: 'map',
  },
  drill: {
    name: 'drill',
    params: { min: 2, max: 2, format: 'row,col', description: 'row, col' },
    description: 'Drill wall at location',
    category: 'map',
  },
  placerubble: {
    name: 'placerubble',
    params: { min: 3, max: 3, format: 'row,col,height', description: 'row, col, height (1-4)' },
    description: 'Create rubble at location',
    category: 'map',
  },
  heighttrigger: {
    name: 'heighttrigger',
    params: { min: 2, max: 2, format: 'row,col', description: 'row, col' },
    description: 'Make tile drillable from above',
    category: 'map',
  },
  hiddencavern: {
    name: 'hiddencavern',
    params: { min: 4, max: 4, format: 'r1,c1,r2,c2', description: 'row1, col1, row2, col2' },
    description: 'Create hidden area rectangle',
    category: 'map',
  },

  // Entity Spawning
  emerge: {
    name: 'emerge',
    params: {
      min: 5,
      max: 5,
      format: 'row,col,direction,CreatureType,radius',
      description: 'row, col, direction (N/S/E/W/A), creature type, radius',
    },
    description: 'Spawn creature from wall',
    category: 'entity',
  },
  miners: {
    name: 'miners',
    params: { min: 3, max: 3, format: 'row,col,count', description: 'row, col, count' },
    description: 'Teleport Rock Raiders',
    category: 'entity',
  },

  // Camera Control
  pan: {
    name: 'pan',
    params: { min: 2, max: 2, format: 'row,col', description: 'row, col' },
    description: 'Move camera to location',
    category: 'camera',
  },
  shake: {
    name: 'shake',
    params: { min: 2, max: 2, format: 'intensity,duration', description: 'intensity, duration' },
    description: 'Shake camera',
    category: 'camera',
  },
  speed: {
    name: 'speed',
    params: { min: 1, max: 1, description: 'Speed multiplier' },
    description: 'Set game speed temporarily',
    category: 'camera',
  },
  resetspeed: {
    name: 'resetspeed',
    params: { min: 0, max: 0, description: 'No parameters' },
    description: 'Restore normal game speed',
    category: 'camera',
  },

  // Visual Effects
  showarrow: {
    name: 'showarrow',
    params: {
      min: 3,
      max: 3,
      format: 'row,col,ArrowVariable',
      description: 'row, col, arrow variable',
    },
    description: 'Display arrow at location',
    category: 'visual',
  },
  hidearrow: {
    name: 'hidearrow',
    params: { min: 1, max: 1, description: 'Arrow variable' },
    description: 'Hide arrow',
    category: 'visual',
  },
  highlight: {
    name: 'highlight',
    params: {
      min: 3,
      max: 3,
      format: 'row,col,ArrowVariable',
      description: 'row, col, arrow variable',
    },
    description: 'Highlight tile',
    category: 'visual',
  },
  highlightarrow: {
    name: 'highlightarrow',
    params: {
      min: 3,
      max: 3,
      format: 'row,col,ArrowVariable',
      description: 'row, col, arrow variable',
    },
    description: 'Show arrow and highlight',
    category: 'visual',
  },
  removearrow: {
    name: 'removearrow',
    params: { min: 1, max: 1, description: 'Arrow variable' },
    description: 'Remove arrow completely',
    category: 'visual',
  },

  // Game Flow
  win: {
    name: 'win',
    params: { min: 0, max: 1, description: 'Optional victory message' },
    description: 'Win the mission',
    category: 'flow',
  },
  lose: {
    name: 'lose',
    params: { min: 0, max: 1, description: 'Optional defeat message' },
    description: 'Lose the mission',
    category: 'flow',
  },
  reset: {
    name: 'reset',
    params: { min: 0, max: 0, description: 'No parameters' },
    description: "Reset player's selection",
    category: 'flow',
  },
  resume: {
    name: 'resume',
    params: { min: 0, max: 0, description: 'No parameters' },
    description: 'Resume the game',
    category: 'flow',
  },
  objective: {
    name: 'objective',
    params: { min: 1, max: 1, description: 'Objective text variable' },
    description: 'Set current objective text',
    category: 'flow',
  },
  pause: {
    name: 'pause',
    params: { min: 0, max: 0, description: 'No parameters' },
    description: 'Pause the game',
    category: 'flow',
  },
  unpause: {
    name: 'unpause',
    params: { min: 0, max: 0, description: 'No parameters' },
    description: 'Resume the game',
    category: 'flow',
  },

  // Sound
  sound: {
    name: 'sound',
    params: { min: 1, max: 1, description: 'Sound file name (without .ogg)' },
    description: 'Play sound file',
    category: 'sound',
  },
  playsound: {
    name: 'playsound',
    params: { min: 1, max: 1, description: 'Sound file name (without .ogg)' },
    description: 'Play sound file (alias)',
    category: 'sound',
  },

  // Wait Events
  wait: {
    name: 'wait',
    params: { min: 1, max: 1, description: 'Seconds to wait (game time)' },
    description: 'Wait game seconds (scales with speed)',
    category: 'flow',
  },
  truewait: {
    name: 'truewait',
    params: { min: 1, max: 1, description: 'Seconds to wait (real time)' },
    description: 'Wait real seconds (ignores speed)',
    category: 'flow',
  },

  // Object Management
  heal: {
    name: 'heal',
    params: {
      min: 2,
      max: 2,
      format: 'ObjectVariable,amount',
      description: 'Object variable, heal amount',
    },
    description: 'Heal unit (not creatures)',
    category: 'entity',
  },
  kill: {
    name: 'kill',
    params: { min: 1, max: 1, description: 'Object variable' },
    description: 'Remove unit (teleport up)',
    category: 'entity',
  },
  flee: {
    name: 'flee',
    params: {
      min: 3,
      max: 3,
      format: 'CreatureVar,row,col',
      description: 'Creature variable, row, col',
    },
    description: 'Make creature flee',
    category: 'entity',
  },

  // Enable/Disable
  disable: {
    name: 'disable',
    params: {
      min: 1,
      max: 1,
      description: 'Feature to disable (miners/vehicles/buildings/lights/etc)',
    },
    description: 'Disable player abilities',
    category: 'flow',
  },
  enable: {
    name: 'enable',
    params: { min: 1, max: 1, description: 'Feature to enable' },
    description: 'Re-enable abilities',
    category: 'flow',
  },

  // Timer Control
  starttimer: {
    name: 'starttimer',
    params: { min: 1, max: 1, description: 'Timer variable name' },
    description: 'Start a timer',
    category: 'timer',
  },
  stoptimer: {
    name: 'stoptimer',
    params: { min: 1, max: 1, description: 'Timer variable name' },
    description: 'Stop a timer',
    category: 'timer',
  },

  // Random Spawning
  addrandomspawn: {
    name: 'addrandomspawn',
    params: {
      min: 3,
      max: 3,
      format: 'CreatureType,minTime,maxTime',
      description: 'Creature type, min time, max time',
    },
    description: 'Configure random spawns',
    category: 'entity',
  },
  spawncap: {
    name: 'spawncap',
    params: {
      min: 3,
      max: 3,
      format: 'CreatureType,min,max',
      description: 'Creature type, min active, max active',
    },
    description: 'Set spawn limits',
    category: 'entity',
  },
  spawnwave: {
    name: 'spawnwave',
    params: {
      min: 3,
      max: 3,
      format: 'CreatureType,min,max',
      description: 'Creature type, min per wave, max per wave',
    },
    description: 'Set wave size',
    category: 'entity',
  },
  startrandomspawn: {
    name: 'startrandomspawn',
    params: { min: 1, max: 1, description: 'Creature type' },
    description: 'Begin spawning',
    category: 'entity',
  },
  stoprandomspawn: {
    name: 'stoprandomspawn',
    params: { min: 1, max: 1, description: 'Creature type' },
    description: 'Stop spawning',
    category: 'entity',
  },

  // Save Last Events
  lastminer: {
    name: 'lastminer',
    params: { min: 1, max: 1, description: 'Miner variable name' },
    description: 'Save triggering miner',
    category: 'save',
  },
  save: {
    name: 'save',
    params: { min: 1, max: 1, description: 'Miner variable name' },
    description: 'Save triggering miner (alias)',
    category: 'save',
  },
  lastvehicle: {
    name: 'lastvehicle',
    params: { min: 1, max: 1, description: 'Vehicle variable name' },
    description: 'Save triggering vehicle',
    category: 'save',
  },
  savevehicle: {
    name: 'savevehicle',
    params: { min: 1, max: 1, description: 'Vehicle variable name' },
    description: 'Save triggering vehicle (alias)',
    category: 'save',
  },
  lastbuilding: {
    name: 'lastbuilding',
    params: { min: 1, max: 1, description: 'Building variable name' },
    description: 'Save triggering building',
    category: 'save',
  },
  savebuilding: {
    name: 'savebuilding',
    params: { min: 1, max: 1, description: 'Building variable name' },
    description: 'Save triggering building (alias)',
    category: 'save',
  },
  lastcreature: {
    name: 'lastcreature',
    params: { min: 1, max: 1, description: 'Creature variable name' },
    description: 'Save triggering creature',
    category: 'save',
  },
  savecreature: {
    name: 'savecreature',
    params: { min: 1, max: 1, description: 'Creature variable name' },
    description: 'Save triggering creature (alias)',
    category: 'save',
  },

  // Unknown/Reserved
  landslide: {
    name: 'landslide',
    params: { min: 0, description: 'Unknown syntax' },
    description: 'Reserved word - syntax unknown',
    category: 'map',
  },
};

// Script macros that can be used in conditions
export const SCRIPT_MACROS = {
  // Time
  time: { type: 'number', description: 'Game time in seconds' },

  // Resources
  crystals: { type: 'number', description: 'Current energy crystal count' },
  ore: { type: 'number', description: 'Current ore count' },
  studs: { type: 'number', description: 'Current building stud count' },
  air: { type: 'number', description: 'Current oxygen level' },

  // Units
  miners: { type: 'number', description: 'Total Rock Raiders count' },
  vehicles: { type: 'number', description: 'Total vehicles count' },
  buildings: {
    type: 'object',
    description: 'Building counts by type (e.g., buildings.BuildingToolStore_C)',
  },
  creatures: {
    type: 'object',
    description: 'Creature counts by type (e.g., creatures.CreatureRockMonster_C)',
  },

  // Building types for buildings.X
  'buildings.BuildingToolStore_C': { type: 'number', description: 'Tool Store count' },
  'buildings.BuildingPowerStation_C': { type: 'number', description: 'Power Station count' },
  'buildings.BuildingBarracks_C': { type: 'number', description: 'Support Station count' },
  'buildings.BuildingUpgradeStation_C': { type: 'number', description: 'Upgrade Station count' },
  'buildings.BuildingGeoSurvey_C': { type: 'number', description: 'Geological Center count' },
  'buildings.BuildingOreRefinery_C': { type: 'number', description: 'Ore Refinery count' },
  'buildings.BuildingDocks_C': { type: 'number', description: 'Docks count' },
  'buildings.BuildingCanteen_C': { type: 'number', description: 'Mining Laser count' },
  'buildings.BuildingMiningLaser_C': { type: 'number', description: 'Mining Laser count' },
  'buildings.BuildingSuperTeleport_C': { type: 'number', description: 'Super Teleport count' },

  // Creature types for creatures.X
  'creatures.CreatureSmallSpider_C': { type: 'number', description: 'Small Spider count' },
  'creatures.CreatureRockMonster_C': { type: 'number', description: 'Rock Monster count' },
  'creatures.CreatureLavaMonster_C': { type: 'number', description: 'Lava Monster count' },
  'creatures.CreatureIceMonster_C': { type: 'number', description: 'Ice Monster count' },
  'creatures.CreatureSlimySlug_C': { type: 'number', description: 'Slimy Slug count' },

  // Vehicle types for vehicles.X
  'vehicles.VehicleHoverScout_C': { type: 'number', description: 'Hover Scout count' },
  'vehicles.VehicleSmallDigger_C': { type: 'number', description: 'Small Digger count' },
  'vehicles.VehicleSmallTransporter_C': {
    type: 'number',
    description: 'Small Transport Truck count',
  },
  'vehicles.VehicleRapidRider_C': { type: 'number', description: 'Rapid Rider count' },
  'vehicles.VehicleTunnelScout_C': { type: 'number', description: 'Tunnel Scout count' },
  'vehicles.VehicleLoaderDozer_C': { type: 'number', description: 'Loader Dozer count' },
  'vehicles.VehicleGraniteGrinder_C': { type: 'number', description: 'Granite Grinder count' },
  'vehicles.VehicleLargeMobileUnit_C': { type: 'number', description: 'Chrome Crusher count' },
  'vehicles.VehicleTunnelTransport_C': { type: 'number', description: 'Cargo Carrier count' },

  // Pilot
  pilot: { type: 'object', description: 'Pilot macros' },
  'pilot.death': { type: 'trigger', description: 'Trigger when Rock Raider dies' },

  // Timers
  'TimerName.remaining': { type: 'number', description: 'Seconds remaining on timer' },
  'TimerName.expired': { type: 'boolean', description: 'True if timer has expired' },
};

// Trigger types for when() conditions
export const TRIGGER_TYPES = {
  // Basic triggers
  init: 'Triggers once at map start',
  time: 'Triggers when time reaches value',
  drill: 'Triggers when tile is drilled',
  walk: 'Triggers when unit walks on tile',
  drive: 'Triggers when vehicle drives on tile',
  change: 'Triggers when tile changes',
  laser: 'Triggers when laser hits tile',
  laserhit: 'Triggers when laser hits specific tile type',
  dynamite: 'Triggers when dynamite explodes at tile',
  sonicblaster: 'Triggers when sonic blaster used at tile',
  enter: 'Triggers when unit enters tile',
  exit: 'Triggers when unit exits tile',

  // Discovery
  discovertile: 'Triggers when tile is discovered',
  discoverall: 'Triggers when all tiles discovered',

  // Units
  'pilot.death': 'Triggers when Rock Raider dies',
  reinforce: 'Triggers when tile is reinforced',

  // Resources
  collect: 'Triggers when resource collected',
};

// Valid variable types
export const VARIABLE_TYPES = ['int', 'float', 'bool', 'string', 'arrow', 'timer'] as const;

// Creature types
export const CREATURE_TYPES = [
  'CreatureSmallSpider_C',
  'CreatureRockMonster_C',
  'CreatureLavaMonster_C',
  'CreatureIceMonster_C',
  'CreatureSlimySlug_C',
  'CreatureBat_C',
] as const;

// Building types
export const BUILDING_TYPES = [
  'BuildingToolStore_C',
  'BuildingPowerStation_C',
  'BuildingBarracks_C',
  'BuildingUpgradeStation_C',
  'BuildingGeoSurvey_C',
  'BuildingOreRefinery_C',
  'BuildingDocks_C',
  'BuildingCanteen_C',
  'BuildingMiningLaser_C',
  'BuildingSuperTeleport_C',
] as const;

// Vehicle types
export const VEHICLE_TYPES = [
  'VehicleHoverScout_C',
  'VehicleSmallDigger_C',
  'VehicleSmallTransporter_C',
  'VehicleRapidRider_C',
  'VehicleTunnelScout_C',
  'VehicleLoaderDozer_C',
  'VehicleGraniteGrinder_C',
  'VehicleLargeMobileUnit_C',
  'VehicleTunnelTransport_C',
] as const;
