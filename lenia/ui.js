/**
 * UI Controls for Lenia Explorer - Phase 2
 *
 * Handles all interactive controls for:
 * - Single channel mode (classic Lenia)
 * - Multi-channel ecosystem mode
 * - Discovery mode (parameter exploration, evolution)
 * - Recording and export
 */

// Current mode: 'single', 'ecosystem', 'discover'
let currentMode = 'single';

// Multi-channel simulation instance
let multiChannel = null;

// Flow-Lenia instance and state
let flowLenia = null;
let useFlowLenia = false;
let initialMass = 0;

// Phase 4: Environment and creature tracking
let environment = null;
let creatureTracker = null;
let sensoryEnabled = false;

// Phase 5: Evolution
let evolutionEnabled = false;

// Visualization overlay settings
let showFoodOverlay = true;
let showPheromoneOverlay = false;
let showHeadingsOverlay = false;
let showSensorsOverlay = false;
let showFlockingOverlay = false;  // Phase 13: Flock link visualization
let showMigrationTrails = false;  // Phase 14: Migration trail visualization
let showZoneCenters = false;      // Phase 14: Zone center visualization

// Phase 15: Population history for graphing (separate hunter/prey tracking)
let hunterPopulationHistory = [];
let preyPopulationHistory = [];
const POPULATION_HISTORY_LENGTH = 500;

