# Classes and Collections

Classes and collections provide access to game objects in Manic Miners scripting. Collections are wrappers for multiple similar objects and can be used with triggers for notifications and conditions for comparisons.

## Object Classes

The main object classes in the game are:

- [Arrows](arrows.md) — Visual indicators and waypoints  
- [Buildings](buildings.md) — All constructable structures  
- [Creatures](creatures.md) — Monsters and wildlife  
- [Miners](miners.md) — Rock Raiders (player units)  
- [Timers](timers.md) — Time-based events  
- [Vehicles](vehicles.md) — All driveable units  

Each class has specific properties, triggers, and methods documented in its respective page.

## Environmental Collections

Environmental collections are special read-only collections that return counts of discovered objects. They function as macros and cannot have properties accessed.

### Resource Collections

| Collection     | Description                                                                                           |
|----------------|-------------------------------------------------------------------------------------------------------|
| `Crystal_C`    | Unstored energy crystals (green/purple on ground or being carried). Does **not** include crystals eaten by monsters |
| `Ore_C`        | Unstored ore. (Stored count is available via the `ore` macro.)                                        |
| `Stud_C`       | Unstored building studs. (Stored count is available via the `studs` macro.)                           |
| `Dynamite_C`   | Dynamite outside of the toolstore (either carried or on the ground).                                  |
| `Barrier_C`    | Construction barriers released from the toolstore.                                                    |

### Navigation Modifiers

| Collection               | Description                             |
|--------------------------|-----------------------------------------|
| `NavModifierLava_C`      | Number of lava tiles on the map         |
| `NavModifierWater_C`     | Number of water tiles on the map        |
| `NavModifierRubble_C`    | Number of rubble tiles (any stage)      |
| `NavModifierPowerPath_C` | Number of completed power-path tiles    |

### Event Collections

| Collection           | Description                   |
|----------------------|-------------------------------|
| `EventErosion_C`     | Number of active erosions     |
| `EventLandslide_C`   | Number of active landslides   |

### Special Collections

| Collection            | Description                         |
|-----------------------|-------------------------------------|
| `ElectricFence_C`     | Number of placed electric fences    |
| `RechargeSeamGoal_C`  | Number of discovered recharge seams |

## Usage Examples

### Counting Objects
```plaintext
# Check if any crystals need collecting
when(Crystal_C > 0)[CollectCrystals];

# Monitor active hazards
when(EventErosion_C > 3)[TooManyErosions];
````

### Resource Management

```c
// The collection returns unstored count
int UnStoredCrystals = Crystal_C;

// The macro returns stored count  
int StoredCrystals = crystals;
```

## Collection vs Macro

* **Collections** (e.g., `Crystal_C`) — Count of objects currently in the world
* **Macros**      (e.g., `crystals`)   — Game state values (often stored resources)

## See Also

* [Macros](../syntax/macros.md)    — Built-in game state variables
* [Variables](../syntax/variables.md) — User-defined storage
* [Triggers](../syntax/triggers.md)   — Event-based programming
