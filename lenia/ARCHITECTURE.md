# Lenia Explorer Architecture

Developer documentation for the Lenia Explorer codebase.

## System Overview

Lenia Explorer is an interactive web-based implementation of **Flow-Lenia** - a continuous cellular automaton that produces lifelike creatures. Unlike standard cellular automata with discrete states, Lenia uses:

- **Continuous space**: Smooth grid values (0-1) instead of binary
- **Continuous time**: Small dt steps instead of discrete generations
- **Mass conservation**: Matter flows rather than appearing/disappearing (Flow-Lenia)

The simulation creates emergent behaviors including:
- Self-organizing "creatures" that maintain cohesive structure
- Movement and locomotion via asymmetric kernels
- Predator-prey ecosystems with natural selection
- Bioluminescent visual signaling (Phase 12)
- Emergent collective behaviors: flocking, pack hunting, homing (Phase 13)
- Migration patterns with seasonal cycles and moving food zones (Phase 14)
- Parameter localization enabling true multi-species coexistence (Phase 15)
- Kernel modulation locomotion enabling actual creature movement (Phase 16)

## File Structure

```
lenia/
├── index.html          # Main HTML with UI layout
├── lenia.js            # Core Lenia + p5.js rendering
├── flow-lenia.js       # Mass-conservative Flow-Lenia engine
├── environment.js      # Food, pheromones, signals (Phase 4, 12)
├── creatures.js        # Detection, tracking, genomes, evolution (Phase 5+)
├── species.js          # Creature presets and parameters
├── kernels.js          # Convolution kernel generators
├── ui.js               # UI controls and state management
├── multi-channel.js    # Multi-species ecosystem mode
├── explorer.js         # Parameter discovery tools
├── recorder.js         # Video/GIF recording
└── ARCHITECTURE.md     # This file
```

## Core Classes

### FlowLenia (flow-lenia.js)

The main simulation engine. Key differences from standard Lenia:

```javascript
class FlowLenia {
    // State
    A           // Activation/mass grid (Float32Array)
    potential   // Neighborhood potential U = K * A
    affinity    // G(U) - where mass "wants" to be
    Fx, Fy      // Flow field components

    // Phase 15: Per-cell parameters (parameter localization)
    P_mu        // Local growth center per cell (Float32Array)
    P_sigma     // Local growth width per cell (Float32Array)
    newP_mu     // Transport buffer for mu
    newP_sigma  // Transport buffer for sigma

    // Global Parameters
    R           // Kernel radius
    mu, sigma   // Growth function center/width (defaults)
    dt          // Time step
    flowStrength    // How strongly mass follows gradient
    diffusion       // Prevents mass collapse

    // Methods
    step()              // Main simulation step
    computePotential()  // Convolution K * A
    computeAffinity()   // Growth function G(U), uses local params in ecosystem mode
    computeGradient()   // Flow field F = ∇(affinity)
    transportMass()     // Mass-conservative advection + parameter transport
    applyCreatureRepulsion() // Push overlapping creatures apart (Phase 15)
    drawBlob(x, y, r, v, localMu, localSigma) // Draw with species-specific params
}
```

### Environment (environment.js)

Environmental layers that influence creature behavior:

```javascript
class Environment {
    // Fields
    food            // Regenerating resource
    pheromone       // Creature trails

    // Phase 12: Bioluminescent signals
    alarmSignal     // Red - danger warning
    huntingSignal   // Magenta - predator activity
    matingSignal    // Cyan - reproduction readiness
    territorySignal // Green - territorial marking

    // Phase 14: Migration systems
    migrationZones      // Array of moving food hotspots
    migrationTrails     // Float32Array tracking creature travel paths
    seasonPhase         // Current position in seasonal cycle (0-2π)

    // Gradient buffers for each field
    foodGradX, foodGradY
    // ... etc

    // Methods
    update()            // Update all fields
    emitSignal(type, x, y, intensity)
    getSignalGradient(type, x, y)

    // Phase 14: Seasonal & Migration
    updateSeasonalCycle()       // Modulate food spawn rate sinusoidally
    getSeasonName()             // Returns 'Spring', 'Summer', 'Fall', 'Winter'
    initializeMigrationZones()  // Create zone objects
    updateMigrationZones()      // Move zones (circular/linear/random)
    applyMigrationZoneFood()    // Concentrate food at zone centers
    updateMigrationTrails(mass) // Record creature positions, decay trails
}
```

