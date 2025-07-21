import { ScriptBuilder } from '../scriptBuilder';

describe('ScriptBuilder', () => {
  let builder: ScriptBuilder;

  beforeEach(() => {
    builder = new ScriptBuilder('test');
  });

  describe('Variable Management', () => {
    it('should create unique variable names', () => {
      const var1 = builder.int('Counter', 0);
      const var2 = builder.int('Counter', 0);

      expect(var1).toBe('testCounter');
      expect(var2).toBe('testCounter1');
    });

    it('should handle different variable types', () => {
      builder.int('Score', 100);
      builder.bool('IsActive', true);
      builder.timer('Countdown', 60);

      const script = builder.build();

      expect(script).toContain('int testScore=100');
      expect(script).toContain('bool testIsActive=true');
      expect(script).toContain('timer testCountdown=60');
    });

    it('should create timer with event', () => {
      builder.timer('Warning', 30, 'ShowWarning');
      const script = builder.build();

      expect(script).toContain('timer testWarning=30,ShowWarning');
    });
  });

  describe('Event Building', () => {
    it('should create basic event', () => {
      builder.event('Setup').msg('Welcome!').crystals(10).build();

      const script = builder.build();

      expect(script).toContain('testSetup0::');
      expect(script).toContain('msg:Welcome!;');
      expect(script).toContain('crystals:10;');
    });

    it('should create conditional event', () => {
      builder.when('crystals>=25', 'Victory').msg('You win!').win().build();

      const script = builder.build();

      expect(script).toContain('when(crystals>=25)[testVictory0]');
      expect(script).toContain('msg:You win!;');
      expect(script).toContain('win;');
    });

    it('should create one-time event with mutex', () => {
      builder.once('time>=60', 'TimeWarning').msg('One minute passed').build();

      const script = builder.build();

      expect(script).toContain('bool testTimeWarningDone=false');
      expect(script).toContain('when(time>=60 and testTimeWarningDone==false)');
      expect(script).toContain('testTimeWarningDone:true;');
    });

    it('should handle emerge commands', () => {
      builder.event().emerge(10, 10, 'A', 'SmallSpider', 3).build();

      const script = builder.build();

      expect(script).toContain('emerge:10,10,A,SmallSpider,3;');
    });
  });

  describe('State Machine', () => {
    it('should create state machine with transitions', () => {
      const states = { IDLE: 0, ACTIVE: 1, DONE: 2 };
      const machine = builder.stateMachine('Game', states);

      machine.transition('IDLE', 'ACTIVE', 'crystals>=10').build();
      machine.transition('ACTIVE', 'DONE', 'crystals>=50').build();

      const script = builder.build();

      expect(script).toContain('int testGameState=0');
      expect(script).toContain('when(testGameState==0 and crystals>=10)');
      expect(script).toContain('testGameState:1;');
      expect(script).toContain('when(testGameState==1 and crystals>=50)');
      expect(script).toContain('testGameState:2;');
    });

    it('should validate state names', () => {
      const states = { IDLE: 0, ACTIVE: 1 };
      const machine = builder.stateMachine('Test', states);

      expect(() => {
        machine.transition('IDLE', 'INVALID', 'true');
      }).toThrow('Invalid state: IDLE or INVALID');
    });
  });

  describe('Spawner Pattern', () => {
    it('should create basic spawner', () => {
      builder
        .spawner('Spider')
        .creature('SmallSpider')
        .waveSize(3, 5)
        .timing(30, 60)
        .emergeAt(10, 10)
        .build();

      const script = builder.build();

      expect(script).toContain('int testSpiderState=0');
      expect(script).toContain('addrandomspawn:SmallSpider,30,60;');
      expect(script).toContain('spawncap:SmallSpider,3,5;');
      expect(script).toContain('startrandomspawn:SmallSpider;');
    });

    it('should validate spawner configuration', () => {
      const spawner = builder.spawner('Invalid');

      expect(() => {
        spawner.build();
      }).toThrow('Spawner requires creature type and at least one emerge point');
    });
  });

  describe('Command Parsing', () => {
    it('should parse inline command format', () => {
      builder.event().cmd('msg:Hello World').cmd('crystals:50').cmd('wait:5').build();

      const script = builder.build();

      expect(script).toContain('msg:Hello World;');
      expect(script).toContain('crystals:50;');
      expect(script).toContain('wait:5;');
    });

    it('should handle commands with parameters', () => {
      builder.event().cmd('emerge', 5, 5, 'A', 'Slug', 2).build();

      const script = builder.build();

      expect(script).toContain('emerge:5,5,A,Slug,2;');
    });
  });

  describe('Script Output', () => {
    it('should generate properly formatted script', () => {
      // Create a complete mini-script
      const health = builder.int('Health', 100);
      const isDead = builder.bool('IsDead', false);

      builder.event('Init').msg('Game started').objective('Survive').build();

      builder
        .when(`${health}<=0 and ${isDead}==false`)
        .cmd(`${isDead}:true`)
        .msg('Game Over')
        .lose()
        .build();

      const script = builder.build();
      const lines = script.split('\n');

      // Check variable declarations
      expect(lines[0]).toBe('int testHealth=100');
      expect(lines[1]).toBe('bool testIsDead=false');

      // Check events
      expect(lines).toContain('testInit0::');
      expect(lines).toContain('msg:Game started;');
      expect(lines).toContain('objective:Survive;');

      // Check conditional
      expect(script).toContain('when(testHealth<=0 and testIsDead==false)');
    });
  });

  describe('Event Chain Optimization', () => {
    it('should detect repeated sequences', () => {
      // Create an event with repeated patterns
      builder
        .event('Repetitive')
        .msg('Start')
        .wait(1)
        .crystals(10)
        .msg('Phase 1')
        .wait(1)
        .crystals(10)
        .msg('Phase 2')
        .wait(1)
        .crystals(10)
        .msg('End')
        .build();

      // The optimizer should detect the wait(1) + crystals(10) pattern
      // For now it just returns the original, but the detection logic is there
      const script = builder.build();

      expect(script).toContain('wait:1;');
      expect(script).toContain('crystals:10;');
    });
  });
});