function initUI() {
    // Initialize multi-channel, flow-lenia, and explorer systems
    multiChannel = new MultiChannelLenia(256, 2);
    flowLenia = new FlowLenia(256);

    // Phase 4: Initialize environment and creature tracking
    environment = new Environment(256);
    creatureTracker = new CreatureTracker(256);
    flowLenia.setEnvironment(environment);
    flowLenia.setCreatureTracker(creatureTracker);

    initExplorer();

    // Mode tab switching
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const mode = tab.dataset.mode;
            switchMode(mode);
        });
    });

    // Flow-Lenia mode toggle buttons
    document.getElementById('btn-standard-lenia').addEventListener('click', () => {
        setFlowMode(false);
    });

    document.getElementById('btn-flow-lenia').addEventListener('click', () => {
        setFlowMode(true);
    });

    // Flow parameter sliders
    setupSlider('flow-strength', (value) => {
        if (flowLenia) {
            flowLenia.flowStrength = parseFloat(value);
        }
    });

    setupSlider('flow-diffusion', (value) => {
        if (flowLenia) {
            flowLenia.diffusion = parseFloat(value);
        }
    });

    // Phase 4: Sensory mode toggle
    document.getElementById('btn-sensory-off').addEventListener('click', () => {
        setSensoryMode(false);
    });

    document.getElementById('btn-sensory-on').addEventListener('click', () => {
        setSensoryMode(true);
    });

    // Phase 4: Environment controls
    setupSlider('food-spawn', (value) => {
        if (environment) {
            environment.params.foodSpawnRate = parseFloat(value);
        }
    });

    setupSlider('pheromone-decay', (value) => {
        if (environment) {
            environment.params.pheromoneDecayRate = parseFloat(value);
        }
    });

    setupSlider('current-strength', (value) => {
        if (environment) {
            environment.params.currentStrength = parseFloat(value);
        }
    });

    setupSlider('current-angle', (value) => {
        if (environment) {
            environment.params.currentAngle = parseFloat(value) * Math.PI / 180;
        }
    });

    document.getElementById('btn-add-food').addEventListener('click', () => {
        if (environment) {
            // Add food at random locations
            for (let i = 0; i < 5; i++) {
                environment.addFood(
                    Math.random() * environment.size,
                    Math.random() * environment.size,
                    0.8,
                    15
                );
            }
        }
    });

    document.getElementById('btn-reset-env').addEventListener('click', () => {
        if (environment) {
            environment.reset();
        }
    });

    // Phase 4: Creature behavior controls
    setupSlider('food-weight', (value) => {
        if (creatureTracker) {
            creatureTracker.sensory.foodWeight = parseFloat(value);
        }
    });

    setupSlider('pheromone-weight', (value) => {
        if (creatureTracker) {
            creatureTracker.sensory.pheromoneWeight = parseFloat(value);
        }
    });

    setupSlider('social-weight', (value) => {
        if (creatureTracker) {
            creatureTracker.sensory.socialWeight = parseFloat(value);
        }
    });

    setupSlider('turn-rate', (value) => {
        if (creatureTracker) {
            creatureTracker.sensory.turnRate = parseFloat(value);
        }
    });

    setupSlider('steering-strength', (value) => {
        if (flowLenia) {
            flowLenia.steeringStrength = parseFloat(value);
        }
    });

    document.getElementById('btn-predator-mode').addEventListener('click', () => {
        if (creatureTracker) {
            creatureTracker.sensory.isPredator = !creatureTracker.sensory.isPredator;
            const btn = document.getElementById('btn-predator-mode');
            if (creatureTracker.sensory.isPredator) {
                btn.classList.add('primary');
                btn.textContent = 'Predator: ON';
            } else {
                btn.classList.remove('primary');
                btn.textContent = 'Predator Mode';
            }
        }
    });

    // Phase 4: Visualization overlay toggles
    document.getElementById('btn-show-food').addEventListener('click', () => {
        showFoodOverlay = !showFoodOverlay;
        const btn = document.getElementById('btn-show-food');
        btn.classList.toggle('primary', showFoodOverlay);
    });

    document.getElementById('btn-show-pheromone').addEventListener('click', () => {
        showPheromoneOverlay = !showPheromoneOverlay;
        const btn = document.getElementById('btn-show-pheromone');
        btn.classList.toggle('primary', showPheromoneOverlay);
    });

    document.getElementById('btn-show-headings').addEventListener('click', () => {
        showHeadingsOverlay = !showHeadingsOverlay;
        const btn = document.getElementById('btn-show-headings');
        btn.classList.toggle('primary', showHeadingsOverlay);
    });

    document.getElementById('btn-show-sensors').addEventListener('click', () => {
        showSensorsOverlay = !showSensorsOverlay;
        const btn = document.getElementById('btn-show-sensors');
        btn.classList.toggle('primary', showSensorsOverlay);
    });

    // Phase 13: Flock link visualization toggle
    document.getElementById('btn-show-flocking').addEventListener('click', () => {
        showFlockingOverlay = !showFlockingOverlay;
        const btn = document.getElementById('btn-show-flocking');
        btn.classList.toggle('primary', showFlockingOverlay);
    });

    // Phase 14: Migration trail visualization toggle
    document.getElementById('btn-show-migration-trails').addEventListener('click', () => {
        showMigrationTrails = !showMigrationTrails;
        const btn = document.getElementById('btn-show-migration-trails');
        btn.classList.toggle('primary', showMigrationTrails);
    });

    // Phase 14: Zone centers visualization toggle
    document.getElementById('btn-show-zones').addEventListener('click', () => {
        showZoneCenters = !showZoneCenters;
        const btn = document.getElementById('btn-show-zones');
        btn.classList.toggle('primary', showZoneCenters);
    });

    // Phase 12: Signal visualization toggles
    document.getElementById('btn-show-alarm').addEventListener('click', () => {
        showAlarmSignals = !showAlarmSignals;
        const btn = document.getElementById('btn-show-alarm');
        btn.classList.toggle('primary', showAlarmSignals);
    });

    document.getElementById('btn-show-hunting').addEventListener('click', () => {
        showHuntingSignals = !showHuntingSignals;
        const btn = document.getElementById('btn-show-hunting');
        btn.classList.toggle('primary', showHuntingSignals);
    });

    document.getElementById('btn-show-mating').addEventListener('click', () => {
        showMatingSignals = !showMatingSignals;
        const btn = document.getElementById('btn-show-mating');
        btn.classList.toggle('primary', showMatingSignals);
    });

    document.getElementById('btn-show-territory').addEventListener('click', () => {
        showTerritorySignals = !showTerritorySignals;
        const btn = document.getElementById('btn-show-territory');
        btn.classList.toggle('primary', showTerritorySignals);
    });

    document.getElementById('btn-show-all-signals').addEventListener('click', () => {
        showAlarmSignals = true;
        showHuntingSignals = true;
        showMatingSignals = true;
        showTerritorySignals = true;
        document.getElementById('btn-show-alarm').classList.add('primary');
        document.getElementById('btn-show-hunting').classList.add('primary');
        document.getElementById('btn-show-mating').classList.add('primary');
        document.getElementById('btn-show-territory').classList.add('primary');
    });

    document.getElementById('btn-hide-all-signals').addEventListener('click', () => {
        showAlarmSignals = false;
        showHuntingSignals = false;
        showMatingSignals = false;
        showTerritorySignals = false;
        document.getElementById('btn-show-alarm').classList.remove('primary');
        document.getElementById('btn-show-hunting').classList.remove('primary');
        document.getElementById('btn-show-mating').classList.remove('primary');
        document.getElementById('btn-show-territory').classList.remove('primary');
    });

    // Phase 14: Seasonal cycle toggle
    document.getElementById('btn-seasons-off').addEventListener('click', () => {
        setSeasonalMode(false);
    });

    document.getElementById('btn-seasons-on').addEventListener('click', () => {
        setSeasonalMode(true);
    });

    // Phase 14: Moving zones toggle
    document.getElementById('btn-zones-off').addEventListener('click', () => {
        setZonesMode(false);
    });

    document.getElementById('btn-zones-on').addEventListener('click', () => {
        setZonesMode(true);
    });

    // Phase 14: Season speed slider
    setupSlider('season-speed', (value) => {
        if (environment) {
            environment.params.seasonSpeed = parseFloat(value);
        }
    });

    // Phase 14: Seasonal amplitude slider
    setupSlider('seasonal-amplitude', (value) => {
        if (environment) {
            environment.params.seasonalAmplitude = parseFloat(value);
        }
    });

    // Phase 14: Zone pattern select
    const zonePatternSelect = document.getElementById('zone-pattern');
    if (zonePatternSelect) {
        zonePatternSelect.addEventListener('change', (e) => {
            if (environment) {
                environment.params.zoneMovementPattern = e.target.value;
                environment.initializeMigrationZones();
            }
        });
    }

    // Phase 14: Zone speed slider
    setupSlider('zone-speed', (value) => {
        if (environment) {
            environment.params.zoneMovementSpeed = parseFloat(value);
        }
    });

    // Phase 14: Number of zones slider
    setupSlider('num-zones', (value) => {
        if (environment) {
            environment.params.numMigrationZones = parseInt(value);
            environment.initializeMigrationZones();
        }
    });

    // Phase 5: Evolution mode toggle
    document.getElementById('btn-evolution-off').addEventListener('click', () => {
        setEvolutionMode(false);
    });

    document.getElementById('btn-evolution-on').addEventListener('click', () => {
        setEvolutionMode(true);
    });

    // Phase 10: Spawn Ecosystem button
    document.getElementById('btn-spawn-ecosystem').addEventListener('click', () => {
        if (flowLenia && creatureTracker) {
            // Clear and setup
            flowLenia.clear();
            environment.reset();
            environment.initializeFood();

            // Spawn mixed ecosystem
            creatureTracker.spawnEcosystem(flowLenia, 2, 6);
            initialMass = flowLenia.totalMass();

            // Enable flow mode and sensory mode if not already
            if (!useFlowLenia) {
                setFlowMode(true);
            }
            if (!sensoryEnabled) {
                setSensoryMode(true);
            }
            if (!evolutionEnabled) {
                setEvolutionMode(true);
            }

            generation = 0;
            updateMassStats();
        }
    });

    // Phase 5: Evolution controls
    setupSlider('mutation-rate', (value) => {
        if (creatureTracker) {
            creatureTracker.evolution.mutationRate = parseFloat(value);
        }
    });

    setupSlider('metabolism-rate', (value) => {
        if (creatureTracker) {
            creatureTracker.evolution.baseMetabolism = parseFloat(value);
        }
    });

    setupSlider('reproduction-threshold', (value) => {
        if (creatureTracker) {
            creatureTracker.evolution.reproductionThreshold = parseFloat(value);
        }
    });

    setupSlider('max-population', (value) => {
        if (creatureTracker) {
            creatureTracker.evolution.maxPopulation = parseInt(value);
        }
    });

    setupSlider('food-energy', (value) => {
        if (creatureTracker) {
            creatureTracker.evolution.foodEnergyGain = parseFloat(value);
        }
    });

    // Species select
    const speciesSelect = document.getElementById('species-select');
    speciesSelect.addEventListener('change', (e) => {
        if (e.target.value !== 'custom') {
            const speciesKey = e.target.value;
            const species = Species[speciesKey];

            // Check if this is a flow species and switch mode accordingly
            if (species && species.params.isFlowSpecies) {
                setFlowMode(true);
                flowLenia.loadSpecies(speciesKey);
                initialMass = flowLenia.totalMass();

                // Check if this is a sensory species
                if (species.params.isSensorySpecies) {
                    setSensoryMode(true);

                    // Apply sensory parameters if available
                    if (species.params.sensory && creatureTracker) {
                        Object.assign(creatureTracker.sensory, species.params.sensory);
                        syncSensoryUI();
                    }

                    // Apply environment parameters if available
                    if (species.params.environment && environment) {
                        Object.assign(environment.params, species.params.environment);
                        syncEnvironmentUI();
                    }

                    // Phase 5: Apply genome parameters if available
                    if (species.params.genome && creatureTracker) {
                        // Store base genome for new creatures
                        creatureTracker.baseGenome = new Genome(species.params.genome);
                    }
                }
            } else {
                // For standard species, can use either mode
                if (useFlowLenia) {
                    flowLenia.loadSpecies(speciesKey);
                    initialMass = flowLenia.totalMass();
                } else {
                    lenia.loadSpecies(speciesKey);
                }
            }
            generation = 0;
            syncUIToParams();
        }
    });

    // Ecosystem select
    const ecosystemSelect = document.getElementById('ecosystem-select');
    ecosystemSelect.addEventListener('change', (e) => {
        multiChannel.loadEcosystem(e.target.value);
        generation = 0;
        updateInteractionMatrix();
        updateChannelTabs();
    });

    // Channel tabs
    document.getElementById('channel-tabs').addEventListener('click', (e) => {
        if (e.target.classList.contains('channel-tab')) {
            const channel = parseInt(e.target.dataset.channel);
            multiChannel.activeChannel = channel;
            updateChannelTabs();
        }
    });

    // Kernel type selector
    const kernelTypeSelect = document.getElementById('kernel-type');
    kernelTypeSelect.addEventListener('change', (e) => {
        if (currentMode === 'single') {
            if (useFlowLenia) {
                flowLenia.kernelType = e.target.value;
                flowLenia.updateKernel();
            } else {
                lenia.kernelType = e.target.value;
                lenia.updateKernel();
            }
        } else {
            const ch = multiChannel.activeChannel;
            multiChannel.channelParams[ch].kernelType = e.target.value;
            multiChannel.updateChannelKernel(ch);
        }
        updateKernelParamsVisibility();
        updateKernelPreview();
        setSpeciesCustom();
    });

    // Kernel parameters
    setupSlider('kernel-radius', (value) => {
        if (currentMode === 'single') {
            if (useFlowLenia) {
                flowLenia.R = parseInt(value);
                flowLenia.updateKernel();
            } else {
                lenia.R = parseInt(value);
                lenia.updateKernel();
            }
        } else {
            const ch = multiChannel.activeChannel;
            multiChannel.channelParams[ch].R = parseInt(value);
            multiChannel.updateChannelKernel(ch);
        }
        updateKernelPreview();
        setSpeciesCustom();
    });

    setupSlider('kernel-peaks', (value) => {
        if (currentMode === 'single') {
            if (useFlowLenia) {
                flowLenia.peaks = parseInt(value);
                flowLenia.updateKernel();
            } else {
                lenia.peaks = parseInt(value);
                lenia.updateKernel();
            }
        } else {
            const ch = multiChannel.activeChannel;
            multiChannel.channelParams[ch].peaks = parseInt(value);
            multiChannel.updateChannelKernel(ch);
        }
        updateKernelPreview();
        setSpeciesCustom();
    });

    // Spiral params
    setupSlider('spiral-arms', (value) => {
        const params = currentMode === 'single'
            ? (useFlowLenia ? flowLenia.kernelParams : lenia.kernelParams)
            : multiChannel.channelParams[multiChannel.activeChannel].kernelParams;
        params.arms = parseInt(value);
        if (currentMode === 'single') {
            if (useFlowLenia) {
                flowLenia.updateKernel();
            } else {
                lenia.updateKernel();
            }
        } else {
            multiChannel.updateChannelKernel(multiChannel.activeChannel);
        }
        updateKernelPreview();
        setSpeciesCustom();
    });

    setupSlider('spiral-tightness', (value) => {
        const params = currentMode === 'single'
            ? (useFlowLenia ? flowLenia.kernelParams : lenia.kernelParams)
            : multiChannel.channelParams[multiChannel.activeChannel].kernelParams;
        params.tightness = parseFloat(value);
        if (currentMode === 'single') {
            if (useFlowLenia) {
                flowLenia.updateKernel();
            } else {
                lenia.updateKernel();
            }
        } else {
            multiChannel.updateChannelKernel(multiChannel.activeChannel);
        }
        updateKernelPreview();
        setSpeciesCustom();
    });

    // Star params
    setupSlider('star-points', (value) => {
        const params = currentMode === 'single'
            ? (useFlowLenia ? flowLenia.kernelParams : lenia.kernelParams)
            : multiChannel.channelParams[multiChannel.activeChannel].kernelParams;
        params.points = parseInt(value);
        if (currentMode === 'single') {
            if (useFlowLenia) {
                flowLenia.updateKernel();
            } else {
                lenia.updateKernel();
            }
        } else {
            multiChannel.updateChannelKernel(multiChannel.activeChannel);
        }
        updateKernelPreview();
        setSpeciesCustom();
    });

    setupSlider('star-sharpness', (value) => {
        const params = currentMode === 'single'
            ? (useFlowLenia ? flowLenia.kernelParams : lenia.kernelParams)
            : multiChannel.channelParams[multiChannel.activeChannel].kernelParams;
        params.sharpness = parseFloat(value);
        if (currentMode === 'single') {
            if (useFlowLenia) {
                flowLenia.updateKernel();
            } else {
                lenia.updateKernel();
            }
        } else {
            multiChannel.updateChannelKernel(multiChannel.activeChannel);
        }
        updateKernelPreview();
        setSpeciesCustom();
    });

    // Anisotropic params
    setupSlider('aniso-angle', (value) => {
        const params = currentMode === 'single'
            ? (useFlowLenia ? flowLenia.kernelParams : lenia.kernelParams)
            : multiChannel.channelParams[multiChannel.activeChannel].kernelParams;
        params.angle = parseFloat(value) * Math.PI / 180;
        if (currentMode === 'single') {
            if (useFlowLenia) {
                flowLenia.updateKernel();
            } else {
                lenia.updateKernel();
            }
        } else {
            multiChannel.updateChannelKernel(multiChannel.activeChannel);
        }
        updateKernelPreview();
        setSpeciesCustom();
    });

    setupSlider('aniso-eccentricity', (value) => {
        const params = currentMode === 'single'
            ? (useFlowLenia ? flowLenia.kernelParams : lenia.kernelParams)
            : multiChannel.channelParams[multiChannel.activeChannel].kernelParams;
        params.eccentricity = parseFloat(value);
        if (currentMode === 'single') {
            if (useFlowLenia) {
                flowLenia.updateKernel();
            } else {
                lenia.updateKernel();
            }
        } else {
            multiChannel.updateChannelKernel(multiChannel.activeChannel);
        }
        updateKernelPreview();
        setSpeciesCustom();
    });

    // Asymmetric bias
    setupSlider('asymmetric-bias', (value) => {
        const params = currentMode === 'single'
            ? (useFlowLenia ? flowLenia.kernelParams : lenia.kernelParams)
            : multiChannel.channelParams[multiChannel.activeChannel].kernelParams;
        params.bias = parseFloat(value);
        if (currentMode === 'single') {
            if (useFlowLenia) {
                flowLenia.updateKernel();
            } else {
                lenia.updateKernel();
            }
        } else {
            multiChannel.updateChannelKernel(multiChannel.activeChannel);
        }
        updateKernelPreview();
        setSpeciesCustom();
    });

    // Growth function parameters
    setupSlider('growth-mu', (value) => {
        if (currentMode === 'single') {
            if (useFlowLenia) {
                flowLenia.mu = parseFloat(value);
            } else {
                lenia.mu = parseFloat(value);
            }
        } else {
            multiChannel.channelParams[multiChannel.activeChannel].mu = parseFloat(value);
        }
        setSpeciesCustom();
    });

    setupSlider('growth-sigma', (value) => {
        if (currentMode === 'single') {
            if (useFlowLenia) {
                flowLenia.sigma = parseFloat(value);
            } else {
                lenia.sigma = parseFloat(value);
            }
        } else {
            multiChannel.channelParams[multiChannel.activeChannel].sigma = parseFloat(value);
        }
        setSpeciesCustom();
    });

    // Simulation parameters
    setupSlider('dt', (value) => {
        if (currentMode === 'single') {
            if (useFlowLenia) {
                flowLenia.dt = parseFloat(value);
            } else {
                lenia.dt = parseFloat(value);
            }
        } else {
            multiChannel.dt = parseFloat(value);
        }
        setSpeciesCustom();
    });

    setupSlider('grid-size', (value) => {
        const newSize = parseInt(value);
        lenia.resize(newSize);
        flowLenia.resize(newSize);
        // Also resize multi-channel if needed
        if (multiChannel.size !== newSize) {
            multiChannel = new MultiChannelLenia(newSize, multiChannel.numChannels);
        }
    });

    // Brush size
    setupSlider('brush-size', () => {});

    // Color scheme
    const colorSelect = document.getElementById('color-scheme');
    colorSelect.addEventListener('change', (e) => {
        lenia.colorMap = e.target.value;
        updateColorPreview();
    });
    updateColorPreview();

    // Control Buttons
    document.getElementById('btn-pause').addEventListener('click', () => {
        paused = !paused;
        document.getElementById('btn-pause').textContent = paused ? 'Resume' : 'Pause';
    });

    document.getElementById('btn-step').addEventListener('click', () => {
        paused = true;
        document.getElementById('btn-pause').textContent = 'Resume';
        if (currentMode === 'ecosystem') {
            multiChannel.step();
        } else if (useFlowLenia) {
            flowLenia.step();
            updateMassStats();
        } else {
            lenia.step();
        }
        generation++;
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        if (currentMode === 'ecosystem') {
            const ecosystemSelect = document.getElementById('ecosystem-select');
            multiChannel.loadEcosystem(ecosystemSelect.value);
        } else {
            resetSimulation();
            if (useFlowLenia) {
                initialMass = flowLenia.totalMass();
                updateMassStats();
            }
        }
        generation = 0;
    });

    document.getElementById('btn-clear').addEventListener('click', () => {
        if (currentMode === 'ecosystem') {
            multiChannel.clear();
        } else if (useFlowLenia) {
            flowLenia.clear();
            initialMass = 0;
            updateMassStats();
        } else {
            lenia.clear();
        }
        generation = 0;
    });

    document.getElementById('btn-random').addEventListener('click', () => {
        if (currentMode === 'ecosystem') {
            multiChannel.randomize();
        } else if (useFlowLenia) {
            flowLenia.randomize();
            initialMass = flowLenia.totalMass();
            updateMassStats();
        } else {
            lenia.randomize();
        }
        generation = 0;
    });

    // Recording controls
    setupSlider('record-duration', () => {});

    document.getElementById('btn-record-webm').addEventListener('click', () => {
        startWebMRecording();
    });

    document.getElementById('btn-record-gif').addEventListener('click', () => {
        startGifRecording();
    });

    document.getElementById('btn-screenshot').addEventListener('click', () => {
        saveScreenshot();
    });

    // Discovery controls
    setupSlider('evo-gens', () => {});

    document.getElementById('btn-grid-search').addEventListener('click', () => {
        startGridSearch();
    });

    document.getElementById('btn-stop-search').addEventListener('click', () => {
        if (parameterExplorer) {
            parameterExplorer.stop();
        }
    });

    document.getElementById('btn-evolve').addEventListener('click', () => {
        startEvolution();
    });

    document.getElementById('btn-stop-evolve').addEventListener('click', () => {
        if (evolutionarySearch) {
            evolutionarySearch.stop();
        }
    });

    document.getElementById('btn-save-discovery').addEventListener('click', () => {
        saveDiscovery();
    });

    document.getElementById('btn-export-gallery').addEventListener('click', () => {
        if (creatureGallery) {
            creatureGallery.export();
        }
    });

    // Draw mode buttons
    document.getElementById('btn-draw-creature').addEventListener('click', () => {
        const pattern = Species.createBlob(8);
        if (currentMode === 'ecosystem') {
            const ch = multiChannel.activeChannel;
            const cx = Math.floor(multiChannel.size / 2);
            const cy = Math.floor(multiChannel.size / 2);
            multiChannel.drawBlob(ch, cx, cy, 10, 1);
        } else {
            Species.placePattern(
                lenia.grid,
                lenia.size,
                pattern,
                Math.floor(lenia.size / 2),
                Math.floor(lenia.size / 2)
            );
        }
    });

    document.getElementById('btn-draw-erase').addEventListener('click', () => {
        alert('Shift+Click to erase, or just click to draw');
    });

    // Initialize UI values and visibility
    syncUIToParams();
    updateInteractionMatrix();
    updateGalleryList();

    // Living Aquarium: Zen Mode button
    const zenBtn = document.getElementById('btn-zen-mode');
    if (zenBtn) {
        zenBtn.addEventListener('click', () => {
            if (typeof toggleZenMode === 'function') {
                toggleZenMode();
            }
        });
    }

    // Living Aquarium: Preset scene buttons
    document.querySelectorAll('.scene-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const scene = btn.dataset.scene;
            loadPresetScene(scene);
        });
    });

    // Initialize pause button to correct state (starts paused)
    document.getElementById('btn-pause').textContent = 'Resume';

    // Living Aquarium: Welcome overlay (first-run experience)
    initWelcomeOverlay();
}

