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

function initUI() {
    // Initialize multi-channel, flow-lenia, and explorer systems
    multiChannel = new MultiChannelLenia(256, 2);
    flowLenia = new FlowLenia(256);
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

    if (enabled) {
        btnStandard.classList.remove('primary');
        btnFlow.classList.add('primary');
        flowIndicator.style.display = 'block';
        flowParamsSection.style.display = 'block';

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
    }

    // Update visibility and preview
    updateKernelParamsVisibility();
    updateKernelPreview();
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
