# ClaudesStuff

Creative coding experiments. Focus: artificial life, generative art.

## Current Project: Lenia Explorer

Interactive web-based Lenia - continuous cellular automata producing lifelike creatures.

**Status**: Phase 13 Complete (Emergent Collective Behaviors)

### Running

```bash
open lenia/index.html
# or
npx live-server lenia/
```

### Key Files

- `lenia.js` - Core simulation
- `flow-lenia.js` - Mass-conservative dynamics
- `creatures.js` - Detection, tracking, evolution
- `species.js` - Presets
- `ui.js` - Controls

## Guidelines

- Vanilla JS only, p5.js for rendering
- Test visually after every change
- Commit after major features
- Detailed reflections go in `reflections/` folder

## References

- [Lenia Paper](https://arxiv.org/abs/1812.05433) - Chan, 2018
- [Flow-Lenia Paper](https://arxiv.org/abs/2212.07906) - Plantec et al., 2023
- [Lenia Portal](https://chakazul.github.io/lenia.html)