/**
 * Living Aquarium: Preset Scenes
 * Each scene combines color palette, species, and environment settings
 */
const PresetScenes = {
    'peaceful-pond': {
        name: 'Peaceful Pond',
        colorMap: 'aurora',
        species: 'grazer',
        flowStrength: 0.5,           // Slow, drifting movement
        diffusion: 0.12,             // Moderate diffusion for soft edges
        foodSpawnRate: 0.003,
        creatureCount: 5,            // Multiple peaceful creatures
        creatureSpacing: 50,         // Well-spaced, not crowded
        description: 'Slow grazers in a warm, green pond',
        // Kernel type for this scene
        kernelType: 'filled',        // New filled kernel for blob-like shapes
        // Species overrides for extra-peaceful behavior
        speciesOverrides: {
            locomotionSpeed: 0.3,    // Slow graceful movement
            turnRate: 0.04,          // Very gentle turns
            growthMu: 0.15,          // Orbium-like growth center
            growthSigma: 0.018       // Tight sigma for stable shape
        }
    },
    'deep-ocean': {
        name: 'Deep Ocean',
        colorMap: 'bioluminescent',
        species: 'schooler',
        flowStrength: 0.7,           // Gentle flow for graceful movement
        diffusion: 0.06,             // Tight cohesive shapes that glow well
        foodSpawnRate: 0.0015,
        creatureCount: 7,            // School of creatures
        creatureSpacing: 35,         // Closer for schooling effect
        description: 'Glowing creatures in the abyss',
        speciesOverrides: {
            locomotionSpeed: 0.8,    // Moderate, graceful speed
            alignmentWeight: 0.7,    // Strong schooling behavior
            flockingRadius: 50,      // Large flocking awareness
            turnRate: 0.12           // Smooth coordinated turns
        }
    },
    'microscope': {
        name: 'Microscope',
        colorMap: 'microscopy',
        species: 'amoeba',
        flowStrength: 0.6,           // Slow organic flow
        diffusion: 0.18,             // High diffusion for blobby amoeba shapes
        foodSpawnRate: 0.0025,
        creatureCount: 4,            // A few distinct organisms
        creatureSpacing: 55,         // Room to observe each
        description: 'Watching life under a lens',
        speciesOverrides: {
            locomotionSpeed: 0.5,    // Slow amoeba crawl
            turnRate: 0.08,          // Gradual direction changes
            growthSigma: 0.04        // Very soft blobby edges
        }
    },
    'cosmic-soup': {
        name: 'Cosmic Soup',
        colorMap: 'cosmic',
        species: 'vortex',
        flowStrength: 1.2,           // Strong flow for swirling motion
        diffusion: 0.05,             // Tight spiral structures
        foodSpawnRate: 0.0015,
        creatureCount: 5,            // Multiple swirling forms
        creatureSpacing: 50,         // Space for spirals to develop
        description: 'Nebular life forms swirl in space',
        speciesOverrides: {
            locomotionSpeed: 1.0,    // Moderate speed
            turnRate: 0.15           // Smooth spiral motion
        }
    }
};

