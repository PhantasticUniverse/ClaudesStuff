# ClaudesStuff

Creative coding experiments. Focus: artificial life, generative art.

## Current Project: Lenia Explorer

Interactive web-based Lenia - continuous cellular automata producing lifelike creatures.

**Status**: Phase 16 Complete (Creature Locomotion via Kernel Modulation)

### Running

```bash
open lenia/index.html
# or
npx live-server lenia/
```

### Ecosystem Mode (IMPORTANT)

To run predator-prey ecosystem with proper mass conservation:
1. Click **"Flow-Lenia"** button (enables mass-conservative dynamics)
2. Click **"Enable Sensors"** (enables creature tracking)
3. Click **"Spawn Ecosystem"** button

**Do NOT use the "Ecosystem" tab** - it uses standard multi-channel Lenia which is not mass-conservative.

### Key Files

- `lenia.js` - Core simulation & rendering
- `flow-lenia.js` - Mass-conservative dynamics, parameter localization
- `creatures.js` - Detection, tracking, evolution, predation
- `species.js` - Genome presets (hunter, prey, grazer, etc.)
- `environment.js` - Food, signals, seasons, migration zones
- `ui.js` - Controls

### Phase 16 Features

- **Kernel Modulation Locomotion**: Creatures move via asymmetric kernel offsets (not steering forces)
- **locomotionSpeed Genome Parameter**: Controls movement speed (0-3 pixels offset)
- **Species-Specific Speeds**: Hunter=2.0, Prey=1.2, Grazer=0.8, Migrant=1.5

### Phase 15 Features

- **Parameter Localization**: Each cell stores mu/sigma values that flow with mass
- **Multi-Species**: Hunters and prey operate under different growth rules
- **Creature Separation**: Flow field repulsion prevents merging
- **Predation**: Hunters can catch and consume prey

## Guidelines

- Vanilla JS only, p5.js for rendering
- Test visually after every change
- Commit after major features
- Detailed reflections go in `reflections/` folder

## References

- [Lenia Paper](https://arxiv.org/abs/1812.05433) - Chan, 2018
- [Flow-Lenia Paper](https://arxiv.org/abs/2212.07906) - Plantec et al., 2023
- [Flow-Lenia GitHub](https://github.com/erwanplantec/FlowLenia) - Official implementation
- [Lenia Portal](https://chakazul.github.io/lenia.html)
