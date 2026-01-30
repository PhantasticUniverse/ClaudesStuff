# Phase 15: Parameter Localization & Multi-Species Separation

## The Problem

Creatures in the predator-prey ecosystem were merging into one giant blob instead of maintaining separate identities. Despite implementing:
- Steering-based repulsion
- Territory signals
- Spawn distance increases

...the creatures would still fuse together within seconds, with mass exploding from ~1200 to ~9000.

## Root Cause Discovery

Two issues were discovered:

### 1. Wrong Simulation Mode
The "Ecosystem" tab in the UI uses `multiChannel` (standard multi-channel Lenia), which is **NOT mass-conservative**. The growth function in standard Lenia directly adds/removes mass, causing runaway growth when creatures overlap.

**Solution**: Use "Spawn Ecosystem" button in Single mode with Flow-Lenia enabled. This uses the mass-conservative Flow-Lenia physics.

### 2. Shared Global Parameters
Even with Flow-Lenia, all creatures shared the same global mu/sigma parameters. When creatures overlapped, their combined densities triggered the same growth dynamics, causing them to merge into stable combined patterns.

## Research: Flow Lenia Parameter Localization

Based on the [Flow-Lenia paper](https://arxiv.org/abs/2212.07906) (Plantec et al., ALIFE 2023 Best Paper):

> "Flow Lenia enables the integration of the parameters of the CA update rules within the CA dynamics, making them dynamic and localized, allowing for multi-species simulations, with locally coherent update rules that define properties of the emerging creatures."

Key insight: **Parameters flow with mass**. Each cell stores its own mu/sigma values. When mass moves, parameters move with it. When mass streams merge, parameters are combined via "mixing rules" (weighted average or stochastic sampling).

## Implementation

### 1. Per-Cell Parameter Arrays
```javascript
// In FlowLenia constructor
this.P_mu = new Float32Array(size * size);     // Local growth center
this.P_sigma = new Float32Array(size * size);  // Local growth width
this.newP_mu = new Float32Array(size * size);  // Transport buffer
this.newP_sigma = new Float32Array(size * size);
```

### 2. Parameter Transport (Weighted Average Mixing)
In `transportMass()`, parameters flow with mass:
```javascript
// Transport parameters weighted by mass
newP_mu[destIdx] += sourceMu * mass * weight;
newP_sigma[destIdx] += sourceSigma * mass * weight;

// After transport, compute weighted average
P_mu[i] = newP_mu[i] / newA[i];  // sum(mass*mu) / sum(mass)
P_sigma[i] = newP_sigma[i] / newA[i];
```

### 3. Localized Affinity Computation
```javascript
// In computeAffinity() for ecosystem mode
for (let i = 0; i < size * size; i++) {
    const localMu = P_mu[i];
    const localSigma = P_sigma[i];
    affinity[i] = this.growthWithMorphology(potential[i], localMu, localSigma);
}
```

### 4. Species-Specific Spawning
```javascript
// Hunters: mu=0.24, sigma=0.028
flowLenia.drawBlob(pos.x, pos.y, 14, 0.9, hunterMu, hunterSigma);

// Prey: mu=0.18, sigma=0.035
flowLenia.drawBlob(pos.x, pos.y, 10, 0.85, preyMu, preySigma);
```

### 5. Flow Field Repulsion
Added `applyCreatureRepulsion()` to directly push creature mass apart in the flow field when creatures get too close.

## Results

- **Creatures maintain separation**: No more merging into single blob
- **Mass conservation**: -20% (expected from deaths becoming food)
- **Distinct species behavior**: Hunters and prey operate under different rules

## Remaining Issues

Hunters still die out before catching enough prey. This is an **ecosystem balance issue**, not a merging issue:
- Hunters need to be faster/more effective at catching
- Or prey needs to be slower/less evasive
- Or predation energy reward needs tuning

## Key Lessons

1. **UI modes matter**: Different UI modes can use completely different simulation backends
2. **Mass conservation is essential**: Without it, any overlap triggers runaway growth
3. **Parameter localization enables multi-species**: Global parameters force all creatures into same dynamics
4. **Research implementations help**: The official Flow-Lenia GitHub provided the conceptual framework

## References

- [Flow-Lenia Paper](https://arxiv.org/abs/2212.07906) - Plantec et al., 2023
- [Flow-Lenia GitHub](https://github.com/erwanplantec/FlowLenia) - Official implementation
- [Flow-Lenia Project Page](https://sites.google.com/view/flowlenia/)