/**
 * Load a preset scene
 */
function loadPresetScene(sceneId) {
    const scene = PresetScenes[sceneId];
    if (!scene) return;

    // Switch to Flow-Lenia mode
    setFlowMode(true);

    // Apply color palette
    const colorSelect = document.getElementById('color-scheme');
    if (colorSelect && ColorMaps[scene.colorMap]) {
        colorSelect.value = scene.colorMap;
        lenia.colorMap = scene.colorMap;
        if (flowLenia) flowLenia.colorMap = scene.colorMap;
        updateColorPreview();
    }

    // Apply flow parameters
    if (flowLenia) {
        flowLenia.flowStrength = scene.flowStrength;
        flowLenia.diffusion = scene.diffusion;
        setSliderValue('flow-strength', scene.flowStrength);
        setSliderValue('flow-diffusion', scene.diffusion);
    }

    // Apply environment settings
    if (environment) {
        environment.params.foodSpawnRate = scene.foodSpawnRate;
        setSliderValue('food-spawn', scene.foodSpawnRate);
        environment.reset();
        environment.initializeFood();
    }

    // Get species data
    const speciesSelect = document.getElementById('species-select');
    const speciesData = Species[scene.species];

    if (speciesSelect && speciesData) {
        speciesSelect.value = scene.species;

        // Clear the grid for fresh spawn
        flowLenia.clear();

        // Load species first to set kernel type and parameters
        flowLenia.loadSpecies(scene.species);

        // Override with scene-specific parameters
        flowLenia.flowStrength = scene.flowStrength;
        flowLenia.diffusion = scene.diffusion;

        // Override kernel type if specified in scene
        if (scene.kernelType) {
            flowLenia.kernelType = scene.kernelType;
            flowLenia.updateKernel();
        }

        // Enable sensory mode for sensory species
        if (speciesData.params.isSensorySpecies) {
            setSensoryMode(true);
        }

        // Spawn multiple creatures if specified
        const count = scene.creatureCount || 1;
        const spacing = scene.creatureSpacing || 50;
        const size = flowLenia.size;

        // Get growth parameters (with overrides if specified)
        const baseMu = scene.speciesOverrides?.growthMu || speciesData.params.mu;
        const baseSigma = scene.speciesOverrides?.growthSigma || speciesData.params.sigma;

        // Apply growth function overrides to the simulation
        if (scene.speciesOverrides?.growthMu !== undefined) {
            flowLenia.mu = scene.speciesOverrides.growthMu;
        }
        if (scene.speciesOverrides?.growthSigma !== undefined) {
            flowLenia.sigma = scene.speciesOverrides.growthSigma;
        }

        // Track positions to avoid overlap
        const positions = [];

        // Clear again before spawning (loadSpecies may have placed a pattern)
        flowLenia.clear();

        for (let i = 0; i < count; i++) {
            // Find a valid spawn position
            let x, y;
            let attempts = 0;
            do {
                x = 30 + Math.random() * (size - 60);
                y = 30 + Math.random() * (size - 60);
                attempts++;
            } while (attempts < 50 && positions.some(p => {
                const dx = Math.abs(p.x - x);
                const dy = Math.abs(p.y - y);
                const wdx = Math.min(dx, size - dx);
                const wdy = Math.min(dy, size - dy);
                return Math.sqrt(wdx*wdx + wdy*wdy) < spacing;
            }));

            positions.push({ x, y });

            // Draw creature blob with higher intensity for more filled appearance
            flowLenia.drawBlob(x, y, 14, 1.0, baseMu, baseSigma);
        }

        initialMass = flowLenia.totalMass();

        // Apply species overrides to creature tracker if present
        if (scene.speciesOverrides && creatureTracker) {
            // Create a modified genome for this preset
            const baseGenome = speciesData.params.genome || {};
            const modifiedGenome = { ...baseGenome, ...scene.speciesOverrides };
            creatureTracker.baseGenome = new Genome(modifiedGenome);

            // Update sensory params
            if (scene.speciesOverrides.turnRate !== undefined) {
                creatureTracker.sensory.turnRate = scene.speciesOverrides.turnRate;
                setSliderValue('turn-rate', scene.speciesOverrides.turnRate);
            }
        }
    }

    generation = 0;
    syncUIToParams();
}

/**
 * Initialize the welcome overlay (first-run experience)
 */
function initWelcomeOverlay() {
    // Check if this is the user's first visit
    const hasVisited = localStorage.getItem('lenia_has_visited');

    const overlay = document.getElementById('welcome-overlay');
    if (!overlay) return;

    if (!hasVisited) {
        // Show welcome overlay
        overlay.style.display = 'flex';

        // "Watch" button enters Zen mode
        const watchBtn = document.getElementById('btn-welcome-watch');
        if (watchBtn) {
            watchBtn.addEventListener('click', () => {
                overlay.style.display = 'none';
                localStorage.setItem('lenia_has_visited', 'true');

                // Set up a beautiful default scene then enter Zen mode
                loadPresetScene('deep-ocean');

                // Small delay to let scene load, then enter Zen mode
                setTimeout(() => {
                    if (typeof enterZenMode === 'function') {
                        enterZenMode();
                    }
                }, 100);
            });
        }

        // "Explore" link shows controls
        const exploreLink = document.getElementById('btn-welcome-explore');
        if (exploreLink) {
            exploreLink.addEventListener('click', () => {
                overlay.style.display = 'none';
                localStorage.setItem('lenia_has_visited', 'true');
            });
        }
    }
}

/**
 * Switch between modes
 */
function switchMode(mode) {
    currentMode = mode;

    // Update tabs
    document.querySelectorAll('.mode-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    // Update panels
    document.querySelectorAll('.mode-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${mode}`);
    });

    // Reset generation
    generation = 0;

    // Sync UI for the new mode
    if (mode === 'single') {
        syncUIToParams();
    } else if (mode === 'ecosystem') {
        const ecosystemSelect = document.getElementById('ecosystem-select');
        multiChannel.loadEcosystem(ecosystemSelect.value);
        updateInteractionMatrix();
        updateChannelTabs();
    }
}

