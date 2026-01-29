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

    // Parameters
    R           // Kernel radius
    mu, sigma   // Growth function center/width
    dt          // Time step
    flowStrength    // How strongly mass follows gradient
    diffusion       // Prevents mass collapse

    // Methods
    step()              // Main simulation step
    computePotential()  // Convolution K * A
    computeAffinity()   // Growth function G(U)
    computeGradient()   // Flow field F = ∇(affinity)
    transportMass()     // Mass-conservative advection
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

    // Gradient buffers for each field
    foodGradX, foodGradY
    // ... etc

    // Methods
    update()            // Update all fields
    emitSignal(type, x, y, intensity)
    getSignalGradient(type, x, y)
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
│ 10. computeAffinity()                                       │
│    └─ affinity = G(U) with local morphology influence       │
│                                                             │
│ 11. computeGradient()                                       │
│    └─ F = ∇(affinity) + directional bias                    │
│                                                             │
│ 12. applySteeringForces()                                   │
│    └─ Add creature heading influence to flow field          │
│                                                             │
│ 13. transportMass()                                         │
│    └─ Reintegration tracking (mass-conservative advection)  │
│                                                             │
│ 14. applyDiffusion()                                        │
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

## Performance Notes

- **Convolution** is O(N^2 * K^2) where N=grid size, K=kernel size
- **Creature detection** uses flood fill, O(N^2) per frame
- **Signal gradients** computed via Sobel filter, same as food/pheromone
- For large grids, consider FFT-based convolution

## References

- [Lenia Paper](https://arxiv.org/abs/1812.05433) - Chan, 2018
- [Flow-Lenia Paper](https://arxiv.org/abs/2212.07906) - Plantec et al., 2023
- [Lenia Portal](https://chakazul.github.io/lenia.html)
