# Phase 17: Living Aquarium - Visual Enhancement & Zen Mode

## Overview

Phase 17 transforms Lenia Explorer into a "Living Aquarium" experience with immersive viewing modes, polished aesthetics, and first-run user guidance.

## Features Implemented

### Zen Mode (Press Z)

Full-screen immersive viewing that hides all UI:
- Removes sidebar and controls
- Centers canvas in viewport
- Enhanced creature glow effects (pulsing)
- Ambient particle system (floating dust/plankton)
- Exit via ESC or clicking anywhere

### New Color Palettes

Five new aesthetically-designed palettes:
- **Bioluminescent**: Deep ocean blues with cyan/magenta highlights
- **Microscopy**: Amber/gold tones like scientific imaging
- **Cosmic**: Purple/pink nebula atmosphere
- **Aurora**: Northern lights greens and teals
- **Ember**: Warm fire/lava reds and oranges

### Preset Scenes

One-click configurations for instant beauty:
- **Peaceful Pond**: Warm aurora colors, slow grazers
- **Deep Ocean**: Bioluminescent, dark atmosphere
- **Microscope**: Scientific amber-gold aesthetic
- **Cosmic Soup**: Nebula creatures in purple space

### Ambient Particle System

Creates depth and atmosphere:
- Floating dust motes/plankton particles
- Parallax-like subtle movement
- Auto-enabled in Zen Mode
- Can be toggled independently

### Screenshot Enhancement

Auto-applied vignette effect for polished captures:
- Darkened corners
- Focus draws to center
- Professional "finished" look

### Welcome Overlay

First-run experience for new users:
- Explains core concepts
- Highlights Zen Mode
- Quick access to preset scenes
- Dismissible, doesn't show on repeat visits

## Bug Fixes During Phase 17

### Swimmer/Vortex Locomotion Fix

**Problem**: Swimmer and Vortex presets weren't actually swimming - they wobbled in place despite descriptions promising movement.

**Root cause**: These presets had `isFlowSpecies: true` but were missing `isSensorySpecies: true`. The Phase 16 locomotion system (kernel modulation) only activates when the Sensory Mode is enabled, which requires `isSensorySpecies: true`.

**Solution**: Added to both presets in `species.js`:
- `isSensorySpecies: true` - Enables creature tracking and locomotion
- `genome.locomotionSpeed` - Swimmer: 1.5, Vortex: 1.0
- Changed kernels to standard types (locomotion comes from offset system, not kernel shape)

**Verification**: Both presets now show visible trails when running, confirming directional movement.

### Initial State Fix

**Problem**: App started running immediately, which could be confusing for first-time users.

**Solution**:
- Set `paused = true` in `lenia.js` initialization
- Initialize pause button text to "Resume" in `ui.js`
- App now starts paused on Standard Lenia with Orbium preset

## Architectural Insights

### Three-Layer System Understanding

The fixes revealed the clear three-layer architecture:

1. **Standard Lenia**: Basic CA with growth/decay. Movement via asymmetric patterns (Orbium glider).

2. **Flow-Lenia**: Adds mass conservation via flow fields. Does NOT create directed movement - mass just flows toward high-affinity regions.

3. **Sensory System**: Adds creature detection, heading tracking, and **kernel modulation locomotion**. This is where directed "swimming" happens.

**Key insight**: Flow-Lenia alone doesn't swim. Locomotion requires the full Sensory stack.

### Preset Category System

Clarified preset categories:

| Category | Flags | Behavior |
|----------|-------|----------|
| Standard | none | CA dynamics only |
| Flow Passive | `isFlowSpecies` | Flow dynamics, wobbles in place |
| Flow Active | `isFlowSpecies` + `isSensorySpecies` | Flow + directed locomotion |
| Sensory | `isFlowSpecies` + `isSensorySpecies` + behaviors | Full ecosystem participation |

## Files Modified

- `lenia.js` - Initial paused state, Zen mode rendering
- `ui.js` - Pause button init, welcome overlay, preset scenes
- `species.js` - Swimmer/Vortex locomotion fixes
- `recorder.js` - Screenshot vignette
- `lenia-research-notes.md` - Documentation updates
- `CLAUDE.md` - Project documentation updates

## Future Considerations

1. **More preset scenes**: Underwater caves, tidal pools, alien worlds
2. **Audio**: Ambient soundscapes for Zen mode
3. **Touch support**: Mobile-friendly Zen mode
4. **Creature galleries**: Save and share discovered creatures
5. **Time-lapse recording**: Compressed evolution videos

## References

- Phase 16 (Locomotion) provided the kernel modulation system
- Flow-Lenia paper for mass conservation mechanics
- Sensorimotor Lenia for asymmetric kernel concepts
