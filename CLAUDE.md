# ClaudesStuff - Project Context

Creative coding experiments with Claude. Focus: artificial life, generative art, computational creativity.

## Current Project: Lenia Explorer

Interactive web-based Lenia - continuous cellular automata producing lifelike creatures.

### Status: Phase 7 Complete

1. Core Lenia with multiple kernel types
2. Multi-channel ecosystems
3. Flow-Lenia (mass-conservative)
4. Sensory creatures & environments
5. Evolving creatures - genome inheritance, energy system, reproduction
6. Morphology evolution - kernel parameters (R, μ, σ) are heritable traits
7. **Directional creatures** - kernel bias creates asymmetric, oriented creatures

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
6. Commit and push
7. Then add the next thing

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
