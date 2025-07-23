/**
 * Factory functions for creating test data
 */

export class TestDataFactory {
  /**
   * Creates a valid Manic Miners map file content
   */
  static createMapContent(
    options: {
      name?: string;
      size?: { width: number; height: number };
      includeBuildings?: boolean;
      includeResources?: boolean;
      includeScripts?: boolean;
      includeObjectives?: boolean;
    } = {}
  ): string {
    const {
      name = 'Test Map',
      size = { width: 40, height: 40 },
      includeBuildings = true,
      includeResources = true,
      includeScripts = false,
      includeObjectives = false,
    } = options;

    let content = `info{
  Name="${name}"
  Author="Test Author"
  Version="1.0"
  Briefing="Test map for unit testing"
}

map{
  size=${size.width}x${size.height}
  biome=rock
  erosion=3
}

tiles{
  // Sample tile data
  0,0=solid_rock,5
  1,0=dirt,3
  2,0=loose_rock,2
  3,0=hard_rock,7
  4,0=lava,0
}`;

    if (includeBuildings) {
      content += `

buildings{
  10,10=toolstore
  20,20=teleport
  15,15=powerpath
  25,25=docks
}`;
    }

    if (includeResources) {
      content += `

resources{
  crystals{
    5,5=10
    15,15=5
    25,25=15
  }
  ore{
    8,8=20
    18,18=30
  }
  studs{
    12,12=100
  }
}`;
    }

    if (includeScripts) {
      content += `

script{
  // Test script
  onStart{
    showMessage("Welcome to the test map!")
    wait(2)
  }
  
  onCrystalCollected{
    if(crystals >= 10) {
      showMessage("Good job collecting crystals!")
    }
  }
}`;
    }

    if (includeObjectives) {
      content += `

objectives{
  primary{
    collect_crystals=25
    find_miners=5
  }
  secondary{
    build_powerstation=true
    time_limit=600
  }
}`;
    }

    return content;
  }

