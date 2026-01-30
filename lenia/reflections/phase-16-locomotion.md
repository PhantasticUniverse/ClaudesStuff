# Phase 16: Creature Locomotion via Kernel Modulation

## Problem Statement

Flow-Lenia creatures had heading/steering intent but couldn't actually translate across the grid. Despite having:
- Sensory inputs computing desired directions
- Steering forces added to the flow field
- Per-creature turn rates and heading updates

Creatures were "swimming in place" - their headings changed to point toward food/zones, but their centroids didn't move.

## Root Cause Analysis

Flow-Lenia's **affinity dynamics** create strong pattern-stabilizing forces that overwhelm steering:

1. The affinity gradient (∇G(U)) pulls mass toward pattern stability
2. Steering forces push mass in the desired direction
3. Net effect: affinity wins, creature stays put

Even with `steeringStrength=10.0` (20x default), creatures remained stationary because the steering force simply couldn't overcome the affinity gradient's desire to maintain the current pattern shape.

## Research Findings

### Sensorimotor Lenia
> "Movement requires patterns growing at front, dying at back"

The key insight: **original Lenia gliders move because of asymmetric kernels**, not external forces. The kernel shape itself creates growth on one side and decay on the other.

### Particle Lenia
Uses direct position updates: `dp/dt = -∇E(p)`

This bypasses CA dynamics entirely by treating creatures as particles with continuous positions.

### Flow-Lenia Paper (Plantec et al. 2023)
The paper focuses on mass conservation, not locomotion. However, the reintegration tracking mechanism preserves whatever forces are applied.

## Solution: Kernel Modulation (Asymmetric Kernel Offset)

Instead of fighting CA dynamics with steering forces, **work with them** by offsetting the kernel based on heading.

### How It Works

```
Standard kernel: Centered, symmetric → stationary pattern
Offset kernel:   Shifted toward heading → pattern propels in that direction
```

By shifting where each cell "looks" for its neighborhood potential:

1. Cells in a creature sample potential from slightly behind their position
2. This makes them "see" what's in front as if it were local
3. Growth function responds to front conditions, not local conditions
4. Result: growth at front edge, decay at back edge
5. Pattern naturally propels itself forward

### Implementation

**Genome parameter:** `locomotionSpeed` (0-3 pixels)
- Controls magnitude of kernel offset
- Higher = faster movement
- Species-specific values for different behaviors

**Flow-Lenia modifications:**

1. `applyCreatureKernelOffsets()` - Computes per-creature offset vectors from heading × locomotionSpeed
2. `applyPotentialOffsets()` - Shifts potential field for each creature's cells using bilinear interpolation
3. `sampleBilinear()` - Helper for smooth sampling at fractional coordinates

**Order in step():**
```
computePotential()           // U = K * A
applyCreatureKernelOffsets() // Compute offsets
applyPotentialOffsets()      // Shift potential
computeAffinity()            // affinity = G(U_shifted)
computeGradient()            // F = ∇(affinity)
```

### Species Locomotion Speeds

| Species | locomotionSpeed | Rationale |
|---------|-----------------|-----------|
| Hunter  | 2.0             | Fast pursuit |
| Prey    | 1.2             | Moderate escape |
| Grazer  | 0.8             | Slow foraging |
| Migrant | 1.5             | Travel-oriented |
| Schooler| 1.0             | Moderate group |

## Why This Approach

| Aspect | Direct Translation | Kernel Modulation |
|--------|-------------------|-------------------|
| Works with CA | ❌ Fights affinity | ✅ Uses affinity |
| Natural motion | ❌ Teleporting feel | ✅ Flowing motion |
| Shape stability | ⚠️ May distort | ✅ Self-maintaining |
| Mass conservation | ✅ Via offset | ✅ Via transport |
| Complexity | Simple | Moderate |

Kernel modulation creates **emergent locomotion** from the same CA dynamics that create creature stability. The pattern propels itself naturally rather than being pushed externally.

## Technical Notes

### Potential Offset Direction
We sample from `(x - dx, y - dy)` where `dx, dy` are the heading-aligned offset. This makes cells "look behind" themselves, effectively seeing what's ahead as local.

Intuition: If a cell looks backward and sees less density, the growth function will create positive growth (trying to fill that space). If it looks backward and sees more density, growth will be negative (trying to empty). This pushes mass forward.

### Bilinear Interpolation
Necessary for smooth motion at fractional pixel offsets. Without it, creatures would jitter at integer boundaries.

### Per-Creature Labels
The offset only applies to cells that belong to a tracked creature (via flood-fill labels). Empty space and untracked mass use standard potential.

## Verification Plan

1. **Basic Movement Test**: Place food to one side of creature, verify centroid moves toward food over 20-50 frames
2. **Migration Test**: Run 2 season cycles with moving zones, verify creature tracks zones
3. **Predator-Prey Test**: Spawn ecosystem, verify hunters catch prey (predation count > 0)
4. **Stability Test**: Run single creature for 1000 frames, verify shape stability and mass conservation

## Future Improvements

1. **Adaptive speed**: Creatures could modulate locomotionSpeed based on energy/urgency
2. **Directional asymmetry**: Different offset magnitudes for forward vs turning
3. **Momentum**: Store velocity and blend with instant heading for smoother paths
4. **Terrain effects**: Environmental factors could modify effective locomotionSpeed

## References

- [Sensorimotor Lenia](https://developmentalsystems.org/sensorimotor-lenia/) - Movement via CA dynamics
- [Particle Lenia](https://google-research.github.io/self-organising-systems/particle-lenia/) - Energy gradient descent
- [Flow-Lenia Paper](https://arxiv.org/abs/2212.07906) - Mass-conservative dynamics
- [Flow-Lenia GitHub](https://github.com/erwanplantec/FlowLenia) - Official implementation
