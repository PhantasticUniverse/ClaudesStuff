# Lenia Explorer - Phase Reflections

Detailed lessons learned, trade-offs, and insights from each development phase.

---

## Phase 5: Evolution & Reproduction

### Offspring Viability in Flow-Lenia

When implementing reproduction via mass splitting, offspring initially failed to survive. The root cause: newly created blobs need sufficient mass density to remain stable in Lenia's dynamics. Too weak and they dissipate within frames.

**Lesson**: In Lenia, creature stability depends on the relationship between kernel parameters (R, mu, sigma) and local mass density. When splitting a creature, offspring need:
- Adequate radius (at least 60-75% of parent)
- Sufficient peak intensity (~0.5-0.6 at center)
- Minimum absolute size (radius >= 6 pixels)

### Energy Balance Matters

The metabolism vs food-gain ratio determines whether populations can sustain themselves. If metabolism is too high relative to food energy, creatures starve before reproducing.

**Default tuning**: Food Energy Gain should exceed Metabolism Rate by at least 3-5x for sustainable populations.

### Flow-Lenia Merging Behavior

Unlike discrete CA where creatures are separate entities, Flow-Lenia creatures can merge when they get close:
- "Deaths" often appear as merges, not starvation
- Population tends toward fewer, larger creatures
- Reproduction must create sufficient separation between offspring

---

## Phase 6: Morphology Evolution

### Soft Influence Approach

Rather than computing per-creature kernels (expensive), we use a "soft influence" approach:
1. Each creature's morphology genome defines preferred kernel parameters
2. Affinity map computation blends global kernel params with local creature params
3. Influence weight = creature density at that cell
4. Stronger creatures (more mass) have more influence on local physics

**Trade-off**: Less accurate than true per-creature kernels but much simpler and computationally feasible.

### Morphology Drift

Due to merging behavior, morphology drift is subtle:
- Creatures that merge combine mass but lose distinct genomes
- Populations tend to homogenize toward dominant morphology
- Use negative social weight species for more diversity

### Species-Specific Morphology

- **Hunter**: Large R (14) for better prey detection
- **Prey**: Small R (8) for faster, agile movement
- **Grazer/Schooler**: Balanced medium R (10-11)

---

## Phase 7: Directional Creatures

### Kernel Bias Implementation

Two new genome parameters:
- **kernelBias** (0-0.5): How asymmetric the creature is
- **kernelOrientation** (radians): Which direction is "forward"

Rather than computing asymmetric kernels per-creature, we add a directional bias term to the flow field.

### Species Directional Profiles

- **Hunter**: High bias (0.3) - streamlined, moves decisively
- **Prey**: Low bias (0.1) - maneuverable, quick direction changes
- **Grazer**: Minimal bias (0.05) - symmetric forager
- **Schooler**: Mild bias (0.1) - coordinated movement

---

## Phase 8: Asymmetric Sensing

### Cosine Weighting Implementation

Two new genome parameters:
- **sensorAngle** (radians): Direction of best sensing. 0 = forward, π = backward
- **sensorFocus** (0-1): How focused the sensing is. 0 = isotropic, 1 = narrow cone

Weight existing gradients by angular alignment rather than computing separate sensors per direction.

### Species Sensing Profiles

- **Hunter**: sensorAngle=0 (forward), sensorFocus=0.6 - focused forward cone
- **Prey**: sensorAngle=π (backward), sensorFocus=0.4 - rear awareness
- **Grazer**: sensorAngle=0, sensorFocus=0.1 - mostly isotropic
- **Schooler**: sensorAngle=0, sensorFocus=0.2 - mild forward bias

### Evolutionary Pressure

- Hunters with tighter forward focus catch more prey
- Prey with wider rear awareness survive longer
- Over generations, expect specialization

---

## Phase 10: Predator-Prey Ecosystem

### Implementation Challenges

**Genome Assignment Ordering**: Fixed by checking `ecosystemMode` first and using separate `assignEcosystemGenomes()` method.

**Creature Size Detection**: Track pending hunter/prey counts from initial spawn; assign largest unassigned creatures as hunters.

**Predation Difficulty**: Prey have negative social weight (-0.8) and backward sensing. Hunters have positive social weight (1.5) and forward sensing.

### Energy Balance for Hunters

Hunters face unique challenges:
- Can't eat food (foodWeight: 0.0)
- Higher metabolism (0.03 vs 0.025 for prey)
- Must catch prey to survive

