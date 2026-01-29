# Phase 14: Migration Patterns & Environmental Dynamics

## Overview

Phase 14 introduces environmental dynamics that drive emergent migration behaviors. Inspired by real-world phenomena like wildebeest migrations and bird seasonal movements, creatures now respond to shifting resources through evolved traits.

## Key Features Implemented

### 1. Seasonal Cycles

Food availability now oscillates sinusoidally, creating pressure for creatures to adapt:
- **Spring**: Peak food availability (phase = 0)
- **Summer**: Declining food
- **Fall**: Trough - food scarcity (phase = π)
- **Winter**: Recovery

Parameters:
- `seasonSpeed`: 0.001-0.01 (how fast seasons change)
- `seasonalAmplitude`: 0-1 (how much food rate varies)

The system modulates `foodSpawnRate` around a base value, creating natural boom-bust cycles.

### 2. Moving Food Zones

3-6 food hotspots that migrate across the world:
- **Circular**: Orbit around world center (most predictable)
- **Linear**: Drift in straight lines with toroidal wrapping
- **Random**: Random walk pattern (least predictable)

Zones concentrate food with smooth quadratic falloff from center, creating localized abundance that creatures can follow.

### 3. Migration Genome Parameters

Three new heritable traits:
- **migrationSensitivity** (0-1): Amplifies following of strong food gradients
- **wanderlust** (0-1): Adds exploration when food is scarce, reduces homing
- **seasonalAdaptation** (0-1): Reserved for future anticipation features

### 4. Migration Trails Visualization

Golden/amber overlay showing where creatures have traveled. Trails decay slowly (0.995 per frame) creating persistent paths that reveal migration patterns over time.

### 5. New "Migrant" Species

Optimized for nomadic lifestyle:
- High memoryWeight (0.7) - remembers good feeding spots
- Low homingStrength (0.05) - not tied to birthplace
- High migrationSensitivity (0.8) - follows food gradients strongly
- High wanderlust (0.7) - explores when hungry

## Design Decisions

### Why Sinusoidal Seasons?

A simple cosine wave creates smooth, predictable transitions that creatures can potentially learn to anticipate. The amplitude parameter allows tuning from subtle variations to extreme feast/famine cycles.

### Migration Sensitivity vs Food Weight

These serve different purposes:
- `foodWeight` affects all food gradient following equally
- `migrationSensitivity` only amplifies *strong* gradients (> 0.05), making creatures more responsive to concentrated food sources like zone centers

### Wanderlust Interaction with Homing

When food is scarce (< 0.3), wanderlust both:
1. Adds random exploration component
2. Reduces homing strength

This creates a natural trade-off: stay safe at home vs. venture out to find food.

## Expected Emergent Behaviors

1. **Mass Migrations**: Groups following moving zones together
2. **Nomadic vs Territorial Split**: Some genomes favor roaming, others defend home
3. **Seasonal Boom/Bust**: Population cycles following food availability
4. **Trail Following**: Creatures following pheromone trails left by successful migrants
5. **Evolution Pressure**: Over generations, migrationSensitivity should increase in seasonal environments

## Testing Checklist

- [x] Seasonal cycle modulates food rate (check stats display)
- [x] Moving zones visible with Zone Centers overlay
- [x] Migration trails show creature travel paths
- [x] Migrant species follows zones when enabled
- [x] Wanderlust causes exploration when food is scarce
- [x] Homing reduced when wanderlust high + food low

## Future Enhancements

1. **Seasonal Adaptation**: Creatures anticipate seasonal changes based on internal clock
2. **Migration Routes**: Learn and remember paths between food zones
3. **Leader Following**: Creatures follow experienced migrants
4. **Weather Events**: Random disruptions to food/zones
5. **Carrying Capacity**: Zone food depletes when too many creatures cluster

## References

- [Wildebeest Migration](https://en.wikipedia.org/wiki/Animal_migration) - 1.7M animals following rainfall
- [Bird Migration](https://en.wikipedia.org/wiki/Bird_migration) - Food-driven seasonal movements
- [Boids Algorithm](https://www.red3d.com/cwr/boids/) - Food-seeking extensions