### CreatureTracker (creatures.js)

Detects and tracks discrete creatures from the continuous mass field:

```javascript
class CreatureTracker {
    creatures       // Array of detected creatures
    labels          // Cell-to-creature mapping

    // Methods
    update(massField)   // Detect creatures via flood fill
    computeSensoryInput(creature, environment)
    processPredation(grid, size)
    checkEvolutionEvents()
    emitSignal(type, x, y, intensity, creature)
}
```

### Genome (creatures.js)

Heritable parameters for creatures:

```javascript
class Genome {
    // Sensory weights
    foodWeight, pheromoneWeight, socialWeight

    // Movement
    turnRate, speedPreference

    // Metabolism
    metabolismRate, reproductionThreshold, reproductionCost

    // Morphology (Phase 6)
    kernelRadius, growthMu, growthSigma

    // Directional (Phase 7)
    kernelBias, kernelOrientation

    // Sensing (Phase 8)
    sensorAngle, sensorFocus

    // Memory (Phase 11)
    memoryWeight, memoryDecay

    // Signaling (Phase 12)
    alarmSensitivity, huntingSensitivity
    matingSensitivity, territorySensitivity
    signalEmissionRate

    // Collective Behavior (Phase 13)
    alignmentWeight     // Strength of heading alignment with neighbors (0-1)
    flockingRadius      // Distance to consider neighbors (15-50 pixels)
    packCoordination    // Flanking vs direct chase preference (0-1)
    territoryRadius     // Size of defended home area (0-80 pixels)
    homingStrength      // Pull toward birthplace (0-0.5)

    // Migration (Phase 14)
    migrationSensitivity // Amplifies following of strong food gradients (0-1)
    wanderlust          // Exploration when food is scarce (0-1)
    seasonalAdaptation  // Anticipate seasonal changes (0-1)

    // Locomotion (Phase 16)
    locomotionSpeed     // Kernel offset magnitude for self-propulsion (0-3 pixels)

    // Methods
    mutate(rate)    // Create mutated offspring
    clone()         // Exact copy
}
```

### CreatureMemory (creatures.js)

Spatial memory for learned behaviors (Phase 11):

```javascript
class CreatureMemory {
    food        // Positive memories (food locations)
    danger      // Negative memories (predator encounters)

    recordFood(x, y, worldSize, intensity)
    recordDanger(x, y, worldSize, intensity)
    getGradient(x, y, worldSize)
}
```

## Data Flow

### Frame Update Sequence