  /**
   * Creates tile data for specific patterns
   */
  static createTilePattern(
    pattern: 'checkerboard' | 'gradient' | 'random',
    size: number = 10
  ): string {
    const tiles: string[] = [];

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let tileType: string;
        let height: number;

        switch (pattern) {
          case 'checkerboard':
            tileType = (x + y) % 2 === 0 ? 'solid_rock' : 'dirt';
            height = 5;
            break;
          case 'gradient':
            tileType = 'solid_rock';
            height = Math.floor((x + y) / 2);
            break;
          case 'random':
            const types = ['solid_rock', 'dirt', 'loose_rock', 'hard_rock'];
            tileType = types[Math.floor(Math.random() * types.length)];
            height = Math.floor(Math.random() * 10);
            break;
        }

        tiles.push(`  ${x},${y}=${tileType},${height}`);
      }
    }

    return `tiles{\n${tiles.join('\n')}\n}`;
  }

  /**
   * Creates a script block with various triggers
   */
  static createScript(
    options: {
      triggers?: string[];
      commands?: string[];
    } = {}
  ): string {
    const { triggers = ['onStart', 'onComplete'], commands = ['showMessage("Test")', 'wait(1)'] } =
      options;

    const scriptBlocks = triggers.map(
      trigger => `  ${trigger}{\n    ${commands.join('\n    ')}\n  }`
    );

    return `script{\n${scriptBlocks.join('\n\n')}\n}`;
  }

  /**
   * Creates building placement data
   */
  static createBuildingLayout(
    buildings: Array<{
      x: number;
      y: number;
      type: string;
    }>
  ): string {
    const buildingLines = buildings.map(b => `  ${b.x},${b.y}=${b.type}`);
    return `buildings{\n${buildingLines.join('\n')}\n}`;
  }

  /**
   * Creates resource distribution
   */
  static createResourceDistribution(resources: {
    crystals?: Array<{ x: number; y: number; amount: number }>;
    ore?: Array<{ x: number; y: number; amount: number }>;
    studs?: Array<{ x: number; y: number; amount: number }>;
  }): string {
    const sections: string[] = [];

    if (resources.crystals) {
      const crystalLines = resources.crystals.map(r => `    ${r.x},${r.y}=${r.amount}`);
      sections.push(`  crystals{\n${crystalLines.join('\n')}\n  }`);
    }

    if (resources.ore) {
      const oreLines = resources.ore.map(r => `    ${r.x},${r.y}=${r.amount}`);
      sections.push(`  ore{\n${oreLines.join('\n')}\n  }`);
    }

    if (resources.studs) {
      const studLines = resources.studs.map(r => `    ${r.x},${r.y}=${r.amount}`);
      sections.push(`  studs{\n${studLines.join('\n')}\n  }`);
    }

    return `resources{\n${sections.join('\n\n')}\n}`;
  }

  /**
   * Creates objectives configuration
   */
  static createObjectives(objectives: {
    primary?: Record<string, any>;
    secondary?: Record<string, any>;
    bonus?: Record<string, any>;
  }): string {
    const sections: string[] = [];

    if (objectives.primary) {
      const primaryLines = Object.entries(objectives.primary).map(
        ([key, value]) => `    ${key}=${value}`
      );
      sections.push(`  primary{\n${primaryLines.join('\n')}\n  }`);
    }

    if (objectives.secondary) {
      const secondaryLines = Object.entries(objectives.secondary).map(
        ([key, value]) => `    ${key}=${value}`
      );
      sections.push(`  secondary{\n${secondaryLines.join('\n')}\n  }`);
    }

    if (objectives.bonus) {
      const bonusLines = Object.entries(objectives.bonus).map(
        ([key, value]) => `    ${key}=${value}`
      );
      sections.push(`  bonus{\n${bonusLines.join('\n')}\n  }`);
    }

    return `objectives{\n${sections.join('\n\n')}\n}`;
  }

  /**
   * Creates an invalid map content for error testing
   */
  static createInvalidMapContent(
    errorType: 'syntax' | 'missing-section' | 'invalid-value' | 'unclosed-block'
  ): string {
    switch (errorType) {
      case 'syntax':
        return `info{
  Name="Test Map"
  Author="Test Author"
  Version=1.0  // Should be string
}

map{
  size=40x40
  biome=invalid_biome  // Invalid biome type
}`;

      case 'missing-section':
        return `info{
  Name="Test Map"
  Author="Test Author"
  Version="1.0"
}

// Missing required map section

tiles{
  0,0=solid_rock,5
}`;

      case 'invalid-value':
        return `info{
  Name="Test Map"
  Author="Test Author"
  Version="1.0"
}

map{
  size=-10x-10  // Negative values
  biome=rock
}

tiles{
  0,0=solid_rock,999  // Height too large
}`;

      case 'unclosed-block':
        return `info{
  Name="Test Map"
  Author="Test Author"
  Version="1.0"

map{
  size=40x40
  biome=rock
}

tiles{
  0,0=solid_rock,5
  // Missing closing brace`;
    }
  }

  /**
   * Creates a complex map with all features
   */
  static createComplexMap(): string {
    return `info{
  Name="Complex Test Map"
  Author="Test Suite"
  Version="2.0"
  Briefing="A complex map with all features for testing"
  Description="This map includes buildings, resources, scripts, and objectives"
}

map{
  size=50x50
  biome=ice
  erosion=5
  water_level=2
  ambient_light=0.8
}

properties{
  slug_count=10
  spider_count=5
  monster_spawn_rate=0.5
  oxygen_rate=100
  initial_oxygen=1000
}

${this.createTilePattern('gradient', 10)}

buildings{
  // Main base
  25,25=toolstore
  26,25=teleport
  27,25=powerstation
  25,26=supportstation
  26,26=upgradestation
  27,26=geologicalcenter
  
  // Mining outposts
  10,10=mininglazer
  40,40=mininglazer
  10,40=mininglazer
  40,10=mininglazer
  
  // Power network
  ${Array.from({ length: 10 }, (_, i) => `  ${20 + i},20=powerpath`).join('\n')}
  ${Array.from({ length: 10 }, (_, i) => `  ${20 + i},30=powerpath`).join('\n')}
}

${this.createResourceDistribution({
  crystals: [
    { x: 5, y: 5, amount: 10 },
    { x: 45, y: 5, amount: 15 },
    { x: 5, y: 45, amount: 20 },
    { x: 45, y: 45, amount: 25 },
  ],
  ore: [
    { x: 15, y: 15, amount: 50 },
    { x: 35, y: 15, amount: 50 },
    { x: 15, y: 35, amount: 50 },
    { x: 35, y: 35, amount: 50 },
  ],
  studs: [
    { x: 25, y: 10, amount: 200 },
    { x: 25, y: 40, amount: 200 },
  ],
})}

vehicles{
  25,24=smalldigger
  26,24=largemobilelazer
  27,24=smalltransport
}

miners{
  24,25=5
  28,25=5
}

landslides{
  15,20=5,north
  35,20=5,south
  20,15=5,east
  30,35=5,west
}

erosion{
  10,10=8
  40,10=8
  10,40=8
  40,40=8
}

script{
  variables{
    totalCrystals=0
    timeElapsed=0
    baseBuilt=false
  }
  
  onStart{
    showMessage("Welcome to the Complex Test Map!")
    wait(2)
    showMessage("Build your base and collect resources")
    setTimer("mainTimer", 3600)
  }
  
  onBuildingComplete{
    if(building == "powerstation" && !baseBuilt) {
      set(baseBuilt, true)
      showMessage("Power Station built! Your base is operational")
      playSound("success")
    }
  }
  
  onCrystalCollected{
    add(totalCrystals, 1)
    if(totalCrystals == 10) {
      showMessage("10 crystals collected!")
    }
    if(totalCrystals == 25) {
      showMessage("25 crystals collected! Objective complete!")
      completeObjective("collect_crystals")
    }
  }
  
  onTimerExpired{
    if(timer == "mainTimer") {
      showMessage("Time's up!")
      endMission(false)
    }
  }
  
  onMinerTeleported{
    if(minerCount >= 10) {
      showMessage("10 miners rescued!")
      completeObjective("rescue_miners")
    }
  }
}

objectives{
  primary{
    collect_crystals=25
    rescue_miners=10
    build_powerstation=true
  }
  secondary{
    collect_ore=100
    build_all_buildings=true
    time_limit=3600
  }
  bonus{
    no_miner_losses=true
    collect_all_studs=true
    complete_under_time=1800
  }
}

camera{
  start_position=25,25
  start_zoom=1.0
  bounds=0,0,50,50
}`;
  }
}