/**
 * Toggle between Standard Lenia and Flow-Lenia modes
 */
function setFlowMode(enabled) {
    useFlowLenia = enabled;

    // Update button states
    const btnStandard = document.getElementById('btn-standard-lenia');
    const btnFlow = document.getElementById('btn-flow-lenia');
    const flowIndicator = document.getElementById('flow-indicator');
    const flowParamsSection = document.getElementById('flow-params-section');
    const sensorySection = document.getElementById('sensory-section');

    if (enabled) {
        btnStandard.classList.remove('primary');
        btnFlow.classList.add('primary');
        flowIndicator.style.display = 'block';
        flowParamsSection.style.display = 'block';
        sensorySection.style.display = 'block';  // Show sensory controls when flow mode active

        // Copy current state from standard lenia to flow lenia if needed
        if (flowLenia.totalMass() === 0 && lenia.totalMass() > 0) {
            // Transfer the grid
            for (let i = 0; i < lenia.grid.length && i < flowLenia.A.length; i++) {
                flowLenia.A[i] = lenia.grid[i];
            }
            // Copy parameters
            flowLenia.R = lenia.R;
            flowLenia.peaks = lenia.peaks;
            flowLenia.mu = lenia.mu;
            flowLenia.sigma = lenia.sigma;
            flowLenia.dt = lenia.dt;
            flowLenia.kernelType = lenia.kernelType;
            flowLenia.kernelParams = { ...lenia.kernelParams };
            flowLenia.updateKernel();
        }

        // Record initial mass for conservation tracking
        initialMass = flowLenia.totalMass();
        updateMassStats();
    } else {
        btnStandard.classList.add('primary');
        btnFlow.classList.remove('primary');
        flowIndicator.style.display = 'none';
        flowParamsSection.style.display = 'none';
        sensorySection.style.display = 'none';  // Hide sensory controls

        // Also disable sensory mode when leaving flow mode
        setSensoryMode(false);

        // Copy current state from flow lenia to standard lenia if needed
        if (lenia.totalMass() === 0 && flowLenia.totalMass() > 0) {
            for (let i = 0; i < flowLenia.A.length && i < lenia.grid.length; i++) {
                lenia.grid[i] = flowLenia.A[i];
            }
            // Copy parameters
            lenia.R = flowLenia.R;
            lenia.peaks = flowLenia.peaks;
            lenia.mu = flowLenia.mu;
            lenia.sigma = flowLenia.sigma;
            lenia.dt = flowLenia.dt;
            lenia.kernelType = flowLenia.kernelType;
            lenia.kernelParams = { ...flowLenia.kernelParams };
            lenia.updateKernel();
        }
    }

    generation = 0;
    syncUIToParams();
}

/**
 * Phase 5: Toggle evolution mode
 */
function setEvolutionMode(enabled) {
    evolutionEnabled = enabled;

    // Update button states
    const btnOff = document.getElementById('btn-evolution-off');
    const btnOn = document.getElementById('btn-evolution-on');
    const evolutionIndicator = document.getElementById('evolution-indicator');
    const evolutionStatsSection = document.getElementById('evolution-stats-section');

    if (enabled) {
        btnOff.classList.remove('primary');
        btnOn.classList.add('primary');
        evolutionIndicator.style.display = 'block';
        evolutionStatsSection.style.display = 'block';

        // Enable evolution in creature tracker
        if (creatureTracker) {
            creatureTracker.evolution.enabled = true;
            creatureTracker.resetStats();

            // Assign genomes to existing creatures
            for (const creature of creatureTracker.creatures) {
                if (!creature.genome) {
                    creatureTracker.assignDefaultGenome(creature);
                }
            }
        }
    } else {
        btnOff.classList.add('primary');
        btnOn.classList.remove('primary');
        evolutionIndicator.style.display = 'none';
        evolutionStatsSection.style.display = 'none';

        // Disable evolution in creature tracker
        if (creatureTracker) {
            creatureTracker.evolution.enabled = false;
        }
    }
}

/**
 * Phase 14: Toggle seasonal cycle mode
 */
function setSeasonalMode(enabled) {
    // Update button states
    const btnOff = document.getElementById('btn-seasons-off');
    const btnOn = document.getElementById('btn-seasons-on');
    const seasonIndicator = document.getElementById('season-indicator');

    if (enabled) {
        btnOff.classList.remove('primary');
        btnOn.classList.add('primary');
        seasonIndicator.style.display = 'block';

        if (environment) {
            environment.params.seasonalCycleEnabled = true;
            environment.baseFoodSpawnRate = environment.params.foodSpawnRate;
        }
    } else {
        btnOff.classList.add('primary');
        btnOn.classList.remove('primary');
        seasonIndicator.style.display = 'none';

        if (environment) {
            environment.params.seasonalCycleEnabled = false;
            // Restore base food spawn rate
            environment.params.foodSpawnRate = environment.baseFoodSpawnRate;
        }
    }
}

/**
 * Phase 14: Toggle moving food zones mode
 */
function setZonesMode(enabled) {
    // Update button states
    const btnOff = document.getElementById('btn-zones-off');
    const btnOn = document.getElementById('btn-zones-on');
    const zonesIndicator = document.getElementById('zones-indicator');

    if (enabled) {
        btnOff.classList.remove('primary');
        btnOn.classList.add('primary');
        zonesIndicator.style.display = 'block';

        if (environment) {
            environment.params.movingZonesEnabled = true;
            environment.initializeMigrationZones();
        }
    } else {
        btnOff.classList.add('primary');
        btnOn.classList.remove('primary');
        zonesIndicator.style.display = 'none';

        if (environment) {
            environment.params.movingZonesEnabled = false;
        }
    }
}

/**
 * Phase 4: Toggle sensory creature mode
 */
function setSensoryMode(enabled) {
    sensoryEnabled = enabled;

    // Update button states
    const btnOff = document.getElementById('btn-sensory-off');
    const btnOn = document.getElementById('btn-sensory-on');
    const sensoryIndicator = document.getElementById('sensory-indicator');
    const environmentSection = document.getElementById('environment-section');
    const behaviorSection = document.getElementById('creature-behavior-section');
    const visualizationSection = document.getElementById('visualization-section');
    const evolutionSection = document.getElementById('evolution-section');
    const signalSection = document.getElementById('signal-section');  // Phase 12
    const seasonalSection = document.getElementById('seasonal-section');  // Phase 14
    const zonesSection = document.getElementById('zones-section');        // Phase 14

    if (enabled) {
        btnOff.classList.remove('primary');
        btnOn.classList.add('primary');
        sensoryIndicator.style.display = 'block';
        environmentSection.style.display = 'block';
        behaviorSection.style.display = 'block';
        visualizationSection.style.display = 'block';
        evolutionSection.style.display = 'block';  // Show evolution controls
        if (signalSection) signalSection.style.display = 'block';  // Phase 12: Show signal controls
        if (seasonalSection) seasonalSection.style.display = 'block';  // Phase 14: Show seasonal controls
        if (zonesSection) zonesSection.style.display = 'block';        // Phase 14: Show zones controls

        // Enable sensory mode in flow lenia
        if (flowLenia) {
            flowLenia.setSensoryMode(true);
        }

        // Phase 12: Set environment reference in creature tracker for signal emission
        if (creatureTracker && environment) {
            creatureTracker.setEnvironment(environment);
        }

        // Initialize environment if needed
        if (environment && environment.food[0] === 0) {
            environment.initializeFood();
        }
    } else {
        btnOff.classList.add('primary');
        btnOn.classList.remove('primary');
        sensoryIndicator.style.display = 'none';
        environmentSection.style.display = 'none';
        behaviorSection.style.display = 'none';
        visualizationSection.style.display = 'none';
        evolutionSection.style.display = 'none';  // Hide evolution controls
        if (signalSection) signalSection.style.display = 'none';  // Phase 12: Hide signal controls
        if (seasonalSection) seasonalSection.style.display = 'none';  // Phase 14: Hide seasonal controls
        if (zonesSection) zonesSection.style.display = 'none';        // Phase 14: Hide zones controls

        // Disable evolution when disabling sensory mode
        setEvolutionMode(false);

        // Phase 14: Disable migration features when disabling sensory mode
        setSeasonalMode(false);
        setZonesMode(false);

        // Disable sensory mode in flow lenia
        if (flowLenia) {
            flowLenia.setSensoryMode(false);
        }
    }
}

/**
 * Update mass conservation statistics display
 */