Compensation:
- 2x starting energy
- High predation energy gain (1.5x prey mass)
- Generous catch radius

---

## Phase 11: Creature Memory & Spatial Learning

### Memory Architecture

Each creature maintains a coarse 8x8 spatial memory grid:
- **Food memories**: Positive associations where food was consumed
- **Danger memories**: Negative associations where predators were nearby

The grid is much smaller than the world, creating "regions" of memory rather than exact positions.

### Memory Gradient Integration

1. Compute net memory value at nearby locations (food - danger)
2. Generate gradient toward positive / away from negative
3. Blend with sensory gradients based on `memoryWeight`

### Species Memory Profiles

- **Grazer**: memoryWeight=0.6, memoryDecay=0.995 - Strong food memory
- **Prey**: memoryWeight=0.5, memoryDecay=0.98 - Strong danger memory
- **Hunter**: memoryWeight=0.4, memoryDecay=0.99 - Moderate memory
- **Schooler**: memoryWeight=0.2, memoryDecay=0.995 - Mild memory

### Memory Inheritance

Offspring inherit 50% of parent's memory - "cultural transmission" of good/bad locations.

### Bug Fix: Mass Conservation During Reproduction

Critical bug: mass increased +3700% during reproduction.

**Root cause**: `processReproduction()` called `drawBlob()` which ADDS mass after only partially reducing parent mass.

**Fix**: Remove ALL parent mass, then redistribute exactly that amount to two offspring blobs via normalized patterns.

### Observing Memory Effects

Best observed with:
- Single creature + food (watch for return visits)
- Ecosystem mode with evolution (watch prey avoidance patterns)

---

## Phase 12: Visual Signaling & Bioluminescence

### Signal Types

Four distinct signal channels for creature communication:
- **Alarm** (red/orange): Prey emit when predator nearby - warns others
- **Hunting** (magenta): Hunters emit on successful catch - draws pack
- **Mating** (cyan): Emitted when energy approaches reproduction threshold
- **Territory** (green): Emitted when inside home territory

### Signal Integration

Signals are stored as separate Float32 arrays in Environment, each with independent decay rates. Creatures sense signal gradients and respond based on genome sensitivity parameters.

### Emergent Behaviors

- Prey warning chains (alarm cascades)
- Hunter convergence on kills
- Mating aggregations when food is plentiful
- Territorial spacing patterns

---

## Phase 13: Emergent Collective Behaviors

### Three Core Mechanisms

**1. Flocking/Schooling (Boids-inspired)**

Prey align their headings with nearby neighbors:
- `alignmentWeight` (0-1): Strength of heading matching
- `flockingRadius` (15-50 pixels): Neighbor detection range

Only non-predators participate in alignment. Uses unit heading vectors (cos/sin of heading angle) averaged across neighbors within radius.

**2. Pack Hunting Coordination**

Hunters coordinate to flank prey:
- `packCoordination` (0-1): Flanking vs direct chase preference

When multiple hunters detect the same prey, they approach from perpendicular angles rather than all chasing directly. Uses creature ID parity to determine which side to flank from, avoiding oscillation.

**3. Territory & Homing**

Creatures remember and return to their birthplace:
- `homeX/homeY`: Birth location (set on creature creation)
- `territoryRadius` (0-80 pixels): Size of defended area
- `homingStrength` (0-0.5): Pull toward birthplace

When outside territory, creatures experience gentle attraction toward home. When inside core territory (80% of radius), they emit territory signals.

### Species Behavioral Profiles

| Species | Alignment | Pack Coord | Territory | Homing |
|---------|-----------|------------|-----------|--------|
| Grazer  | 0.2 (light) | 0.0 | 45px | 0.25 (strong) |
| Schooler | 0.6 (strong) | 0.0 | 0 (nomadic) | 0.0 |
| Hunter | 0.0 | 0.5 (moderate) | 50px | 0.1 (light) |
| Prey | 0.4 (moderate) | 0.0 | 35px | 0.15 |

### Visualization: Flock Links

New overlay button "Flock Links" draws cyan lines between flocking neighbors, showing the alignment network. Alpha decreases with distance for visual clarity.

### Implementation Notes

**Toroidal Distance**: All distance calculations use `toroidalDelta()` for proper wrapping at world edges.

**Performance**: Alignment and pack hunting are O(N²) in worst case. For populations <50, this remains performant. Larger populations may need spatial hashing optimization.

