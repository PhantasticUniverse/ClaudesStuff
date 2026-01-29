# ClaudesStuff - Project Context

Creative coding experiments with Claude. Focus: artificial life, generative art, computational creativity.

## Current Project: Lenia Explorer

Interactive web-based Lenia - continuous cellular automata producing lifelike creatures.

### Status: Phase 11 Complete

1. Core Lenia with multiple kernel types
2. Multi-channel ecosystems
3. Flow-Lenia (mass-conservative)
4. Sensory creatures & environments
5. Evolving creatures - genome inheritance, energy system, reproduction
6. Morphology evolution - kernel parameters (R, μ, σ) are heritable traits
7. Directional creatures - kernel bias creates asymmetric, oriented creatures
8. Asymmetric sensing - creatures detect stimuli directionally (forward/backward focus)
9. Sensor cone visualization - visual representation of creature sensing
10. Predator-Prey Ecosystem - mixed populations of hunters and prey with predation mechanics
11. **Creature Memory & Spatial Learning** - creatures remember food locations and danger zones

### Key Files

```
lenia/
├── index.html       # UI
├── lenia.js         # Core + p5.js rendering
├── flow-lenia.js    # Mass-conservative flow dynamics
├── environment.js   # Food, pheromones, currents
├── creatures.js     # Detection & tracking
├── kernels.js       # Kernel generation
├── species.js       # Presets (standard, flow, sensory)
├── multi-channel.js # Ecosystem simulation
├── explorer.js      # Parameter search
├── recorder.js      # Video/GIF export
└── ui.js            # Controls
```

### Running

```bash
# Just open in browser - no build needed
open lenia/index.html

# Or with live reload
npx live-server lenia/
```

---

## Best Practices

### Always Test Visually

After any change, open the browser and verify:
- Does it render without console errors?
- Does the simulation run smoothly?
- Do the new controls work?
- Does the expected behavior appear?

**Don't ship code you haven't watched run.**

### Keep It Simple

- Vanilla JS only (no build tools, no frameworks)
- p5.js for rendering
- Native DOM for UI
- Each file has one responsibility

### Incremental Changes

1. Make one change
2. Test it visually in the browser
3. Confirm it works
4. Update this CLAUDE.md if needed
5. **Write a Reflections section** for major phases - document lessons learned, trade-offs, and insights
6. **Commit and push** - don't forget this step! Always commit and push at the end of each major change
7. Then add the next thing

**IMPORTANT**: Always ask the user if they want to commit and push after completing a major phase or feature.

### Parameter Design

- All params adjustable via sliders
- Sane defaults that show interesting behavior
- Ranges that avoid crashes (no div-by-zero, etc.)

---

## References

