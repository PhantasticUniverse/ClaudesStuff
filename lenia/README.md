# Lenia Explorer

A browser-based interactive simulator for [Lenia](https://chakazul.github.io/lenia.html) - continuous cellular automata that produce lifelike, self-organizing patterns.

## Features

### Core Simulation
- Continuous space, time, and states (smooth values 0-1)
- Toroidal boundary conditions (wrap-around)
- Real-time parameter adjustment

### Kernel Types
- **Ring** (Classic) - The traditional Lenia kernel with configurable peaks
- **Gaussian** - Smooth falloff for diffusion-like behavior
- **Mexican Hat** - Center-surround pattern (Laplacian of Gaussian)
- **Spiral** - Rotating vortex patterns with adjustable arms and tightness
- **Star** - N-fold symmetric organisms with adjustable sharpness
- **Multi-Scale** - Hierarchical detection at multiple distances
- **Anisotropic** - Directional, elongated movement patterns
- **Asymmetric** - Biased kernels for directional drift

### Species Presets
- **Orbium** - The classic Lenia "glider"
- **Geminium** - Self-replicating creature
- **Hydrogeminium** - Fluid, water-like behavior
- **Scutium Gravidus** - Dense shield-like structure

### Flow-Lenia Species (Mass-Conservative)
- **Swimmer** - Streamlined shape with directional movement
- **Amoeba** - Extends pseudopods dynamically
- **Vortex** - Rotating structure maintained by flow
- **Droplet** - Cohesive spherical mass

### Sensory Creatures (AI-Driven)
- **Grazer** - Attracted to food, avoids crowding
- **Schooler** - Forms groups, follows pheromone trails
- **Hunter** - Predator that pursues prey
- **Prey** - Flees from predators, moves erratically

### Multi-Channel Ecosystems
Support for 2-4 interacting species with cross-channel dynamics:
- **Predator & Prey** - Red hunters chase blue prey
- **Symbiotic Pair** - Species that need each other to survive
- **Chemical Signals** - Attraction through gradients
- **Competition** - Two species fighting for space
- **Food Chain** - 3-level ecosystem (plants → herbivores → predators)

### Discovery Tools
- **Parameter Explorer** - Grid search with stability heatmap
- **Evolutionary Search** - Genetic algorithm to discover stable creatures
- **Creature Gallery** - Save and load discoveries (localStorage)

### Evolution & Genetics
- Creatures have genomes controlling behavior and morphology
- Reproduction with mutation when energy threshold reached
- Natural selection through predation and resource competition
- Track trait averages across generations

### Memory & Learning (Phase 11)
- Creatures remember food and danger locations
- Spatial memory influences movement decisions
- Memory inherited by offspring (cultural transmission)

### Bioluminescent Signaling (Phase 12)
- **Alarm signals** - Prey warn others of predators
- **Hunting signals** - Predators coordinate on kills
- **Mating signals** - Attract mates when fertile
- **Territory signals** - Mark defended areas

### Collective Behaviors (Phase 13) ✅ Verified
- **Schooling/Flocking** - Prey align headings like bird murmurations
- **Pack Hunting** - Predators flank prey from multiple angles
- **Homing/Territory** - Creatures return to and defend birthplace
- **Flock Links Overlay** - Visualize flocking neighbor connections

### Recording & Export
- WebM video recording
- GIF export
- PNG screenshots

## Usage

1. Start a local server:
   ```bash
   cd lenia
   python3 -m http.server 8080
   ```

2. Open http://localhost:8080 in your browser

### Controls
- **Space** - Pause/Resume
- **R** - Reset simulation
- **C** - Clear grid
- **S** - Screenshot
- **Click** - Draw
- **Shift+Click** - Erase

### Modes
- **Single** - Classic single-channel Lenia
- **Ecosystem** - Multi-channel with interacting species
- **Discover** - Tools for finding new creatures

## How Lenia Works

Lenia generalizes Conway's Game of Life to continuous values:

1. **Convolution**: Each cell computes a weighted sum of its neighborhood using a kernel
2. **Growth Function**: The potential is mapped through a Gaussian to determine growth/decay
3. **Integration**: `A(t+dt) = clip(A(t) + dt × G(U), 0, 1)`

The parameters μ (growth center) and σ (growth width) control what neighborhood densities promote life.

## Files

- `index.html` - Main page and UI structure
- `lenia.js` - Core simulation and p5.js rendering
- `flow-lenia.js` - Mass-conservative Flow-Lenia dynamics
- `kernels.js` - Kernel generation functions
- `species.js` - Species presets and patterns
- `creatures.js` - Creature detection, tracking, genomes, evolution, memory
- `environment.js` - Food, pheromones, signals, environmental factors
- `multi-channel.js` - Multi-channel simulation and ecosystems
- `explorer.js` - Parameter exploration and evolution
- `recorder.js` - Video and GIF recording
- `ui.js` - UI controls and interactions
- `ARCHITECTURE.md` - Detailed system architecture documentation

## Credits

- Lenia was created by Bert Wang-Chak Chan
- [Original Paper](https://arxiv.org/abs/1812.05433)
- [Lenia Website](https://chakazul.github.io/lenia.html)