function updateMassStats() {
    if (!useFlowLenia) return;

    const currentMass = flowLenia.totalMass();
    const delta = initialMass > 0 ? ((currentMass - initialMass) / initialMass * 100) : 0;

    const initialEl = document.getElementById('stat-initial-mass');
    const currentEl = document.getElementById('stat-current-mass');
    const deltaEl = document.getElementById('stat-mass-delta');

    if (initialEl) initialEl.textContent = initialMass.toFixed(1);
    if (currentEl) currentEl.textContent = currentMass.toFixed(1);
    if (deltaEl) {
        deltaEl.textContent = (delta >= 0 ? '+' : '') + delta.toFixed(2) + '%';
        // Color based on conservation quality
        if (Math.abs(delta) < 0.1) {
            deltaEl.style.color = '#5f5';  // Green - excellent
        } else if (Math.abs(delta) < 1) {
            deltaEl.style.color = '#ff5';  // Yellow - acceptable
        } else {
            deltaEl.style.color = '#f55';  // Red - poor
        }
    }
}

/**
 * Update channel tab styling
 */
function updateChannelTabs() {
    const tabsContainer = document.getElementById('channel-tabs');
    // Clear and rebuild tabs
    while (tabsContainer.firstChild) {
        tabsContainer.removeChild(tabsContainer.firstChild);
    }

    for (let i = 0; i < multiChannel.numChannels; i++) {
        const tab = document.createElement('div');
        tab.className = 'channel-tab' + (i === multiChannel.activeChannel ? ' active' : '');
        tab.dataset.channel = i;
        tab.textContent = `Ch ${i}`;
        const color = multiChannel.channelColors[i];
        tab.style.color = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        tabsContainer.appendChild(tab);
    }
}

/**
 * Update interaction matrix UI
 */
function updateInteractionMatrix() {
    const container = document.getElementById('interaction-matrix');
    const n = multiChannel.numChannels;

    // Clear
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    // Set grid columns
    container.style.gridTemplateColumns = `40px repeat(${n}, 1fr)`;

    // Header row
    const corner = document.createElement('div');
    corner.className = 'matrix-label';
    corner.textContent = '→';
    container.appendChild(corner);

    for (let j = 0; j < n; j++) {
        const header = document.createElement('div');
        header.className = 'matrix-label';
        header.textContent = `Ch${j}`;
        header.style.color = `rgb(${multiChannel.channelColors[j].join(',')})`;
        container.appendChild(header);
    }

    // Data rows
    for (let i = 0; i < n; i++) {
        // Row label
        const rowLabel = document.createElement('div');
        rowLabel.className = 'matrix-label';
        rowLabel.textContent = `Ch${i}`;
        rowLabel.style.color = `rgb(${multiChannel.channelColors[i].join(',')})`;
        container.appendChild(rowLabel);

        // Cells
        for (let j = 0; j < n; j++) {
            const cell = document.createElement('input');
            cell.type = 'number';
            cell.className = 'matrix-cell';
            cell.value = multiChannel.interactions[i][j].toFixed(2);
            cell.step = 0.1;
            cell.min = -2;
            cell.max = 2;
            cell.dataset.row = i;
            cell.dataset.col = j;

            cell.addEventListener('change', (e) => {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                multiChannel.interactions[row][col] = parseFloat(e.target.value);
            });

            container.appendChild(cell);
        }
    }
}

/**
 * Set up a slider with live value display and callback
 */
function setupSlider(id, callback) {
    const slider = document.getElementById(id);
    if (!slider) return;

    const display = document.getElementById(id + '-value');

    const update = () => {
        if (display) {
            display.textContent = slider.value;
        }
        callback(slider.value);
    };

    slider.addEventListener('input', update);
    slider.addEventListener('change', update);
}

/**
 * When user changes a parameter, switch to custom species
 */
function setSpeciesCustom() {
    if (currentMode === 'single') {
        const speciesSelect = document.getElementById('species-select');
        if (speciesSelect.value !== 'custom') {
            speciesSelect.value = 'custom';
        }
    }
}

/**
 * Sync UI controls to current Lenia parameters
 */
function syncUIToParams() {
    // Use flow lenia params if in flow mode
    const sim = useFlowLenia ? flowLenia : lenia;

    setSliderValue('kernel-radius', sim.R);
    setSliderValue('kernel-peaks', sim.peaks);
    setSliderValue('growth-mu', sim.mu);
    setSliderValue('growth-sigma', sim.sigma);
    setSliderValue('dt', sim.dt);
    setSliderValue('grid-size', sim.size);

    // Sync kernel type
    const kernelTypeSelect = document.getElementById('kernel-type');
    if (kernelTypeSelect) {
        kernelTypeSelect.value = sim.kernelType;
    }

    // Sync kernel-specific params
    const p = sim.kernelParams;
    setSliderValue('spiral-arms', p.arms);
    setSliderValue('spiral-tightness', p.tightness);
    setSliderValue('star-points', p.points);
    setSliderValue('star-sharpness', p.sharpness);
    setSliderValue('aniso-angle', (p.angle * 180 / Math.PI));
    setSliderValue('aniso-eccentricity', p.eccentricity);
    setSliderValue('asymmetric-bias', p.bias);

    // Sync flow-specific params
    if (useFlowLenia) {
        setSliderValue('flow-strength', flowLenia.flowStrength);
        setSliderValue('flow-diffusion', flowLenia.diffusion);
        setSliderValue('steering-strength', flowLenia.steeringStrength);
    }

    // Sync sensory params if enabled
    if (sensoryEnabled) {
        syncSensoryUI();
        syncEnvironmentUI();
    }

    // Update visibility and preview
    updateKernelParamsVisibility();
    updateKernelPreview();
}

/**
 * Sync sensory UI controls to current creature tracker settings
 */
function syncSensoryUI() {
    if (!creatureTracker) return;

    setSliderValue('food-weight', creatureTracker.sensory.foodWeight);
    setSliderValue('pheromone-weight', creatureTracker.sensory.pheromoneWeight);
    setSliderValue('social-weight', creatureTracker.sensory.socialWeight);
    setSliderValue('turn-rate', creatureTracker.sensory.turnRate);

    // Update predator button state
    const btn = document.getElementById('btn-predator-mode');
    if (btn) {
        if (creatureTracker.sensory.isPredator) {
            btn.classList.add('primary');
            btn.textContent = 'Predator: ON';
        } else {
            btn.classList.remove('primary');
            btn.textContent = 'Predator Mode';
        }
    }
}

/**
 * Sync environment UI controls to current environment settings
 */
function syncEnvironmentUI() {
    if (!environment) return;

    setSliderValue('food-spawn', environment.params.foodSpawnRate);
    setSliderValue('pheromone-decay', environment.params.pheromoneDecayRate);
    setSliderValue('current-strength', environment.params.currentStrength);
    setSliderValue('current-angle', environment.params.currentAngle * 180 / Math.PI);
}

/**
 * Update sensory stats display
 */
function updateSensoryStats() {
    if (!sensoryEnabled) return;

    const creaturesEl = document.getElementById('stat-creatures');
    const foodEl = document.getElementById('stat-food');

    if (creaturesEl && creatureTracker) {
        creaturesEl.textContent = creatureTracker.count;
    }

    if (foodEl && environment) {
        let totalFood = 0;
        for (let i = 0; i < environment.food.length; i++) {
            totalFood += environment.food[i];
        }
        foodEl.textContent = totalFood.toFixed(1);
    }

    // Phase 14: Update season indicator
    if (environment && environment.params.seasonalCycleEnabled) {
        const seasonNameEl = document.getElementById('season-name');
        const seasonFoodRateEl = document.getElementById('season-food-rate');

        if (seasonNameEl) {
            seasonNameEl.textContent = environment.getSeasonName();
        }
        if (seasonFoodRateEl) {
            seasonFoodRateEl.textContent = environment.params.foodSpawnRate.toFixed(4);
        }
    }

    // Update evolution stats if enabled
    if (evolutionEnabled && creatureTracker) {
        updateEvolutionStats();
    }
}

/**
 * Update evolution statistics display
 */
