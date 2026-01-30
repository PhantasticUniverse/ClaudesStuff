# Lenia Research Notes

Research findings from tuning the Living Aquarium presets.

## Key Insight: Filled vs Ring Shapes

**The core problem**: Lenia creatures naturally evolve into ring/donut structures over time. This is fundamental physics, not a bug.

### Why Rings Form

From the original Lenia implementation (Chakazul):

1. **Unimodal kernel (single beta)** → Creates filled/blob creatures
2. **Bimodal/Trimodal kernel (multiple beta values)** → Creates ring structures by suppressing inner regions

The standard Lenia `ring` kernel places a bump at `center = p / (peaks + 1)`:
- For 1 peak: bump at distance 0.5 from center → creates a ring
- This means the neighborhood function peaks at mid-radius, not center

### Solution: The 'filled' Kernel (for blob creatures)

Created a new `filled` kernel type in `kernels.js`:
- Uses polynomial bump: `(1 - dist^2)^2`
- Peaks at center (dist=0), tapers smoothly to edge (dist=1)
- Creates disc-shaped neighborhoods that support filled creatures

### Critical Fix: The 'bump4' Kernel (Official Lenia)

**Problem discovered**: Using a simple Gaussian bump for the ring kernel caused Orbium to quickly lose its asymmetry and become a static ring (stopped moving within ~30 generations).

**Root cause**: The official Lenia implementation uses a specific exponential bump function called "bump4":

```javascript
// Official Lenia bump4 kernel formula
exp(4 - 1/(r*(1-r)))  // for 0 < r < 1, else 0
```

This is fundamentally different from a Gaussian bump `exp(-d²/2)`. The bump4 function has:
- Sharper cutoff at the edges (r=0 and r=1)
- A specific shape that creates stable traveling waves
- Zero values exactly at the center and edge (not just approaching zero)

**Solution**: Added the `bump4` kernel type to `kernels.js` and made it the default for Orbium.

**Result**: Orbium now maintains its asymmetric shape and continues moving indefinitely, matching the official Chakazul implementation behavior. Tested stable through 200+ generations with mass holding at ~76.

### Scutium Gravidus Fix: Official Pattern Required

**Problem discovered**: Using a procedurally-generated filled disc pattern caused Scutium Gravidus to immediately die, even with correct parameters (R=13, μ=0.283, σ=0.0369, bump4 kernel).

**Root cause**: Like Orbium, Scutium requires a specific initial pattern structure that matches the growth function's expectations. A simple smooth disc doesn't have the right internal density gradients.

**Solution**: Extracted the official Scutium Gravidus pattern from Chakazul's JavaScript implementation:
- 18x18 matrix of specific density values
- Has a crescent/asymmetric filled disc shape
- Internal structure creates stable traveling wave

**Result**: Scutium Gravidus now maintains its shape and moves as a glider, stable through 387+ generations with mass holding at ~122.7.

### Scutium Gravidus Parameters (Reference)

| Parameter | Scutium Value | Notes |
|-----------|---------------|-------|
| R | 13 | Kernel radius (same as Orbium) |
| mu | 0.283 | Growth function center (higher than Orbium) |
| sigma | 0.0369 | Growth function width (wider than Orbium) |
| dt | 0.1 | Time step |
| kernel | bump4 | Official Lenia kernel |

**Key insight**: Scutium has higher μ (0.283 vs 0.15) and wider σ (0.037 vs 0.017) than Orbium, which allows for a denser, more filled creature shape while still being stable.

### Geminidae Family Fix: quad4 Multi-Peak Kernel Required

**Problem discovered**: Geminium and Hydrogeminium died immediately (Total Mass: 0.0) even with correct parameters.

**Root cause**: The Geminidae family requires a **multi-peak kernel** called `quad4`, NOT the standard `bump4` kernel! The official Chakazul implementation uses notation like `quad4(1,11/12)` for bimodal kernels.

The quad4 kernel creates multiple concentric rings at specified radii:
- Each peak uses the bump4 formula but centered at different radii
- The `betas` array specifies the relative positions/weights of each peak

**Solution**: Implemented the `quad4` kernel type in `kernels.js` and updated both Geminidae species:

### Aerogeminium volitans Parameters (Official)

| Parameter | Value | Notes |
|-----------|-------|-------|
| R | 18 | Kernel radius (larger than Orbium!) |
| kernel | quad4 | Multi-peak kernel |
| betas | [1, 11/12] | Bimodal - two concentric peaks |
| mu | 0.32 | Growth function center |
| sigma | 0.051 | Growth function width |
| dt | 0.1 | Time step |
| pattern | 32x49 | Official pattern extracted from Chakazul |

### Hydrogeminium natans Parameters (Official)

| Parameter | Value | Notes |
|-----------|-------|-------|
| R | 18 | Kernel radius (same as Aerogeminium) |
| kernel | quad4 | Multi-peak kernel |
| betas | [1/2, 1, 2/3] | Trimodal - three concentric peaks |
| mu | 0.26 | Growth function center |
| sigma | 0.036 | Growth function width |
| dt | 0.1 | Time step |
| pattern | 51x55 | Official pattern extracted from Chakazul |

**Key insight**: The Geminidae family uses larger R (18 vs 13) and multi-peak kernels that create complex internal structure enabling self-replication and flowing behaviors.

### Orbium Parameters (Reference)