```
┌─────────────────────────────────────────────────────────────┐
│ 1. environment.update()                                     │
│    └─ Food regrows, pheromones decay, signals diffuse       │
│                                                             │
│ 2. creatureTracker.update(massField)                        │
│    └─ Connected component labeling to detect creatures      │
│                                                             │
│ 3. assignEcosystemGenomes() / assignDefaultGenome()         │
│    └─ Assign genomes to newly detected creatures            │
│                                                             │
│ 4. creatureTracker.updateEnergy(environment)                │
│    └─ Metabolism cost, food consumption                     │
│                                                             │
│ 5. creatureTracker.processPredation(grid, size)             │
│    └─ Hunters eat prey, emit alarm/hunting signals          │
│                                                             │
│ 6. checkEvolutionEvents()                                   │
│    └─ Check reproduction/death, emit mating signals         │
│                                                             │
│ 7. processReproduction(parent) for each reproducing creature│
│    └─ Split mass, create offspring with mutated genomes     │
│                                                             │
│ 8. updateCreatureHeadings(environment)                      │
│    └─ computeSensoryInput() for each creature               │
│                                                             │
│ 9. computePotential()                                       │
│    └─ U = K * A (convolution)                               │
│                                                             │
│ 10. applyCreatureKernelOffsets() (Phase 16)                 │
│    └─ Compute offset vectors from heading × locomotionSpeed │
│                                                             │
│ 11. applyPotentialOffsets() (Phase 16)                      │
│    └─ Shift potential field for creature cells              │
│                                                             │
│ 12. computeAffinity()                                       │
│    └─ affinity = G(U) with local mu/sigma (Phase 15)        │
│                                                             │
│ 13. computeGradient()                                       │
│    └─ F = ∇(affinity) + directional bias                    │
│                                                             │
│ 14. applySteeringForces()                                   │
│    └─ Add creature heading influence to flow field          │
│                                                             │
│ 15. transportMass()                                         │
│    └─ Mass-conservative advection + parameter transport     │
│                                                             │
│ 16. applyCreatureRepulsion() (Phase 15)                     │
│    └─ Flow field forces push overlapping creatures apart    │
│                                                             │
│ 17. applyDiffusion()                                        │
│    └─ Laplacian diffusion to prevent collapse               │
└─────────────────────────────────────────────────────────────┘
```

### Sensory Input Computation

```javascript
computeSensoryInput(creature, environment) {
    senseX, senseY = 0

    // Food gradient (weighted by genome.foodWeight)
    senseX += foodGrad.x * foodWeight

    // Pheromone gradient (weighted by genome.pheromoneWeight)
    senseX += pheromoneGrad.x * pheromoneWeight

    // Social forces (attraction/repulsion to other creatures)
    senseX += socialForce.x * socialWeight

    // Memory gradient (learned food/danger locations)
    senseX += memoryGrad.x * memoryWeight

    // Phase 12: Signal responses
    // Alarm: prey flee, hunters ignore
    if (!isPredator) senseX -= alarmGrad.x * alarmSensitivity

    // Hunting: hunters converge, prey flee
    if (isPredator) senseX += huntingGrad.x * huntingSensitivity

    // Mating: attraction when fertile
    if (energy > threshold * 0.5) senseX += matingGrad.x * matingSensitivity

    // Apply directional weighting (Phase 8)
    applyDirectionalWeight(gradient, preferredDir, sensorFocus)

    return { x: senseX, y: senseY }
}
```

## Adding New Features

### Adding a New Signal Type

1. **environment.js**: Add field and gradient buffers
   ```javascript
   this.newSignal = new Float32Array(size * size);
   this.newSignalGradX = new Float32Array(size * size);
   this.newSignalGradY = new Float32Array(size * size);
   ```

2. **environment.js**: Update `updateSignals()`, `computeGradients()`, `clear()`, `reset()`, `resize()`

3. **environment.js**: Add case to `emitSignal()`, `getSignalGradient()`, `getSignalAt()`

4. **creatures.js**: Add sensitivity parameter to Genome class and `mutate()`, `clone()`, `fromSensoryParams()`

5. **creatures.js**: Add response in `computeSensoryInput()`

6. **creatures.js**: Add color in `getSignalColor()`

7. **species.js**: Add default sensitivity values to species genomes

8. **lenia.js**: Add rendering overlay and toggle variable

9. **index.html**: Add UI button

10. **ui.js**: Wire up button event listener

### Adding a New Genome Parameter

1. **creatures.js Genome constructor**: Add with default value
2. **creatures.js mutate()**: Add mutation with bounds
3. **creatures.js clone()**: Include in clone
4. **creatures.js fromSensoryParams()**: Include with default
5. **species.js**: Add to relevant species genomes
6. **Use the parameter** in the appropriate system (sensing, movement, etc.)

### Adding a New Species