function updateEvolutionStats() {
    if (!creatureTracker) return;

    const stats = creatureTracker.stats;

    // Population and generation stats
    const populationEl = document.getElementById('stat-population');
    const highestGenEl = document.getElementById('stat-highest-gen');
    const avgGenEl = document.getElementById('stat-avg-gen');
    const avgEnergyEl = document.getElementById('stat-avg-energy');
    const birthsEl = document.getElementById('stat-births');
    const deathsEl = document.getElementById('stat-deaths');

    // Phase 10: Hunter/Prey/Predation stats
    const huntersEl = document.getElementById('stat-hunters');
    const preyEl = document.getElementById('stat-prey');
    const predationsEl = document.getElementById('stat-predations');

    if (populationEl) populationEl.textContent = creatureTracker.count;
    if (highestGenEl) highestGenEl.textContent = stats.highestGeneration;
    if (avgGenEl) avgGenEl.textContent = stats.averageGeneration.toFixed(1);
    if (avgEnergyEl) avgEnergyEl.textContent = stats.averageEnergy.toFixed(1);
    if (birthsEl) birthsEl.textContent = stats.totalBirths;
    if (deathsEl) deathsEl.textContent = stats.totalDeaths;

    // Phase 10: Count hunters and prey
    const hunters = creatureTracker.creatures.filter(c => c.genome?.isPredator).length;
    const prey = creatureTracker.creatures.filter(c => c.genome && !c.genome.isPredator).length;

    if (huntersEl) huntersEl.textContent = hunters;
    if (preyEl) preyEl.textContent = prey;
    if (predationsEl) predationsEl.textContent = stats.predationEvents || 0;

    // Trait averages
    const traits = stats.traitAverages;
    const traitFoodEl = document.getElementById('stat-trait-food');
    const traitPheromoneEl = document.getElementById('stat-trait-pheromone');
    const traitSocialEl = document.getElementById('stat-trait-social');
    const traitTurnEl = document.getElementById('stat-trait-turn');

    if (traitFoodEl && traits.foodWeight !== undefined) {
        traitFoodEl.textContent = traits.foodWeight.toFixed(2);
    }
    if (traitPheromoneEl && traits.pheromoneWeight !== undefined) {
        traitPheromoneEl.textContent = traits.pheromoneWeight.toFixed(2);
    }
    if (traitSocialEl && traits.socialWeight !== undefined) {
        traitSocialEl.textContent = traits.socialWeight.toFixed(2);
    }
    if (traitTurnEl && traits.turnRate !== undefined) {
        traitTurnEl.textContent = traits.turnRate.toFixed(3);
    }

    // Phase 6: Morphology trait averages
    const traitKernelREl = document.getElementById('stat-trait-kernel-r');
    const traitGrowthMuEl = document.getElementById('stat-trait-growth-mu');
    const traitGrowthSigmaEl = document.getElementById('stat-trait-growth-sigma');

    if (traitKernelREl && traits.kernelRadius !== undefined) {
        traitKernelREl.textContent = traits.kernelRadius.toFixed(1);
    }
    if (traitGrowthMuEl && traits.growthMu !== undefined) {
        traitGrowthMuEl.textContent = traits.growthMu.toFixed(3);
    }
    if (traitGrowthSigmaEl && traits.growthSigma !== undefined) {
        traitGrowthSigmaEl.textContent = traits.growthSigma.toFixed(4);
    }

    // Phase 7: Directional trait averages
    const traitKernelBiasEl = document.getElementById('stat-trait-kernel-bias');
    if (traitKernelBiasEl && traits.kernelBias !== undefined) {
        traitKernelBiasEl.textContent = traits.kernelBias.toFixed(3);
    }

    // Phase 8: Asymmetric sensing trait averages
    const traitSensorFocusEl = document.getElementById('stat-trait-sensor-focus');
    if (traitSensorFocusEl && traits.sensorFocus !== undefined) {
        traitSensorFocusEl.textContent = traits.sensorFocus.toFixed(3);
    }

    // Phase 11: Memory weight averages
    const traitMemoryWeightEl = document.getElementById('stat-trait-memory-weight');
    if (traitMemoryWeightEl && traits.memoryWeight !== undefined) {
        traitMemoryWeightEl.textContent = traits.memoryWeight.toFixed(3);
    }

    // Phase 13: Collective behavior trait averages
    const traitAlignmentEl = document.getElementById('stat-trait-alignment');
    const traitPackCoordEl = document.getElementById('stat-trait-pack-coord');
    const traitHomingEl = document.getElementById('stat-trait-homing');

    if (traitAlignmentEl && traits.alignmentWeight !== undefined) {
        traitAlignmentEl.textContent = traits.alignmentWeight.toFixed(3);
    }
    if (traitPackCoordEl && traits.packCoordination !== undefined) {
        traitPackCoordEl.textContent = traits.packCoordination.toFixed(3);
    }
    if (traitHomingEl && traits.homingStrength !== undefined) {
        traitHomingEl.textContent = traits.homingStrength.toFixed(3);
    }

    // Phase 14: Migration trait averages
    const traitMigrationEl = document.getElementById('stat-trait-migration');
    const traitWanderlustEl = document.getElementById('stat-trait-wanderlust');
    const traitSeasonalEl = document.getElementById('stat-trait-seasonal');

    if (traitMigrationEl && traits.migrationSensitivity !== undefined) {
        traitMigrationEl.textContent = traits.migrationSensitivity.toFixed(3);
    }
    if (traitWanderlustEl && traits.wanderlust !== undefined) {
        traitWanderlustEl.textContent = traits.wanderlust.toFixed(3);
    }
    if (traitSeasonalEl && traits.seasonalAdaptation !== undefined) {
        traitSeasonalEl.textContent = traits.seasonalAdaptation.toFixed(3);
    }

    // Phase 15: Update population history and draw graph
    updatePopulationGraph(hunters, prey);
}

/**
 * Phase 15: Update population history and draw the population graph
 * @param {number} hunters - Current hunter count
 * @param {number} prey - Current prey count
 */
function updatePopulationGraph(hunters, prey) {
    // Add current counts to history
    hunterPopulationHistory.push(hunters);
    preyPopulationHistory.push(prey);

    // Trim to max length
    if (hunterPopulationHistory.length > POPULATION_HISTORY_LENGTH) {
        hunterPopulationHistory.shift();
    }
    if (preyPopulationHistory.length > POPULATION_HISTORY_LENGTH) {
        preyPopulationHistory.shift();
    }

    // Draw the graph
    const canvas = document.getElementById('population-graph');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, width, height);

    // Find max value for scaling
    let maxPop = 1;
    for (const v of hunterPopulationHistory) maxPop = Math.max(maxPop, v);
    for (const v of preyPopulationHistory) maxPop = Math.max(maxPop, v);

    // Add some padding to max
    maxPop = Math.ceil(maxPop * 1.1);

    // Draw grid lines
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = height - (i / 4) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Draw prey line (blue) - draw first so hunters appear on top
    if (preyPopulationHistory.length > 1) {
        ctx.strokeStyle = '#8af';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < preyPopulationHistory.length; i++) {
            const x = (i / (POPULATION_HISTORY_LENGTH - 1)) * width;
            const y = height - (preyPopulationHistory[i] / maxPop) * height;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }

    // Draw hunter line (red)
    if (hunterPopulationHistory.length > 1) {
        ctx.strokeStyle = '#f88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < hunterPopulationHistory.length; i++) {
            const x = (i / (POPULATION_HISTORY_LENGTH - 1)) * width;
            const y = height - (hunterPopulationHistory[i] / maxPop) * height;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }

    // Draw current values as text
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(maxPop.toString(), width - 2, 12);
    ctx.fillText('0', width - 2, height - 2);
}

/**
 * Set slider value and update display
 */
function setSliderValue(id, value) {
    const slider = document.getElementById(id);
    const display = document.getElementById(id + '-value');

    if (slider) {
        slider.value = value;
        if (display) {
            display.textContent = value;
        }
    }
}

/**
 * Show/hide kernel-specific parameter controls based on kernel type
 */
function updateKernelParamsVisibility() {
    let type;
    if (currentMode === 'single') {
        type = useFlowLenia ? flowLenia.kernelType : lenia.kernelType;
    } else {
        type = multiChannel.channelParams[multiChannel.activeChannel].kernelType;
    }

    // Hide all kernel-specific params first
    document.querySelectorAll('.kernel-param').forEach(el => {
        el.style.display = 'none';
    });

    // Show peaks only for ring kernel
    const peaksGroup = document.getElementById('kernel-peaks-group');
    if (peaksGroup) {
        peaksGroup.style.display = (type === 'ring') ? 'block' : 'none';
    }

    // Show type-specific params
    switch (type) {
        case 'spiral':
            showElement('spiral-arms-group');
            showElement('spiral-tightness-group');
            break;
        case 'star':
            showElement('star-points-group');
            showElement('star-sharpness-group');
            break;
        case 'anisotropic':
            showElement('aniso-angle-group');
            showElement('aniso-eccentricity-group');
            break;
        case 'asymmetric':
            showElement('asymmetric-bias-group');
            break;
    }
}

function showElement(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
}

/**
 * Render a preview of the current kernel
 */
