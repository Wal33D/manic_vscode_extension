/**
 * Examples demonstrating the Script Builder API
 */

import { ScriptBuilder } from '../scriptBuilder';

/**
 * Example 1: Basic level with objectives and crystals
 */
export function createBasicLevel(): string {
  const sb = new ScriptBuilder('basic');

  // Variables - These would be used in a full implementation
  // const crystalsCollected = sb.int('CrystalsCollected', 0);
  // const hasShownWarning = sb.bool('HasShownWarning', false);

  // Initial setup
  sb.event('Init')
    .msg('Collect 25 Energy Crystals!')
    .objective('Collect 25 Energy Crystals')
    .build();

  // Crystal collection tracking
  sb.when('crystals>=25').msg('Well done! You collected enough crystals!').wait(2).win().build();

  // Warning at 15 crystals
  sb.once('crystals>=15').msg('Good progress! 10 more crystals to go!').build();

  // Air supply warning
  sb.once('air<50 and air>0').msg('Warning: Air supply running low!').build();

  return sb.build();
}

/**
 * Example 2: Wave spawner with state machine
 */
export function createWaveSpawner(): string {
  const sb = new ScriptBuilder('wave');

  // Create spawner for Rock Raiders
  sb.spawner('RockRaiderWaves')
    .creature('SmallDigger')
    .waveSize(3, 5)
    .timing(30, 60)
    .emergeAt(10, 10, 'A')
    .emergeAt(20, 20, 'B')
    .cooldown(120)
    .armWhen('crystals>=10')
    .build();

  // Create spawner for Slugs
  sb.spawner('SlugWaves')
    .creature('Slug')
    .waveSize(5, 8)
    .timing(45, 90)
    .emergeAt(15, 15, 'C')
    .cooldown(180)
    .armWhen('time>=300')
    .build();

  return sb.build();
}

/**
 * Example 3: Complex state machine for boss fight
 */
export function createBossFight(): string {
  const sb = new ScriptBuilder('boss');

  // Boss states
  const states = {
    WAITING: 0,
    PHASE1: 1,
    PHASE2: 2,
    PHASE3: 3,
    DEFEATED: 4,
  };

  const boss = sb.stateMachine('Boss', states);
  const bossHealth = sb.int('BossHealth', 100);
  // const phaseTimer = sb.timer('PhaseTimer', 0); // Would be used for timer events

  // Initial message
  sb.event('Init').msg('Prepare for the boss battle!').objective('Defeat the Rock Monster').build();

  // Start boss fight when player enters arena
  boss
    .transition('WAITING', 'PHASE1', 'miners>0 and row[10]>0 and column[10]>0')
    .msg('The Rock Monster awakens!')
    .cmd('shake', 3)
    .emerge(10, 10, 'boss', 'RockMonster', 5)
    .build();

  // Phase 1: Basic attacks
  sb.when(`${boss.inState('PHASE1')} and time%30==0`)
    .emerge(8, 8, 'A', 'SmallSpider', 2)
    .emerge(12, 12, 'B', 'SmallSpider', 2)
    .build();

  // Transition to Phase 2
  boss
    .transition('PHASE1', 'PHASE2', `${bossHealth}<=66`)
    .msg('The Rock Monster is getting angry!')
    .cmd('shake', 5)
    .build();

  // Phase 2: More aggressive
  sb.when(`${boss.inState('PHASE2')} and time%20==0`)
    .emerge(5, 5, 'A', 'LavaMonster', 3)
    .emerge(15, 15, 'B', 'IceMonster', 3)
    .build();

  // Transition to Phase 3
  boss
    .transition('PHASE2', 'PHASE3', `${bossHealth}<=33`)
    .msg('The Rock Monster enters its final form!')
    .cmd('shake', 8)
    .cmd('camera', 10, 10, 5)
    .wait(2)
    .cmd('camera', 'reset')
    .build();

  // Phase 3: Final assault
  sb.when(`${boss.inState('PHASE3')} and time%15==0`)
    .cmd('rockfall', 10, 10, 5)
    .emerge(7, 7, 'A', 'LavaMonster', 4)
    .emerge(13, 13, 'B', 'IceMonster', 4)
    .build();

  // Victory condition
  boss
    .transition('PHASE3', 'DEFEATED', `${bossHealth}<=0`)
    .msg('Victory! The Rock Monster has been defeated!')
    .crystals(100)
    .wait(3)
    .win()
    .build();

  return sb.build();
}

/**
 * Example 4: Resource management puzzle
 */