In **species.js**, add a new entry:

```javascript
mySpecies: {
    name: "My Species",
    description: "Description here",
    params: {
        R: 12,
        peaks: 1,
        mu: 0.20,
        sigma: 0.03,
        dt: 0.1,
        flowStrength: 1.0,
        diffusion: 0.1,
        isFlowSpecies: true,
        isSensorySpecies: true,
        kernelType: 'ring',
        sensory: { /* UI defaults */ },
        environment: { /* environment settings */ },
        genome: {
            // All genome parameters
        }
    },
    pattern: (function() {
        // Generate pattern array
    })()
}
```

## Signal System (Phase 12)

### Signal Types

| Signal | Color | Trigger | Effect |
|--------|-------|---------|--------|
| Alarm | Red/Orange | Prey detects nearby hunter | Other prey flee |
| Hunting | Magenta | Hunter catches prey | Hunters converge |
| Mating | Cyan/Blue | Energy > 80% reproduction threshold | Attracts mates |
| Territory | Green | Inside core territory (Phase 13) | Spacing behavior |

### Signal Lifecycle

1. **Emission**: Creature calls `emitSignal(type, x, y, intensity)`
2. **Propagation**: Signal spreads via diffusion in `updateSignals()`
3. **Decay**: Signal fades over ~30-60 frames (signalDecayRate)
4. **Sensing**: Other creatures sense gradient in `computeSensoryInput()`
5. **Response**: Movement adjusted based on signal type and genome sensitivity

### Visual Rendering

- Field overlays show signal intensity as colored tints
- Creature glow effect shows recent signal emissions
- Colors: alarm=red/orange, hunting=magenta, mating=cyan, territory=green

## Collective Behaviors (Phase 13)

### Flocking/Schooling (Prey)

Boids-inspired alignment where prey match headings with nearby neighbors:

```javascript
// In computeSensoryInput() for non-hunters
if (!creature.isHunter && genome.alignmentWeight > 0) {
    // Average neighbor headings within flockingRadius
    for (const other of nearbyPrey) {
        avgHeadingX += other.headingX;
        avgHeadingY += other.headingY;
    }
    // Blend into sensory input
    senseX += avgHeadingX * genome.alignmentWeight;
}
```

### Pack Hunting (Hunters)

Hunters coordinate to flank prey from perpendicular angles:

```javascript
// In computeSensoryInput() for hunters
if (creature.isHunter && genome.packCoordination > 0) {
    // Find other hunters targeting same prey
    // Calculate flanking angle perpendicular to average approach
    const flankAngle = avgHunterAngle + Math.PI/2 * side;
    // Blend between direct chase and flanking
    finalAngle = lerp(directAngle, flankAngle, packCoordination);
}
```

### Territory & Homing

Creatures remember birthplace and are attracted back:

```javascript
// In computeSensoryInput()
if (genome.homingStrength > 0 && creature.homeX !== undefined) {
    const homeDist = distance(creature, home);
    if (homeDist > genome.territoryRadius) {
        // Gentle pull toward home when outside territory
        senseX += (homeX - creature.x) / homeDist * homingStrength;
    }
}
```

### Visualization: Flock Links

The "Flock Links" overlay draws cyan lines between flocking neighbors. Alpha varies with distance: `40 + 120 * (1 - dist/flockRadius)`.

## Migration Patterns (Phase 14)

### Seasonal Cycles

Food spawn rate oscillates sinusoidally to simulate seasons:

```javascript
// In environment.updateSeasonalCycle()
this.seasonPhase += this.params.seasonSpeed;
const seasonFactor = 1 + this.params.seasonalAmplitude * Math.cos(this.seasonPhase);
this.params.foodSpawnRate = this.baseFoodSpawnRate * seasonFactor;
```

| Season | Phase Range | Food Multiplier |
|--------|-------------|-----------------|
| Spring | 0 to π/2 | High (peak at 0) |
| Summer | π/2 to π | Declining |
| Fall | π to 3π/2 | Low (trough at π) |
| Winter | 3π/2 to 2π | Recovering |