function updateKernelPreview() {
    const canvas = document.getElementById('kernel-preview');
    if (!canvas) return;

    let kernel;
    if (currentMode === 'single') {
        if (useFlowLenia) {
            if (!flowLenia || !flowLenia.kernel) return;
            kernel = flowLenia.kernel;
        } else {
            if (!lenia || !lenia.kernel) return;
            kernel = lenia.kernel;
        }
    } else {
        const ch = multiChannel.activeChannel;
        if (!multiChannel.channelParams[ch].kernel) return;
        kernel = multiChannel.channelParams[ch].kernel;
    }

    const ctx = canvas.getContext('2d');
    const size = canvas.width;

    // Find max value for normalization
    let maxVal = 0;
    let minVal = 0;
    for (let i = 0; i < kernel.data.length; i++) {
        maxVal = Math.max(maxVal, kernel.data[i]);
        minVal = Math.min(minVal, kernel.data[i]);
    }
    const range = Math.max(maxVal, -minVal);

    // Create image data
    const imageData = ctx.createImageData(size, size);
    const scale = kernel.size / size;

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const kx = Math.floor(x * scale);
            const ky = Math.floor(y * scale);
            const val = kernel.data[ky * kernel.size + kx];
            const normVal = range > 0 ? val / range : 0;

            const idx = (y * size + x) * 4;
            if (normVal >= 0) {
                // Positive: cyan/blue
                imageData.data[idx] = 0;
                imageData.data[idx + 1] = Math.floor(normVal * 180);
                imageData.data[idx + 2] = Math.floor(normVal * 255);
            } else {
                // Negative: red
                imageData.data[idx] = Math.floor(-normVal * 255);
                imageData.data[idx + 1] = 0;
                imageData.data[idx + 2] = 0;
            }
            imageData.data[idx + 3] = 255;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Update the color scheme preview bar
 */
function updateColorPreview() {
    const preview = document.getElementById('color-preview');
    if (!preview) return;

    const colors = ColorMaps[lenia.colorMap] || ColorMaps.viridis;

    // Clear existing children safely
    while (preview.firstChild) {
        preview.removeChild(preview.firstChild);
    }

    // Create color divs using safe DOM methods
    colors.forEach(color => {
        const div = document.createElement('div');
        div.style.backgroundColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
        preview.appendChild(div);
    });
}

// ==================== Recording Functions ====================

function startWebMRecording() {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    if (!VideoRecorder.isSupported()) {
        alert('WebM recording not supported in this browser');
        return;
    }

    const duration = parseInt(document.getElementById('record-duration').value);

    videoRecorder = new VideoRecorder(canvas);

    videoRecorder.onStart = () => {
        document.getElementById('recording-indicator').classList.add('active');
        document.getElementById('btn-record-webm').disabled = true;
        document.getElementById('btn-record-gif').disabled = true;
    };

    videoRecorder.onProgress = (elapsed) => {
        document.getElementById('recording-time').textContent =
            `${Math.floor(elapsed)}:${String(Math.floor((elapsed % 1) * 10)).padStart(2, '0')}`;
    };

    videoRecorder.onStop = (blob) => {
        document.getElementById('recording-indicator').classList.remove('active');
        document.getElementById('btn-record-webm').disabled = false;
        document.getElementById('btn-record-gif').disabled = false;
        VideoRecorder.download(blob);
    };

    videoRecorder.start(duration);
}

async function startGifRecording() {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    await GifRecorder.loadLibrary();

    const duration = parseInt(document.getElementById('record-duration').value);
    const progressBar = document.getElementById('record-progress');
    const progressFill = document.getElementById('record-progress-fill');

    gifRecorder = new GifRecorder(canvas);
    gifRecorder.width = 256;
    gifRecorder.height = 256;

    gifRecorder.onStart = () => {
        progressBar.style.display = 'block';
        document.getElementById('btn-record-webm').disabled = true;
        document.getElementById('btn-record-gif').disabled = true;
    };

    gifRecorder.onProgress = (progress) => {
        progressFill.style.width = `${progress * 100}%`;
    };

    gifRecorder.onComplete = (blob) => {
        progressBar.style.display = 'none';
        document.getElementById('btn-record-webm').disabled = false;
        document.getElementById('btn-record-gif').disabled = false;
        GifRecorder.download(blob);
    };

    const blob = await gifRecorder.record(duration);
}

// ==================== Discovery Functions ====================

async function startGridSearch() {
    if (!parameterExplorer) return;

    const progressFill = document.getElementById('search-progress-fill');
    const heatmapCanvas = document.getElementById('search-heatmap');

    parameterExplorer.onProgress = (progress, result) => {
        progressFill.style.width = `${progress * 100}%`;
    };

    parameterExplorer.onComplete = (results) => {
        // Draw heatmap
        const heatmap = parameterExplorer.generateHeatmap(150, 150);
        const ctx = heatmapCanvas.getContext('2d');
        ctx.drawImage(heatmap, 0, 0);

        // Show best result
        const best = parameterExplorer.getBestResults(1)[0];
        if (best && best.score > 0) {
            // Load the best params into lenia
            lenia.R = Math.round(best.params.R);
            lenia.mu = best.params.mu;
            lenia.sigma = best.params.sigma;
            lenia.updateKernel();
            syncUIToParams();
            lenia.randomize();
            generation = 0;

            // Switch to single mode to see results
            switchMode('single');
        }
    };

    await parameterExplorer.gridSearch(
        { R: lenia.R, dt: 0.1, peaks: 1, kernelType: 'ring' },
        { mu: [0.1, 0.4], sigma: [0.01, 0.06] },
        12
    );
}

async function startEvolution() {
    if (!evolutionarySearch) return;

    const generations = parseInt(document.getElementById('evo-gens').value);
    const progressFill = document.getElementById('evo-progress-fill');
    const statusEl = document.getElementById('evo-status');

    evolutionarySearch.onGeneration = (gen, population) => {
        progressFill.style.width = `${(gen / generations) * 100}%`;
        statusEl.textContent = `Gen ${gen}: Best = ${population[0].fitness.toFixed(3)}`;
    };

    evolutionarySearch.onNewBest = (best) => {
        statusEl.textContent = `New best! Score: ${best.fitness.toFixed(3)}`;
    };

    const best = await evolutionarySearch.run(generations);

    if (best && best.fitness > 0) {
        // Load the best genome
        lenia.R = Math.round(best.genome.R);
        lenia.mu = best.genome.mu;
        lenia.sigma = best.genome.sigma;
        lenia.peaks = best.genome.peaks;
        lenia.dt = best.genome.dt;
        lenia.updateKernel();
        syncUIToParams();
        lenia.randomize();
        generation = 0;

        // Switch to single mode
        switchMode('single');
    }
}

function saveDiscovery() {
    if (!creatureGallery) return;

    const name = prompt('Name this creature:', `Creature-${Date.now()}`);
    if (!name) return;

    const params = {
        R: lenia.R,
        peaks: lenia.peaks,
        mu: lenia.mu,
        sigma: lenia.sigma,
        dt: lenia.dt,
        kernelType: lenia.kernelType
    };

    creatureGallery.add(name, params);
    updateGalleryList();
}

function updateGalleryList() {
    const container = document.getElementById('gallery-list');
    if (!container || !creatureGallery) return;

    // Clear
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    // Add items
    for (const discovery of creatureGallery.discoveries) {
        const item = document.createElement('div');
        item.className = 'gallery-item';

        const name = document.createElement('span');
        name.className = 'gallery-name';
        name.textContent = discovery.name;

        const loadBtn = document.createElement('button');
        loadBtn.className = 'gallery-load';
        loadBtn.textContent = 'Load';
        loadBtn.addEventListener('click', () => {
            lenia.R = discovery.params.R;
            lenia.peaks = discovery.params.peaks || 1;
            lenia.mu = discovery.params.mu;
            lenia.sigma = discovery.params.sigma;
            lenia.dt = discovery.params.dt;
            lenia.kernelType = discovery.params.kernelType || 'ring';
            lenia.updateKernel();
            syncUIToParams();
            lenia.randomize();
            generation = 0;
            switchMode('single');
        });

        item.appendChild(name);
        item.appendChild(loadBtn);
        container.appendChild(item);
    }

    if (creatureGallery.discoveries.length === 0) {
        const empty = document.createElement('div');
        empty.style.color = '#666';
        empty.style.fontSize = '0.8em';
        empty.textContent = 'No discoveries yet';
        container.appendChild(empty);
    }
}

// ==================== Export / Import ====================

function exportState() {
    const state = {
        params: {
            R: lenia.R,
            peaks: lenia.peaks,
            mu: lenia.mu,
            sigma: lenia.sigma,
            dt: lenia.dt,
            kernelType: lenia.kernelType
        },
        size: lenia.size,
        grid: Array.from(lenia.grid),
        timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lenia-state-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importState(json) {
    try {
        const state = JSON.parse(json);

        lenia.R = state.params.R;
        lenia.peaks = state.params.peaks;
        lenia.mu = state.params.mu;
        lenia.sigma = state.params.sigma;
        lenia.dt = state.params.dt;
        lenia.kernelType = state.params.kernelType || 'ring';
        lenia.updateKernel();

        if (state.size !== lenia.size) {
            lenia.resize(state.size);
        }

        lenia.grid = new Float32Array(state.grid);
        generation = 0;

        syncUIToParams();
        setSpeciesCustom();

        return true;
    } catch (e) {
        console.error('Failed to import state:', e);
        return false;
    }
}