**Flanking Side Selection**: Uses `creature.id % 2` to consistently choose flanking side, preventing hunters from oscillating between sides each frame.

### Emergent Patterns to Watch For

- **Murmuration-like waves**: Schools of prey flowing together, splitting around obstacles
- **Coordinated hunts**: Predators forming crescents around prey groups
- **Territorial mosaic**: Distinct zones with spacing between groups
- **Dynamic equilibrium**: Balance between predator coordination and prey schooling

### Verification Results (2026-01-30)

Visual testing confirmed all Phase 13 features working correctly:

**Test Suite A (Flocking)**: ✅ PASS
- Prey headings converge over time
- No oscillation/jittering in direction
- Flock Links visualization shows cyan connections between neighbors
- Alignment stats: 0.300-0.600 observed (expected range)

**Test Suite B (Pack Hunting)**: ✅ PASS
- Hunters spread out when targeting same prey
- Pack Coordination stats: 0.125 observed
- Deaths recorded from successful hunts (5-8 kills per ecosystem)

**Test Suite C (Territory/Homing)**: ✅ PASS
- Territory signals (green auras) visible at birth locations
- Homing stats: 0.138-0.150 observed
- Creatures show attraction toward birthplace

**Test Suite D (Combined Ecosystem)**: ✅ PASS
- "Signal Symphony" creates beautiful combined visuals
- Population thrives with 1000+ births over extended runs
- FPS: 3-10 depending on population (acceptable for <50 creatures)

**Bug Fixed During Testing**:
- Flock Links alpha visibility: Changed from `80 * proximity` to `40 + 120 * proximity` in `lenia.js:755-758`

**Regression Test**: ✅ PASS
- Standard Lenia with Orbium glider works correctly

---

## Phase 14: Migration & Moving Food Zones

### Seasonal Migration System

Creatures follow moving food zones that orbit around the world:
- Zone patterns: Circular orbit, Linear drift, Random walk
- Zone speed and count are configurable
- Creates natural migration corridors

### Migrant Species

New species type optimized for long-distance travel:
- Higher locomotionSpeed (1.5)
- Moderate food attraction
- Low territorial behavior

See `lenia/reflections/phase-14-migration.md` for full details.

---

## Phase 15: Parameter Localization (Multi-Species)

### Per-Cell Parameters

Each cell stores its own mu/sigma values that flow with mass:
- Enables true multi-species coexistence
- Hunters and prey can have fundamentally different growth rules
- Parameters advect via the flow field

### Creature Separation

Flow field repulsion prevents merging:
- Creatures maintain distinct boundaries
- Predation becomes meaningful (hunter absorbs prey)
- Population diversity preserved

See `lenia/reflections/phase-15-parameter-localization.md` for full details.

---

## Phase 16: Creature Locomotion via Kernel Modulation

### The Locomotion Problem

Flow-Lenia creatures had heading/steering but couldn't translate across the grid - "swimming in place."

### Solution: Kernel Offset

Instead of fighting CA dynamics with steering forces, **shift the kernel** based on heading:
- Cells sample potential from behind their position
- Makes front conditions appear local
- Growth at front, decay at back
- Pattern naturally propels itself forward

### Implementation

New genome parameter: `locomotionSpeed` (0-3 pixels)
- Higher = faster movement
- Species-specific values

See `lenia/reflections/phase-16-locomotion.md` for full details.

---

## Phase 17: Living Aquarium

### Visual Enhancement

Transform into immersive "digital aquarium":
- **Zen Mode**: Full-screen viewing, press Z
- **New palettes**: Bioluminescent, Microscopy, Cosmic, Aurora, Ember
- **Preset scenes**: One-click beautiful configurations
- **Ambient particles**: Floating dust motes create depth
- **Screenshot vignette**: Polished captures

### Bug Fixes

**Swimmer/Vortex Locomotion**: Added missing `isSensorySpecies: true` and `locomotionSpeed` genome parameter. These presets now actually swim.

**Initial State**: App now starts paused on Standard Lenia with Orbium preset.

### Three-Layer Architecture Clarified

| Layer | What It Does | Movement? |
|-------|--------------|-----------|
| Standard Lenia | CA growth/decay | Via asymmetric patterns |
| Flow-Lenia | Mass conservation | No directed movement |
| Sensory System | Tracking + kernel modulation | **Yes** |

See `lenia/reflections/phase-17-living-aquarium.md` for full details.
