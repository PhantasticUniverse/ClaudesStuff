# ClaudesStuff - Project Context

This repository contains creative coding experiments and explorations developed collaboratively with Claude. The primary focus is on artificial life simulations, generative art, and computational creativity.

## Current Project: Lenia Explorer

Lenia Explorer is an interactive web-based implementation of Lenia, a continuous cellular automaton that produces lifelike artificial creatures.

### Project Status: Phase 3 Complete

- **Phase 1**: Core Lenia simulation with multiple kernel types
- **Phase 2**: Multi-channel ecosystems with interaction matrices, creature discovery tools
- **Phase 3**: Flow-Lenia with mass-conservative dynamics (current)

### Key Files

```
lenia/
├── index.html       # Main UI and layout
├── lenia.js         # Core Lenia class and p5.js setup
├── flow-lenia.js    # Flow-Lenia with mass conservation
├── kernels.js       # Kernel generation (ring, gaussian, spiral, etc.)
├── species.js       # Species presets (including flow species)
├── multi-channel.js # Multi-channel ecosystem simulation
├── explorer.js      # Parameter exploration and evolution
├── recorder.js      # WebM/GIF recording
└── ui.js           # UI controls and handlers
```

### Technical Notes

**Flow-Lenia Algorithm**:
1. Compute potential U = K * A (convolution)
2. Compute affinity map using growth function G(U)
3. Compute flow field F = ∇(affinity) via Sobel filter
4. Transport mass using reintegration tracking (bilinear interpolation)

**Mass Conservation**: Flow-Lenia conserves total mass exactly (within floating-point precision). The mass stats panel shows conservation quality.

### Development Guidelines

- Use p5.js for rendering (loaded from CDN)
- All simulation logic in vanilla JavaScript
- UI uses native DOM elements (no frameworks)
- Parameters should be adjustable via sliders in real-time
- Color maps use interpolated palettes (viridis, plasma, etc.)

### Running Locally

Open `lenia/index.html` in a modern browser. No build step required.

For live reload during development:
```bash
npx live-server lenia/
```

### References

- [Original Lenia Paper](https://arxiv.org/abs/1812.05433) - Chan, 2018
- [Flow-Lenia Paper](https://arxiv.org/abs/2212.07906) - Plantec et al., 2023
- [Lenia Portal](https://chakazul.github.io/lenia.html) - Interactive demos

---

## Collaboration Style

This project evolves through conversational collaboration. Features are discussed, planned, and implemented iteratively. The goal is exploration and learning, not just building software.

Key principles:
- **Curiosity-driven**: Follow interesting directions, even if they deviate from the plan
- **Visual feedback**: Always prioritize being able to see what the simulation is doing
- **Incremental complexity**: Add features one at a time, test, then build on top
- **Conservation laws**: Flow-Lenia demonstrates that constraints (mass conservation) can enable emergent behavior