From [Bert Chan's Lenia paper](https://arxiv.org/abs/1812.05433) and [Wikipedia](https://en.wikipedia.org/wiki/Lenia):

| Parameter | Orbium Value | Notes |
|-----------|--------------|-------|
| R | 13 | Kernel radius |
| mu | 0.15 | Growth function center |
| sigma | 0.017 | Growth function width (very tight!) |
| dt | 0.1 | Time step |

**Critical insight**: Orbium's sigma is very small (0.014-0.017). This tight tolerance creates stable, compact shapes. Larger sigma values (like 0.035-0.05) lead to more unstable morphology.

### Orbium Initial Pattern (Critical!)

The initial pattern matters enormously. A simple circular blob will **NOT** work with tight sigma values - it will collapse and die.

The Orbium requires an **asymmetric ring pattern with a tail** - this is what makes it a "glider" that can move. The official pattern from [Chakazul's GitHub](https://github.com/Chakazul/Lenia/blob/master/Jupyter/Lenia.ipynb) is a 20x20 matrix of specific values.

**Key characteristics of working Orbium pattern:**
- Ring structure (hollow center)
- Asymmetric tail (provides movement direction)
- Values carefully calibrated to match μ=0.15, σ=0.017

**Why simple blobs fail:**
- With tight sigma (0.017), the growth function only activates in a narrow neighborhood density range
- A filled blob has different density gradients than what the growth function expects
- The creature collapses as mass decays faster than it regenerates

### Lenia Species Taxonomy

From research, there are 18 Lenia families with 400+ species discovered:
- Orbidae, Scutidae, Pterifera, Helicidae, Kronidae, Ctenidae
- Circidae, Dentidae, Lapillidae, Quadridae, Volvidae, Bullidae
- Radiidae, Folidae, Geminidae, Uridae

Notable species:
- **Orbium** - Classic glider, like continuous Game of Life
- **Scutium solidus** - "Bug with stomach" - filled form
- **Geminium** - Self-replicating creature
- **Hydrogeminium** - Water-like flowing behavior

## Growth Function

The growth function `G(u)` determines creature behavior:

```javascript
G(u) = 2 * exp(-(u-mu)^2 / (2*sigma^2)) - 1
```

- Returns value in [-1, 1]
- `1` = high affinity (growth)
- `-1` = low affinity (decay)
- `mu` = what neighborhood density promotes growth
- `sigma` = tolerance for density variations

## Flow-Lenia Extension

Flow-Lenia (Plantec et al., 2023) adds mass conservation:
- Standard Lenia: G(U) adds/removes mass directly
- Flow-Lenia: G(U) creates "affinity map" - where mass WANTS to be
- Mass flows via gradient descent toward high-affinity regions
- Total mass is conserved through reintegration tracking

## Preset Categories & Locomotion System

### Architectural Overview

The system has three layers of functionality that build on each other:

1. **Standard Lenia** - Basic cellular automaton with growth/decay
2. **Flow-Lenia** - Adds mass conservation via flow field transport
3. **Sensory System** - Adds creature detection, tracking, and **locomotion**

### Why Locomotion Requires Sensory Mode

**Critical insight**: Flow-Lenia alone does NOT create directed movement! The flow field just makes mass move toward high-affinity regions (where G(U) > 0). For creatures to **swim** in a direction, they need:

1. Creature detection (to know where each creature is)
2. Heading tracking (to know which way it's facing)
3. **Kernel offset modulation** (Phase 16) - shifts the potential field to create asymmetric growth

The locomotion system works by:
- Sampling the potential field from a position offset by the creature's heading
- This makes cells at the "front" see higher potential than cells at the "back"
- Result: Growth at the front, decay at the back → creature moves forward

### Preset Categories

| Category | Mode | Has Locomotion? | Examples |
|----------|------|----------------|----------|
| Standard | Standard Lenia | N/A | Orbium, Geminium, Hydrogeminium, Scutium |
| Flow Passive | Flow only | No | Amoeba, Droplet |
| Flow Active | Flow + Sensory | **Yes** | Swimmer, Vortex |
| Sensory | Flow + Sensory | **Yes** | Grazer, Schooler, Hunter, Prey, Migrant |

### Key Parameters for Locomotion

```javascript
genome: {
    locomotionSpeed: 1.5,  // Pixels of kernel offset per frame (0-3)
    turnRate: 0.1,         // Radians per frame heading can change
    ...
}
```

- **locomotionSpeed**: Higher = faster movement, but less stable shapes
- **turnRate**: Higher = more maneuverable, lower = straighter paths
- Vortex uses high `turnRate` (0.15) to create spiral/circular movement patterns
- Swimmer uses moderate `locomotionSpeed` (1.5) with low `turnRate` (0.08) for steady swimming

## Parameter Tuning Guidelines

### For Peaceful/Slow Creatures
- `flowStrength`: 0.3-0.6 (lower = slower movement)
- `diffusion`: 0.08-0.15 (higher = softer edges)
- `locomotionSpeed`: 0.2-0.5 (slow graceful movement)
- `turnRate`: 0.02-0.06 (gentle direction changes)
- `sigma`: 0.014-0.020 (tight for stability)

### For Active/Fast Creatures
- `flowStrength`: 1.0-1.5
- `diffusion`: 0.04-0.08 (tighter shapes)
- `locomotionSpeed`: 1.0-2.0
- `turnRate`: 0.10-0.20

## Sources

- [Lenia Paper (Chan 2018)](https://arxiv.org/abs/1812.05433)
- [Flow-Lenia Paper (Plantec 2023)](https://arxiv.org/abs/2212.07906)
- [Lenia Portal](https://chakazul.github.io/lenia.html)
- [Lenia Wikipedia](https://en.wikipedia.org/wiki/Lenia)
- [Complexity Explorables](https://chakazul.github.io/lenia-CE/lenia.html)
- [Leniax (Morgan)](https://morgangiraud.medium.com/leniax-f735f878f551)
