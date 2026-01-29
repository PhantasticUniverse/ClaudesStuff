# ClaudesStuff - Project Context

Creative coding experiments with Claude. Focus: artificial life, generative art, computational creativity.

## Current Project: Lenia Explorer

Interactive web-based Lenia - continuous cellular automata producing lifelike creatures.

### Status: Phase 5 Complete

1. Core Lenia with multiple kernel types
2. Multi-channel ecosystems
3. Flow-Lenia (mass-conservative)
4. Sensory creatures & environments
5. **Evolving creatures** - genome inheritance, energy system, reproduction

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
5. Commit and push
6. Then add the next thing

### Parameter Design

- All params adjustable via sliders
- Sane defaults that show interesting behavior
- Ranges that avoid crashes (no div-by-zero, etc.)

---

## References

- [Lenia Paper](https://arxiv.org/abs/1812.05433) - Chan, 2018
- [Flow-Lenia Paper](https://arxiv.org/abs/2212.07906) - Plantec et al., 2023
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