export function createResourcePuzzle(): string {
  const sb = new ScriptBuilder('puzzle');

  // Resource tracking
  // const oreDeposited = sb.int('OreDeposited', 0); // Would track ore deposits
  const generatorActive = sb.bool('GeneratorActive', false);
  const doorOpen = sb.bool('DoorOpen', false);

  // Objectives
  sb.event('Init')
    .msg('Power the generator to open the door!')
    .objective('Deposit 50 Ore to power the generator')
    .build();

  // Ore deposit tracking
  sb.when(`ore>=50 and ${generatorActive}==false`)
    .cmd(`${generatorActive}:true`)
    .msg('Generator powered! The door is opening...')
    .cmd('drill', 25, 10) // Open door tiles
    .cmd('drill', 25, 11)
    .cmd('drill', 25, 12)
    .cmd(`${doorOpen}:true`)
    .objective('Proceed through the opened door')
    .build();

  // Win condition
  sb.when(`${doorOpen}==true and row[30]>0`).msg('Well done! You solved the puzzle!').win().build();

  // Hint system
  sb.once('time>=300').msg('Hint: Look for Ore Seams in the walls').build();

  sb.once('time>=600').msg('Hint: The generator is near the locked door').build();

  return sb.build();
}

/**
 * Example 5: Conditional event chains
 */
export function createConditionalChains(): string {
  const sb = new ScriptBuilder('cond');

  // Player choice tracking
  const choice = sb.int('PlayerChoice', 0);
  const pathATaken = sb.bool('PathATaken', false);
  const pathBTaken = sb.bool('PathBTaken', false);

  // Initial choice
  sb.once('miners>=1')
    .msg('Choose your path: Left (drill west) or Right (drill east)')
    .objective('Choose a path by drilling in a direction')
    .build();

  // Path A (Left)
  sb.once('column[5]>0')
    .cmd(`${pathATaken}:true`)
    .cmd(`${choice}:1`)
    .msg('You chose the left path...')
    .call('PathAEvents')
    .build();

  // Path B (Right)
  sb.once('column[25]>0')
    .cmd(`${pathBTaken}:true`)
    .cmd(`${choice}:2`)
    .msg('You chose the right path...')
    .call('PathBEvents')
    .build();

  // Path A Events
  sb.event('PathAEvents')
    .crystals(25)
    .msg('You found a crystal cache!')
    .wait(2)
    .emerge(5, 10, 'A', 'SmallSpider', 3)
    .msg('But it was guarded!')
    .build();

  // Path B Events
  sb.event('PathBEvents')
    .ore(50)
    .msg('You found rich ore deposits!')
    .wait(2)
    .cmd('rockfall', 25, 10, 3)
    .msg('Watch out for unstable ceiling!')
    .build();

  // Convergence point
  sb.when(`(${pathATaken}==true or ${pathBTaken}==true) and row[20]>0`)
    .msg('The paths converge here')
    .objective('Reach the exit')
    .build();

  return sb.build();
}

/**
 * Example 6: Timer-based events
 */
export function createTimedMission(): string {
  const sb = new ScriptBuilder('timed');

  // Mission timers
  const missionTimer = sb.timer('MissionTimer', 600, 'MissionTimeout');
  const evacuationTimer = sb.timer('EvacTimer', 0);
  const evacuationStarted = sb.bool('EvacStarted', false);

  // Mission start
  sb.event('Init')
    .msg('You have 10 minutes to collect crystals and evacuate!')
    .objective('Collect 50 crystals before time runs out')
    .cmd(`${missionTimer}:600`)
    .build();

  // Time warnings
  sb.once(`${missionTimer}<=300`).msg('5 minutes remaining!').build();

  sb.once(`${missionTimer}<=120`).msg('2 minutes remaining! Hurry!').cmd('shake', 2).build();

  sb.once(`${missionTimer}<=60`).msg('1 minute remaining! EVACUATE NOW!').cmd('shake', 5).build();

  // Crystal collection complete
  sb.once(`crystals>=50 and ${evacuationStarted}==false`)
    .cmd(`${evacuationStarted}:true`)
    .msg('Crystals collected! Return to base immediately!')
    .objective('Return to the starting area')
    .cmd(`${evacuationTimer}:120`)
    .build();

  // Successful evacuation
  sb.when(`${evacuationStarted}==true and row[1]>0 and column[1]>0`)
    .msg('Mission complete! Well done!')
    .win()
    .build();

  // Mission timeout
  sb.event('MissionTimeout').msg("Time's up! Mission failed!").lose().build();

  return sb.build();
}
