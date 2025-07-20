import { DatFileParser } from '../parser/datFileParser';
import { DatFileValidator } from '../validation/datFileValidator';

describe('DatFileParser', () => {
  const sampleFile = `comments{
Test level for parser
}
info{
rowcount:5
colcount:5
levelname:Test Level
biome:rock
creator:Test Author
initialcrystals:10
}
tiles{
38,38,38,38,38,
38,1,1,1,38,
38,1,42,1,38,
38,1,1,1,38,
38,38,38,38,38,
}
height{
0,0,0,0,0,
0,100,100,100,0,
0,100,100,100,0,
0,100,100,100,0,
0,0,0,0,0,
}
resources{
crystals:
0,0,0,0,0,
0,0,0,0,0,
0,0,1,0,0,
0,0,0,0,0,
0,0,0,0,0,
ore:
0,0,0,0,0,
0,0,0,0,0,
0,0,2,0,0,
0,0,0,0,0,
0,0,0,0,0,
}
objectives{
resources: 5,0,0
}
buildings{
BuildingToolStore_C,Translation: X=300.000 Y=300.000 Z=0.000 Rotation: P=0.000000 Y=0.000000 R=0.000000 Scale X=1.000 Y=1.000 Z=1.000
}
script{
init::;
string WelcomeMsg="Welcome to the test level!"
StartEvent::;
msg:WelcomeMsg;
}`;

  describe('parse', () => {
    it('should parse a complete DAT file', () => {
      const parser = new DatFileParser(sampleFile);
      const result = parser.parse();

      expect(result.info).toBeDefined();
      expect(result.info.rowcount).toBe(5);
      expect(result.info.colcount).toBe(5);
      expect(result.info.levelname).toBe('Test Level');
      expect(result.info.biome).toBe('rock');
      expect(result.info.creator).toBe('Test Author');
      expect(result.info.initialcrystals).toBe(10);
    });

    it('should parse tiles section correctly', () => {
      const parser = new DatFileParser(sampleFile);
      const result = parser.parse();

      expect(result.tiles).toHaveLength(5);
      expect(result.tiles[0]).toEqual([38, 38, 38, 38, 38]);
      expect(result.tiles[2][2]).toBe(42); // Crystal seam in center
    });

    it('should parse height section correctly', () => {
      const parser = new DatFileParser(sampleFile);
      const result = parser.parse();

      expect(result.height).toHaveLength(5);
      expect(result.height[1][1]).toBe(100);
      expect(result.height[0][0]).toBe(0);
    });

    it('should parse resources section correctly', () => {
      const parser = new DatFileParser(sampleFile);
      const result = parser.parse();

      expect(result.resources).toBeDefined();
      expect(result.resources!.crystals).toHaveLength(5);
      expect(result.resources!.crystals![2][2]).toBe(1);
      expect(result.resources!.ore![2][2]).toBe(2);
    });

    it('should parse objectives correctly', () => {
      const parser = new DatFileParser(sampleFile);
      const result = parser.parse();

      expect(result.objectives).toHaveLength(1);
      expect(result.objectives![0].type).toBe('resources');
      expect((result.objectives![0] as any).crystals).toBe(5);
    });

    it('should parse buildings correctly', () => {
      const parser = new DatFileParser(sampleFile);
      const result = parser.parse();

      expect(result.buildings).toHaveLength(1);
      expect(result.buildings![0].type).toBe('BuildingToolStore_C');
      expect(result.buildings![0].coordinates.translation.x).toBe(300);
      expect(result.buildings![0].coordinates.translation.y).toBe(300);
    });

    it('should parse script section correctly', () => {
      const parser = new DatFileParser(sampleFile);
      const result = parser.parse();

      expect(result.script).toBeDefined();
      expect(result.script!.variables.get('WelcomeMsg')).toBe('Welcome to the test level!');
      expect(result.script!.events).toHaveLength(2);
      expect(result.script!.events[1].name).toBe('StartEvent');
      expect(result.script!.events[1].commands[0].command).toBe('msg');
    });
  });

  describe('getSectionAtPosition', () => {
    it('should find the correct section for a given line', () => {
      const parser = new DatFileParser(sampleFile);
      const lines = sampleFile.split('\n');

      // Find line number for tiles section
      const tilesLine = lines.findIndex(line => line.includes('tiles{'));
      const section = parser.getSectionAtPosition(tilesLine + 2);

      expect(section).toBeDefined();
      expect(section!.name).toBe('tiles');
    });
  });
});

describe('DatFileValidator', () => {
  it('should validate a correct DAT file', () => {
    const parser = new DatFileParser(`info{
rowcount:5
colcount:5
}
tiles{
38,38,38,38,38,
38,1,1,1,38,
38,1,1,1,38,
38,1,1,1,38,
38,38,38,38,38,
}
height{
0,0,0,0,0,
0,100,100,100,0,
0,100,100,100,0,
0,100,100,100,0,
0,0,0,0,0,
}
buildings{
BuildingToolStore_C,Translation: X=300.000 Y=300.000 Z=0.000 Rotation: P=0.000000 Y=0.000000 R=0.000000 Scale X=1.000 Y=1.000 Z=1.000
}`);
    const datFile = parser.parse();
    const validator = new DatFileValidator();
    const errors = validator.validate(datFile);

    const actualErrors = errors.filter(e => e.severity === 'error');
    expect(actualErrors).toHaveLength(0);
  });

  it('should detect missing Tool Store', () => {
    const parser = new DatFileParser(`info{
rowcount:5
colcount:5
}
tiles{
38,38,38,38,38,
38,1,1,1,38,
38,1,1,1,38,
38,1,1,1,38,
38,38,38,38,38,
}
height{
0,0,0,0,0,
0,100,100,100,0,
0,100,100,100,0,
0,100,100,100,0,
0,0,0,0,0,
}
buildings{
}`);
    const datFile = parser.parse();
    const validator = new DatFileValidator();
    const errors = validator.validate(datFile);

    const toolStoreError = errors.find(e => e.message.includes('Tool Store'));
    expect(toolStoreError).toBeDefined();
  });

  it('should detect dimension mismatches', () => {
    const parser = new DatFileParser(`info{
rowcount:3
colcount:3
}
tiles{
38,38,38,
38,1,1,
38,1,1,1,38,
}
height{
0,0,0,
0,100,100,
0,100,100,
}
buildings{
BuildingToolStore_C,Translation: X=150.000 Y=150.000 Z=0.000 Rotation: P=0.000000 Y=0.000000 R=0.000000 Scale X=1.000 Y=1.000 Z=1.000
}`);
    const datFile = parser.parse();
    const validator = new DatFileValidator();
    const errors = validator.validate(datFile);

    const dimensionError = errors.find(e => e.message.includes('columns'));
    expect(dimensionError).toBeDefined();
  });
});