### Moving Food Zones

3-6 hotspots that concentrate food and move across the world:

| Pattern | Movement | Use Case |
|---------|----------|----------|
| Circular | Orbit around center | Predictable migration routes |
| Linear | Straight drift with wrapping | Directional pressure |
| Random | Random walk | Unpredictable resources |

Zones apply extra food with smooth falloff: `extraFood = baseRate * (multiplier - 1) * (1 - (dist/radius)²)`

### Migration Behavior

Creatures respond to seasonal changes through genome parameters:

```javascript
// In computeSensoryInput()
// 1. Amplify strong food gradients (migrationSensitivity)
if (gradMag > 0.05) {
    senseX += foodGrad.x * migrationSensitivity * 2 * 10;
}

// 2. Add exploration when hungry (wanderlust)
if (localFood < 0.3) {
    const scarcity = 1 - (localFood / 0.3);
    senseX += cos(exploreAngle) * wanderlust * scarcity * 5;
}

// 3. Reduce homing when wanderlust high and food scarce
homingReduction = 1 - (scarcityFactor * wanderlust * 0.8);
```

### Visualization

- **Migration Trails**: Golden/amber overlay showing where creatures traveled
- **Zone Centers**: Bright pulsing dots with glow effect at zone positions

## Parameter Localization (Phase 15)

### The Multi-Species Problem

Standard Lenia uses global mu/sigma parameters. When multiple species with different parameter needs share the same grid, they either:
1. Share parameters (forcing same dynamics, causing merging)
2. Use separate grids (multi-channel, but not mass-conservative)

Flow-Lenia solves this with **parameter localization** - each cell stores its own parameters.

### Per-Cell Parameter Storage

```javascript
// In FlowLenia constructor
this.P_mu = new Float32Array(size * size);     // Local growth center
this.P_sigma = new Float32Array(size * size);  // Local growth width
this.newP_mu = new Float32Array(size * size);  // Transport buffer
this.newP_sigma = new Float32Array(size * size);
```

### Parameter Transport (Weighted Average Mixing)

Parameters flow with mass during transport:

```javascript
// In transportMass()
// 1. Transport parameters weighted by mass
newP_mu[destIdx] += sourceMu * mass * weight;
newP_sigma[destIdx] += sourceSigma * mass * weight;

// 2. After transport, compute weighted average
if (newA[i] > 0.0001) {
    P_mu[i] = newP_mu[i] / newA[i];   // sum(mass*mu) / sum(mass)
    P_sigma[i] = newP_sigma[i] / newA[i];
} else {
    // Reset to defaults for empty cells
    P_mu[i] = this.mu;
    P_sigma[i] = this.sigma;
}
```

### Localized Growth Function

In ecosystem mode, `computeAffinity()` uses per-cell parameters:

```javascript
// In computeAffinity() when useLocalizedParams = true
for (let i = 0; i < size * size; i++) {
    const localMu = P_mu[i];
    const localSigma = P_sigma[i];
    affinity[i] = this.growthWithMorphology(potential[i], localMu, localSigma);
}
```

### Species-Specific Spawning

Different species spawn with different parameters:

```javascript
// Hunters: mu=0.24, sigma=0.028
flowLenia.drawBlob(pos.x, pos.y, 14, 0.9, hunterMu, hunterSigma);

// Prey: mu=0.18, sigma=0.035
flowLenia.drawBlob(pos.x, pos.y, 10, 0.85, preyMu, preySigma);
```

### Flow Field Repulsion

When creatures get too close, direct flow field forces push them apart:

```javascript
// In applyCreatureRepulsion()
for each creature pair {
    if (distance < threshold) {
        // Calculate repulsion direction
        const force = (1 - distance/threshold)^2 * repulsionStrength;
        // Apply force to flow field cells belonging to each creature
        Fx[idx] += dirX * force;
        Fy[idx] += dirY * force;
    }
}
```