- [Lenia Paper](https://arxiv.org/abs/1812.05433) - Chan, 2018
- [Flow-Lenia Paper](https://arxiv.org/abs/2212.07906) - Plantec et al., 2023
- [Metamorphic Transitions in Lenia](https://link.springer.com/article/10.1007/s10015-025-01081-7) - 2025 (Phase 6 inspiration)
- [Sensorimotor Lenia](https://developmentalsystems.org/sensorimotor-lenia/) - Evolutionary morphology
- [Lenia Portal](https://chakazul.github.io/lenia.html)

---

## Reflections (Phase 5)

### Offspring Viability in Flow-Lenia

When implementing reproduction via mass splitting, offspring initially failed to survive. The root cause: newly created blobs need sufficient mass density to remain stable in Lenia's dynamics. Too weak and they dissipate within frames.

**Lesson**: In Lenia, creature stability depends on the relationship between kernel parameters (R, mu, sigma) and local mass density. When splitting a creature, offspring need:
- Adequate radius (at least 60-75% of parent)
- Sufficient peak intensity (~0.5-0.6 at center)
- Minimum absolute size (radius >= 6 pixels)

### Energy Balance Matters

The metabolism vs food-gain ratio determines whether populations can sustain themselves. If metabolism is too high relative to food energy, creatures starve before reproducing. Finding the right balance is key to observing natural selection.

**Default tuning suggestion**: Food Energy Gain should exceed Metabolism Rate by at least 3-5x for sustainable populations.

### Flow-Lenia Creates Merging Behavior

Unlike discrete CA where creatures are separate entities, Flow-Lenia creatures can merge when they get close. This means:
- "Deaths" often appear as merges, not starvation
- Population tends toward fewer, larger creatures
- Reproduction must create sufficient separation between offspring

---

## Reflections (Phase 6)

### Morphology Evolution via Soft Influence

Phase 6 adds heritable kernel parameters (kernelRadius, growthMu, growthSigma) to creature genomes. Rather than computing per-creature kernels (expensive), we use a "soft influence" approach:

1. Each creature's morphology genome defines its preferred kernel parameters
2. The affinity map computation blends global kernel params with local creature params
3. Influence weight = creature density at that cell
4. Stronger creatures (more mass) have more influence on local physics

**Trade-off**: This is less accurate than true per-creature kernels but much simpler and computationally feasible.

### Observing Morphology Drift

Due to Flow-Lenia's merging behavior, morphology drift is subtle:
- Creatures that merge combine their mass but lose distinct genomes
- Populations tend to homogenize toward a single dominant morphology
- To see more diversity, try species with negative social weight (avoid each other)

### Species-Specific Morphology

Different species now have distinct starting morphologies:
- **Hunter**: Large R (14) for better prey detection
- **Prey**: Small R (8) for faster, agile movement
- **Grazer/Schooler**: Balanced medium R (10-11)

This creates natural advantages: hunters sense prey from farther away, prey can maneuver more quickly.

---

## Reflections (Phase 7)

### Directional Creatures via Kernel Bias

Phase 7 adds directional asymmetry to creature morphology through two new genome parameters:
- **kernelBias** (0-0.5): How asymmetric the creature is. 0 = symmetric blob, 0.3+ = noticeably directional
- **kernelOrientation** (radians): Which direction is "forward" relative to heading

### Implementation Approach

Rather than computing asymmetric kernels per-creature, we add a directional bias term to the flow field:
1. Compute the creature's effective orientation = heading + kernelOrientation
2. Create a bias vector pointing in that direction, scaled by kernelBias
3. Add this bias to the flow gradient where the creature has mass
4. Stronger bias = mass flows more strongly "forward"

This creates creatures that naturally propel themselves in their heading direction.

### Species Directional Profiles

- **Hunter**: High bias (0.3) - streamlined predator shape, moves decisively toward prey
- **Prey**: Low bias (0.1) - more maneuverable, can change direction quickly
- **Grazer**: Minimal bias (0.05) - symmetric forager, explores evenly
- **Schooler**: Mild bias (0.1) - slight forward tendency for coordinated movement

### Observing Directionality

Directional effects are most visible when:
- Creatures have high bias values (0.2+)
- Evolution is enabled so bias can drift
- Using sensory species (they have consistent headings)

With low bias or random movement, creatures remain blob-like. As bias increases, they become more elongated in their movement direction.

---

## Reflections (Phase 8)

### Asymmetric Sensing via Cosine Weighting

Phase 8 adds directional perception through two new genome parameters:
- **sensorAngle** (radians): Direction of best sensing relative to heading. 0 = forward, π = backward
- **sensorFocus** (0-1): How focused the sensing is. 0 = isotropic (all directions equal), 1 = narrow cone

### Implementation: Gradient Weighting

Rather than computing separate sensors per direction, we weight existing gradients by angular alignment:

```
For each sensory gradient (food, pheromone, social):
1. Compute preferred sensing direction = creature.heading + genome.sensorAngle
2. Compute angle between gradient direction and preferred direction
3. Apply cosine weighting: (1 + cos(relativeAngle)) / 2
4. Interpolate between full sensitivity and weighted sensitivity based on focus
```

This elegantly reuses the existing gradient system while adding directional selectivity.

### Species Sensing Profiles

- **Hunter**: sensorAngle=0 (forward), sensorFocus=0.6 - focused forward cone spots prey ahead
- **Prey**: sensorAngle=π (backward), sensorFocus=0.4 - rear awareness detects approaching predators
- **Grazer**: sensorAngle=0, sensorFocus=0.1 - mostly isotropic, explores food evenly
- **Schooler**: sensorAngle=0, sensorFocus=0.2 - mild forward bias for group coordination

### Combined with Directional Movement

With both Phase 7 (directional movement) and Phase 8 (directional sensing):

- **Hunters become predator-shaped**: High kernelBias (streamlined body) + forward sensorFocus (spot prey ahead) = focused pursuit
- **Prey become evasive**: Low kernelBias (maneuverable) + backward sensorFocus (detect threats behind) = early escape

### Evolutionary Pressure

The asymmetric sensing creates selection pressure:
- Hunters with tighter forward focus catch more prey (better at pursuit)
- Prey with wider rear awareness survive longer (earlier predator detection)
- Over generations, expect hunters to evolve higher focus and prey to evolve backward sensing

### Observing Asymmetric Sensing

Effects are most visible when:
- Comparing Hunter vs Prey behavior near food/threats
- Evolution enabled with high mutation rate (0.15+)
- Mixed population of hunters and prey
- "Avg Focus" stat in Evolution Statistics shows population average

---

## Reflections (Phase 10)

### Predator-Prey Ecosystem Mode

Phase 10 introduces a "Spawn Ecosystem" button that creates mixed populations of hunters and prey. The key additions:

- **Ecosystem mode**: Tracks hunters and prey separately with distinct genomes
- **Predation mechanic**: When hunters overlap prey, prey is consumed and hunter gains energy
- **Population balance**: If all hunters die, new hunters respawn; same for prey
- **Visual differentiation**: Hunters have red sensor cones (forward), prey have blue cones (backward)

### Implementation Challenges

**Genome Assignment Ordering**: Initially, creatures were assigned default genomes before ecosystem genomes could be applied. Fixed by checking `ecosystemMode` first in the evolution step and using a separate `assignEcosystemGenomes()` method.

**Creature Size Detection**: In Flow-Lenia, blobs can merge and split unpredictably. Rather than detecting hunters by mass (unreliable after merging), we track pending hunter/prey counts from the initial spawn and assign the largest unassigned creatures as hunters.

**Predation Difficulty**: Prey have negative social weight (-0.8) and backward sensing, making them effective at evasion. Hunters have positive social weight (1.5) and forward sensing for pursuit. This creates realistic predator-prey dynamics where catching prey is challenging.

### Energy Balance for Hunters

Hunters face unique challenges:
- They can't eat food (foodWeight: 0.0)
- Higher metabolism (0.03 vs 0.025 for prey)
- Must catch prey to survive

To compensate:
- Hunters receive 2x starting energy (mass * 1.0 vs mass * 0.5)
- Predation energy gain is set high (1.5x prey mass)
- Catch radius is generous (sum of both radii)

### Observing Ecosystem Dynamics

The "Spawn Ecosystem" button creates:
- 2 hunters (larger blobs, red forward cones)
- 6 prey (smaller blobs, blue backward cones)

Evolution Statistics panel shows:
- Hunters / Prey counts
- Predation events counter
- Trait averages reflecting the mixed population

### Emergent Behaviors

In practice:
- Prey successfully evade due to backward sensing
- Hunters pursue but catching is difficult
- Prey population can explode if hunters fail
- Population balance respawns extinct species

This creates authentic ecological dynamics where predation is challenging and prey have realistic escape behaviors.

---

## Reflections (Phase 11)

### Creature Memory & Spatial Learning

Phase 11 adds spatial memory to creatures through the `CreatureMemory` class and two new genome parameters:
- **memoryWeight** (0-1): How much past experience influences movement vs current stimuli
- **memoryDecay** (0.98-0.999): How fast memories fade (lower = faster decay)

### Memory Architecture

Each creature maintains a coarse 8x8 spatial memory grid representing the world:
- **Food memories**: Positive associations where food was consumed
- **Danger memories**: Negative associations where predators were nearby

The grid is much smaller than the world, creating "regions" of memory rather than exact positions. This is intentional - it makes memory more robust and generalizable.

### Memory Gradient Integration

Memory influences movement through gradient computation:
1. Compute net memory value at nearby locations (food - danger)
2. Generate gradient pointing toward positive memories / away from negative
3. Blend with existing sensory gradients based on `memoryWeight`

This allows creatures to:
- Return to "favorite feeding grounds" (positive food memories)
- Avoid "danger zones" (negative danger memories from near-predation events)

### Species Memory Profiles

- **Grazer**: memoryWeight=0.6, memoryDecay=0.995 - Strong food memory, returns to feeding spots
- **Prey**: memoryWeight=0.5, memoryDecay=0.98 - Strong danger memory, longer retention of threats
- **Hunter**: memoryWeight=0.4, memoryDecay=0.99 - Moderate memory for prey locations
- **Schooler**: memoryWeight=0.2, memoryDecay=0.995 - Mild memory, prefers social cues

### Memory Inheritance

When creatures reproduce, offspring inherit 50% of parent's memory. This creates "cultural transmission" - offspring know about good/bad locations their parent experienced.

### Implementation Notes

**Recording Food Memories**: In `updateEnergy()`, when food is consumed, the creature records a positive memory at that location. Intensity scales with amount consumed.

**Recording Danger Memories**: In `processPredation()`, when a hunter comes within 2x catch radius of prey, the prey records a danger memory at the hunter's location. Intensity scales inversely with distance.

**Memory Decay**: Called once per frame in `computeSensoryInput()`. All memory values are multiplied by `decayRate`. With decay=0.995, a memory loses ~40% of its strength after 100 frames.

### Evolutionary Dynamics

Memory parameters evolve like other traits:
- Prey that remember danger survive longer → higher memoryWeight should be selected for
- Grazers that remember food locations are more efficient → memory provides advantage
- Too high memoryWeight can be detrimental if memories are outdated

### Observing Memory Effects

Memory effects are subtle but visible when:
- A grazer returns to a corner where it found food before
- Prey consistently avoid certain areas after near-predation
- Creatures show non-random patrol patterns over time

Best observed with:
- Single creature + food enabled (watch for return visits)
- Ecosystem mode with evolution (watch prey avoidance patterns emerge)