### Critical: UI Mode Selection

**IMPORTANT**: The "Ecosystem" tab uses `multiChannel` (standard Lenia, NOT mass-conservative!).

For proper multi-species with parameter localization:
1. Use **Single mode** with Flow-Lenia enabled
2. Click **"Spawn Ecosystem"** button
3. This uses Flow-Lenia physics with parameter localization

### Results

| Metric | Before Phase 15 | After Phase 15 |
|--------|-----------------|----------------|
| Creature separation | Merged into blob | Maintained separate |
| Mass conservation | +1470% (explosion) | -20% (expected deaths) |
| Species identity | Lost on overlap | Preserved |

## Kernel Modulation Locomotion (Phase 16)

### The Movement Problem

Flow-Lenia's affinity dynamics (∇G(U)) create strong pattern-stabilizing forces. Previous steering approaches added forces to the flow field, but these were overwhelmed by the affinity gradient's desire to maintain pattern stability. Creatures would "swim in place" - heading changed but position didn't.

### Solution: Asymmetric Kernel Offset

Instead of fighting CA dynamics with external forces, kernel modulation works **with** the dynamics by shifting the kernel based on heading. This creates the asymmetric growth that original Lenia gliders use for natural locomotion.

```
Standard kernel: Centered, symmetric → stationary pattern
Offset kernel:   Shifted toward heading → pattern propels in that direction
```

### How It Works

1. Each creature has a `locomotionSpeed` genome parameter (0-3 pixels)
2. Before computing affinity, we offset where cells sample their potential:
   - Cells sample from `(x - dx, y - dy)` where `dx, dy` = heading × locomotionSpeed
   - This makes cells "see" what's behind them as local
3. Growth function responds to offset conditions:
   - Front edge sees lower density → positive growth
   - Back edge sees higher density → negative growth
4. Pattern naturally propels itself forward

### Implementation

```javascript
// In step(), after computePotential():
applyCreatureKernelOffsets();  // Compute offsets from headings
applyPotentialOffsets();       // Shift potential field

// applyCreatureKernelOffsets()
for (const creature of creatures) {
    creature.kernelOffsetX = Math.cos(creature.heading) * creature.genome.locomotionSpeed;
    creature.kernelOffsetY = Math.sin(creature.heading) * creature.genome.locomotionSpeed;
}

// applyPotentialOffsets()
for each cell belonging to a creature {
    // Sample potential from offset location (bilinear interpolation)
    potential[idx] = sampleBilinear(potential, x - dx, y - dy);
}
```

### Species Locomotion Speeds

| Species | locomotionSpeed | Rationale |
|---------|-----------------|-----------|
| Hunter | 2.0 | Fast pursuit |
| Prey | 1.2 | Moderate escape |
| Grazer | 0.8 | Slow foraging |
| Migrant | 1.5 | Travel-oriented |
| Schooler | 1.0 | Moderate group |

### Why This Works

| Aspect | Steering Forces | Kernel Modulation |
|--------|-----------------|-------------------|
| Works with CA | ❌ Fights affinity | ✅ Uses affinity |
| Natural motion | ❌ Teleporting feel | ✅ Flowing motion |
| Shape stability | ⚠️ May distort | ✅ Self-maintaining |

## Performance Notes

- **Convolution** is O(N^2 * K^2) where N=grid size, K=kernel size
- **Creature detection** uses flood fill, O(N^2) per frame
- **Signal gradients** computed via Sobel filter, same as food/pheromone
- For large grids, consider FFT-based convolution

## References

- [Lenia Paper](https://arxiv.org/abs/1812.05433) - Chan, 2018
- [Flow-Lenia Paper](https://arxiv.org/abs/2212.07906) - Plantec et al., 2023
- [Lenia Portal](https://chakazul.github.io/lenia.html)
