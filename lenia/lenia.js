/**
 * Core Lenia Implementation
 *
 * Lenia is a continuous generalization of Conway's Game of Life:
 * - Continuous space (smooth grid values 0-1 instead of binary)
 * - Continuous time (small dt steps instead of discrete generations)
 * - Continuous states (floating point instead of dead/alive)
 *
 * The update rule:
 * 1. Convolve the grid with a kernel to get neighborhood potential U
 * 2. Apply growth function G(U) to determine how cells change
 * 3. Update: A(t+dt) = clip(A(t) + dt * G(U), 0, 1)
 */

let lenia;
let paused = true;
let generation = 0;
let lastFrameTime = 0;
let fps = 0;

// Living Aquarium: Zen Mode state
let zenModeActive = false;

// Living Aquarium: Particle system for ambient atmosphere
let ambientParticles = null;

/**
 * Ambient Particle System - Creates floating dust motes/plankton for atmosphere
 */
class AmbientParticleSystem {
    constructor(count = 80) {
        this.particles = [];
        this.maxCount = count;
        this.enabled = true;

        // Initialize particles
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle());
        }
    }

    createParticle(x = null, y = null) {
        return {
            x: x !== null ? x : Math.random() * width,
            y: y !== null ? y : Math.random() * height,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5 - 0.3, // Slight upward drift
            size: 1 + Math.random() * 3,
            opacity: 0.2 + Math.random() * 0.4,
            twinkle: Math.random() * Math.PI * 2, // Phase for twinkling
            twinkleSpeed: 0.02 + Math.random() * 0.03,
            driftAngle: Math.random() * Math.PI * 2, // For organic wandering
            driftSpeed: 0.01 + Math.random() * 0.02
        };
    }

    update(creatures = null) {
        if (!this.enabled) return;

        for (let p of this.particles) {
            // Update twinkle phase
            p.twinkle += p.twinkleSpeed;

            // Organic wandering motion - slowly rotating drift direction
            p.driftAngle += (Math.random() - 0.5) * 0.1;
            p.vx += Math.cos(p.driftAngle) * 0.15;
            p.vy += Math.sin(p.driftAngle) * 0.15 - 0.05; // Slight upward bias

            // Dampen velocity to prevent runaway speeds
            p.vx *= 0.95;
            p.vy *= 0.95;

            // React to nearby creatures (get pushed away gently)
            if (creatures && creatures.length > 0) {
                for (const creature of creatures) {
                    const sim = (typeof flowLenia !== 'undefined' && flowLenia) ? flowLenia : lenia;
                    const cellSize = width / sim.size;
                    const cx = creature.x * cellSize;
                    const cy = creature.y * cellSize;
                    const dx = p.x - cx;
                    const dy = p.y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const pushRadius = creature.radius * cellSize * 3;

                    if (dist < pushRadius && dist > 0) {
                        const force = (1 - dist / pushRadius) * 0.5;
                        p.vx += (dx / dist) * force;
                        p.vy += (dy / dist) * force;
                    }
                }
            }

            // Update position
            p.x += p.vx;
            p.y += p.vy;

            // Wrap around edges
            if (p.x < -10) p.x = width + 10;
            if (p.x > width + 10) p.x = -10;
            if (p.y < -10) p.y = height + 10;
            if (p.y > height + 10) p.y = -10;
        }
    }

    draw(colorMap = 'bioluminescent') {
        if (!this.enabled) return;

        push();
        noStroke();

        // Get base color from current color map (use bright end)
        const colors = ColorMaps[colorMap] || ColorMaps.bioluminescent;
        const baseColor = colors[colors.length - 2]; // Second brightest

        for (let p of this.particles) {
            // Calculate twinkle effect
            const twinkle = 0.5 + 0.5 * Math.sin(p.twinkle);
            const alpha = p.opacity * twinkle * 255;

            // Draw particle with soft glow
            fill(baseColor[0], baseColor[1], baseColor[2], alpha * 0.3);
            ellipse(p.x, p.y, p.size * 3, p.size * 3);

            fill(baseColor[0], baseColor[1], baseColor[2], alpha * 0.7);
            ellipse(p.x, p.y, p.size * 1.5, p.size * 1.5);

            fill(255, 255, 255, alpha);
            ellipse(p.x, p.y, p.size * 0.5, p.size * 0.5);
        }

        pop();
    }

    setEnabled(enabled) {
        this.enabled = enabled;
    }

    resize() {
        // Redistribute particles when window resizes
        for (let p of this.particles) {
            if (p.x > width) p.x = Math.random() * width;
            if (p.y > height) p.y = Math.random() * height;
        }
    }
}

// Phase 12: Signal visualization toggles
let showAlarmSignals = false;
let showHuntingSignals = false;
let showMatingSignals = false;
let showTerritorySignals = false;

// Phase 14: Migration visualization toggles (defined in ui.js, referenced here)
// showMigrationTrails and showZoneCenters are in ui.js

// Color maps
const ColorMaps = {
    viridis: [
        [68, 1, 84], [72, 40, 120], [62, 74, 137], [49, 104, 142],
        [38, 130, 142], [31, 158, 137], [53, 183, 121], [109, 205, 89],
        [180, 222, 44], [253, 231, 37]
    ],
    plasma: [
        [13, 8, 135], [75, 3, 161], [125, 3, 168], [168, 34, 150],
        [203, 70, 121], [229, 107, 93], [248, 148, 65], [253, 195, 40],
        [240, 249, 33]
    ],
    magma: [
        [0, 0, 4], [28, 16, 68], [79, 18, 123], [129, 37, 129],
        [181, 54, 122], [229, 80, 100], [251, 135, 97], [254, 194, 135],
        [252, 253, 191]
    ],
    inferno: [
        [0, 0, 4], [40, 11, 84], [101, 21, 110], [159, 42, 99],
        [212, 72, 66], [245, 125, 21], [250, 193, 39], [252, 255, 164]
    ],
    ocean: [
        [0, 0, 20], [0, 20, 60], [0, 50, 100], [0, 100, 140],
        [20, 150, 180], [60, 200, 200], [120, 230, 220], [200, 250, 250]
    ],
    grayscale: [
        [0, 0, 0], [30, 30, 30], [60, 60, 60], [90, 90, 90],
        [120, 120, 120], [150, 150, 150], [180, 180, 180], [210, 210, 210],
        [240, 240, 240], [255, 255, 255]
    ],
    // New aquarium-focused palettes
    bioluminescent: [
        [2, 4, 15], [5, 10, 30], [10, 20, 50], [15, 35, 70],
        [20, 60, 100], [40, 100, 140], [60, 150, 180], [100, 200, 220],
        [150, 230, 255], [200, 255, 255]
    ],
    microscopy: [
        [10, 5, 2], [30, 18, 8], [50, 32, 15], [80, 55, 25],
        [120, 85, 40], [160, 120, 60], [200, 160, 90], [230, 200, 130],
        [250, 235, 180], [255, 250, 220]
    ],
    cosmic: [
        [5, 2, 15], [20, 8, 40], [40, 15, 70], [70, 25, 100],
        [110, 40, 130], [150, 60, 160], [190, 90, 180], [220, 130, 200],
        [240, 180, 220], [255, 220, 255]
    ],
    aurora: [
        [8, 20, 30], [18, 40, 55], [30, 65, 75], [50, 95, 95],
        [75, 125, 115], [105, 160, 135], [140, 195, 160], [180, 225, 190],
        [215, 250, 220], [240, 255, 245]
    ],
    ember: [
        [5, 2, 2], [20, 8, 5], [45, 15, 10], [80, 25, 15],
        [120, 40, 20], [170, 60, 25], [210, 90, 30], [240, 130, 50],
        [255, 180, 90], [255, 230, 150]
    ]
};

class Lenia {
    constructor(size) {
        this.size = size;
        this.grid = new Float32Array(size * size);
        this.nextGrid = new Float32Array(size * size);
        this.potential = new Float32Array(size * size);

        // Default parameters (Orbium-like)
        this.R = 13;           // Kernel radius
        this.peaks = 1;        // Number of kernel peaks
        this.mu = 0.15;        // Growth function center
        this.sigma = 0.015;    // Growth function width
        this.dt = 0.1;         // Time step

        // Kernel configuration
        this.kernelType = 'ring';
        this.kernelParams = {
            // Spiral params
            arms: 3,
            tightness: 1.5,
            // Star params
            points: 5,
            sharpness: 0.5,
            // Multi-scale params
            scales: [0.3, 0.6, 0.9],
            weights: [1, 0.5, 0.25],
            // Anisotropic params
            angle: 0,
            eccentricity: 0.6,
            // Asymmetric params
            bias: 0.3
        };

        this.kernel = null;
        this.colorMap = 'viridis';

        // FFT convolution for O(N² log N) performance
        this.fftConvolver = FFT.createConvolver(size);

        this.updateKernel();
    }

    /**
     * Update the convolution kernel based on current parameters
     */
    updateKernel() {
        const p = this.kernelParams;
        switch (this.kernelType) {
            case 'bump4':
                this.kernel = Kernels.bump4(this.R);
                break;
            case 'quad4':
                this.kernel = Kernels.quad4(this.R, p.betas || [1, 1, 1]);
                break;
            case 'ring':
                this.kernel = Kernels.ring(this.R, this.peaks);
                break;
            case 'gaussian':
                this.kernel = Kernels.gaussian(this.R);
                break;
            case 'filled':
                this.kernel = Kernels.filled(this.R, p.falloff || 1.0);
                break;
            case 'mexicanHat':
                this.kernel = Kernels.mexicanHat(this.R);
                break;
            case 'asymmetric':
                this.kernel = Kernels.asymmetric(this.R, p.bias);
                break;
            case 'spiral':
                this.kernel = Kernels.spiral(this.R, p.arms, p.tightness);
                break;
            case 'star':
                this.kernel = Kernels.star(this.R, p.points, p.sharpness);
                break;
            case 'multiScale':
                this.kernel = Kernels.multiScale(this.R, p.scales, p.weights);
                break;
            case 'anisotropic':
                this.kernel = Kernels.anisotropic(this.R, p.angle, p.eccentricity);
                break;
            default:
                this.kernel = Kernels.ring(this.R, this.peaks);
        }

        // Update FFT convolver with new kernel
        if (this.fftConvolver) {
            this.fftConvolver.setKernel(this.kernel);
        }
    }

    /**
     * Growth function G(u)
     * Returns how much a cell should grow/shrink based on its neighborhood potential
     * Uses a Gaussian bell curve centered at mu with width sigma
     *
     * G(u) = 2 * exp(-((u - mu)^2) / (2 * sigma^2)) - 1
     *
     * This maps to [-1, 1]:
     * - Returns 1 (max growth) when u = mu
     * - Returns -1 (max decay) when u is far from mu
     */
    growth(u) {
        const d = (u - this.mu) / this.sigma;
        return 2 * Math.exp(-d * d / 2) - 1;
    }

    /**
     * Perform convolution to compute neighborhood potential
     * Uses FFT for O(N² log N) performance instead of O(N² × K²) naive convolution
     * Toroidal (wrap-around) boundary conditions are handled naturally by FFT
     */
    convolve() {
        // FFT convolution: IFFT(FFT(grid) × FFT(kernel))
        // The kernel FFT is cached and only recomputed when parameters change
        this.fftConvolver.convolve(this.grid, this.potential);
    }

    /**
     * Update step: apply growth function and integrate
     */
    step() {
        const { size, grid, nextGrid, potential, dt } = this;

        // Compute neighborhood potential
        this.convolve();

        // Apply growth function and update
        for (let i = 0; i < size * size; i++) {
            const g = this.growth(potential[i]);
            // Euler integration with clamping
            nextGrid[i] = Math.max(0, Math.min(1, grid[i] + dt * g));
        }

        // Swap buffers
        [this.grid, this.nextGrid] = [this.nextGrid, this.grid];
    }

    /**
     * Calculate total mass (sum of all cell values)
     */
    totalMass() {
        let sum = 0;
        for (let i = 0; i < this.grid.length; i++) {
            sum += this.grid[i];
        }
        return sum;
    }

    /**
     * Clear the grid
     */
    clear() {
        this.grid.fill(0);
    }

    /**
     * Fill with random noise
     */
    randomize(density = 0.3, clumpiness = 0.5) {
        // Create random clumps for more interesting initial conditions
        const numClumps = Math.floor(this.size * this.size * density * 0.001);

        this.clear();

        for (let c = 0; c < numClumps; c++) {
            const cx = Math.random() * this.size;
            const cy = Math.random() * this.size;
            const radius = 5 + Math.random() * 20;

            for (let y = 0; y < this.size; y++) {
                for (let x = 0; x < this.size; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < radius) {
                        const value = (1 - dist / radius) * (0.5 + Math.random() * 0.5);
                        const idx = y * this.size + x;
                        this.grid[idx] = Math.min(1, this.grid[idx] + value * clumpiness);
                    }
                }
            }
        }

        // Add some noise
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i] = Math.min(1, this.grid[i] + Math.random() * 0.1);
        }
    }

    /**
     * Draw a blob at position (smooth circular brush)
     */
    drawBlob(x, y, radius, value = 1.0) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy) / radius;
                if (dist <= 1) {
                    const gx = (Math.floor(x) + dx + this.size) % this.size;
                    const gy = (Math.floor(y) + dy + this.size) % this.size;
                    const idx = gy * this.size + gx;
                    const brushVal = value * (1 - dist * dist);

                    if (value > 0) {
                        this.grid[idx] = Math.min(1, this.grid[idx] + brushVal * 0.3);
                    } else {
                        this.grid[idx] = Math.max(0, this.grid[idx] + brushVal * 0.3);
                    }
                }
            }
        }
    }

    /**
     * Load a species preset
     */
    loadSpecies(speciesKey) {
        const species = Species[speciesKey];
        if (!species) return;

        this.R = species.params.R;
        this.peaks = species.params.peaks;
        this.mu = species.params.mu;
        this.sigma = species.params.sigma;
        this.dt = species.params.dt;

        // Load kernel type if specified
        if (species.params.kernelType) {
            this.kernelType = species.params.kernelType;
        } else {
            this.kernelType = 'ring';
        }

        // Load kernel-specific params if available
        if (species.params.kernelParams) {
            Object.assign(this.kernelParams, species.params.kernelParams);
        }

        // Load betas for quad4 kernel (Geminidae family)
        if (species.params.betas) {
            this.kernelParams.betas = species.params.betas;
        }

        this.updateKernel();

        // Place pattern at center
        if (species.pattern) {
            this.clear();
            Species.placePattern(
                this.grid,
                this.size,
                species.pattern,
                Math.floor(this.size / 2),
                Math.floor(this.size / 2)
            );
        }
    }

    /**
     * Resize the simulation grid
     */
    resize(newSize) {
        if (newSize === this.size) return;

        const oldGrid = this.grid;
        const oldSize = this.size;

        this.size = newSize;
        this.grid = new Float32Array(newSize * newSize);
        this.nextGrid = new Float32Array(newSize * newSize);
        this.potential = new Float32Array(newSize * newSize);

        // Recreate FFT convolver for new size
        this.fftConvolver = FFT.createConvolver(newSize);
        // Re-set the kernel FFT for the new convolver
        if (this.kernel) {
            this.fftConvolver.setKernel(this.kernel);
        }

        // Simple nearest-neighbor scaling
        const scale = oldSize / newSize;
        for (let y = 0; y < newSize; y++) {
            for (let x = 0; x < newSize; x++) {
                const ox = Math.min(Math.floor(x * scale), oldSize - 1);
                const oy = Math.min(Math.floor(y * scale), oldSize - 1);
                this.grid[y * newSize + x] = oldGrid[oy * oldSize + ox];
            }
        }
    }

    /**
     * Get color for a cell value using current color map
     */
    getColor(value) {
        const colors = ColorMaps[this.colorMap] || ColorMaps.viridis;
        const t = Math.max(0, Math.min(1, value));
        const idx = t * (colors.length - 1);
        const i = Math.floor(idx);
        const f = idx - i;

        if (i >= colors.length - 1) {
            return colors[colors.length - 1];
        }

        // Linear interpolation between colors
        const c1 = colors[i];
        const c2 = colors[i + 1];
        return [
            Math.round(c1[0] + (c2[0] - c1[0]) * f),
            Math.round(c1[1] + (c2[1] - c1[1]) * f),
            Math.round(c1[2] + (c2[2] - c1[2]) * f)
        ];
    }
}

// p5.js setup and draw
function setup() {
    const container = document.getElementById('canvas-container');
    const canvasSize = Math.min(container.clientWidth, container.clientHeight) - 40;

    const canvas = createCanvas(canvasSize, canvasSize);
    canvas.parent('canvas-container');

    pixelDensity(1);
    noSmooth();

    // Initialize Lenia
    lenia = new Lenia(256);
    lenia.loadSpecies('orbium');

    // Initialize ambient particle system for Living Aquarium
    ambientParticles = new AmbientParticleSystem(80);

    // Initialize UI
    initUI();

    lastFrameTime = millis();
}

function draw() {
    // Calculate FPS
    const now = millis();
    fps = 1000 / (now - lastFrameTime);
    lastFrameTime = now;

    // Update simulation based on mode
    if (!paused) {
        if (typeof currentMode !== 'undefined' && currentMode === 'ecosystem' && multiChannel) {
            multiChannel.step();
        } else if (typeof useFlowLenia !== 'undefined' && useFlowLenia && flowLenia) {
            flowLenia.step();
            // Update mass stats periodically
            if (generation % 10 === 0 && typeof updateMassStats === 'function') {
                updateMassStats();
            }
            // Update sensory stats periodically
            if (generation % 10 === 0 && typeof updateSensoryStats === 'function') {
                updateSensoryStats();
            }
        } else {
            lenia.step();
        }
        generation++;
    }

    // Render based on mode
    loadPixels();

    if (typeof currentMode !== 'undefined' && currentMode === 'ecosystem' && multiChannel) {
        // Ecosystem mode: composite RGB rendering
        const cellSize = width / multiChannel.size;

        for (let y = 0; y < multiChannel.size; y++) {
            for (let x = 0; x < multiChannel.size; x++) {
                const cellIdx = y * multiChannel.size + x;
                const color = multiChannel.getCompositeColor(cellIdx);

                const px = Math.floor(x * cellSize);
                const py = Math.floor(y * cellSize);
                const pxEnd = Math.floor((x + 1) * cellSize);
                const pyEnd = Math.floor((y + 1) * cellSize);

                for (let py2 = py; py2 < pyEnd; py2++) {
                    for (let px2 = px; px2 < pxEnd; px2++) {
                        if (px2 < width && py2 < height) {
                            const idx = (py2 * width + px2) * 4;
                            pixels[idx] = color[0];
                            pixels[idx + 1] = color[1];
                            pixels[idx + 2] = color[2];
                            pixels[idx + 3] = 255;
                        }
                    }
                }
            }
        }
    } else {
        // Single channel mode: color map rendering
        // Use flow lenia or standard lenia based on mode
        const sim = (typeof useFlowLenia !== 'undefined' && useFlowLenia && flowLenia) ? flowLenia : lenia;
        const cellSize = width / sim.size;

        for (let y = 0; y < sim.size; y++) {
            for (let x = 0; x < sim.size; x++) {
                const cellIdx = y * sim.size + x;
                const value = sim.grid[cellIdx];
                let color = sim.getColor(value);

                // Phase 4: Apply environment overlays if sensory mode is active
                if (typeof sensoryEnabled !== 'undefined' && sensoryEnabled && typeof environment !== 'undefined' && environment) {
                    let r = color[0], g = color[1], b = color[2];

                    // Food overlay (green tint)
                    if (typeof showFoodOverlay !== 'undefined' && showFoodOverlay) {
                        const foodVal = environment.food[cellIdx];
                        if (foodVal > 0.05) {
                            const foodIntensity = Math.min(1, foodVal) * 0.5;
                            g = Math.min(255, g + foodIntensity * 150);
                            b = Math.min(255, b + foodIntensity * 30);
                        }
                    }

                    // Pheromone overlay (magenta tint)
                    if (typeof showPheromoneOverlay !== 'undefined' && showPheromoneOverlay) {
                        const pheromoneVal = environment.pheromone[cellIdx];
                        if (pheromoneVal > 0.02) {
                            const pherIntensity = Math.min(1, pheromoneVal * 2) * 0.6;
                            r = Math.min(255, r + pherIntensity * 180);
                            b = Math.min(255, b + pherIntensity * 140);
                        }
                    }

                    // Phase 12: Bioluminescent signal overlays (additive blending)
                    // Alarm signals - red/orange pulse
                    if (typeof showAlarmSignals !== 'undefined' && showAlarmSignals) {
                        const alarmVal = environment.alarmSignal[cellIdx];
                        if (alarmVal > 0.01) {
                            const intensity = Math.min(1, alarmVal * 2) * 0.7;
                            r = Math.min(255, r + intensity * 255);
                            g = Math.min(255, g + intensity * 100);
                            b = Math.min(255, b + intensity * 50);
                        }
                    }

                    // Hunting signals - magenta glow
                    if (typeof showHuntingSignals !== 'undefined' && showHuntingSignals) {
                        const huntingVal = environment.huntingSignal[cellIdx];
                        if (huntingVal > 0.01) {
                            const intensity = Math.min(1, huntingVal * 2) * 0.6;
                            r = Math.min(255, r + intensity * 255);
                            g = Math.min(255, g + intensity * 50);
                            b = Math.min(255, b + intensity * 200);
                        }
                    }

                    // Mating signals - cyan/blue pulse
                    if (typeof showMatingSignals !== 'undefined' && showMatingSignals) {
                        const matingVal = environment.matingSignal[cellIdx];
                        if (matingVal > 0.01) {
                            const intensity = Math.min(1, matingVal * 2) * 0.7;
                            r = Math.min(255, r + intensity * 50);
                            g = Math.min(255, g + intensity * 200);
                            b = Math.min(255, b + intensity * 255);
                        }
                    }

                    // Territory signals - green aura
                    if (typeof showTerritorySignals !== 'undefined' && showTerritorySignals) {
                        const territoryVal = environment.territorySignal[cellIdx];
                        if (territoryVal > 0.01) {
                            const intensity = Math.min(1, territoryVal * 2) * 0.5;
                            r = Math.min(255, r + intensity * 50);
                            g = Math.min(255, g + intensity * 255);
                            b = Math.min(255, b + intensity * 100);
                        }
                    }

                    // Phase 14: Migration trails - golden/amber overlay
                    if (typeof showMigrationTrails !== 'undefined' && showMigrationTrails) {
                        const trailVal = environment.migrationTrails[cellIdx];
                        if (trailVal > 0.02) {
                            const intensity = Math.min(1, trailVal * 3) * 0.6;
                            r = Math.min(255, r + intensity * 255);
                            g = Math.min(255, g + intensity * 180);
                            b = Math.min(255, b + intensity * 50);
                        }
                    }

                    color = [Math.round(r), Math.round(g), Math.round(b)];
                }

                const px = Math.floor(x * cellSize);
                const py = Math.floor(y * cellSize);
                const pxEnd = Math.floor((x + 1) * cellSize);
                const pyEnd = Math.floor((y + 1) * cellSize);

                for (let py2 = py; py2 < pyEnd; py2++) {
                    for (let px2 = px; px2 < pxEnd; px2++) {
                        if (px2 < width && py2 < height) {
                            const idx = (py2 * width + px2) * 4;
                            pixels[idx] = color[0];
                            pixels[idx + 1] = color[1];
                            pixels[idx + 2] = color[2];
                            pixels[idx + 3] = 255;
                        }
                    }
                }
            }
        }
    }
    updatePixels();

    // Phase 4: Draw creature headings overlay
    if (typeof sensoryEnabled !== 'undefined' && sensoryEnabled &&
        typeof showHeadingsOverlay !== 'undefined' && showHeadingsOverlay &&
        typeof creatureTracker !== 'undefined' && creatureTracker) {
        drawCreatureHeadings();
    }

    // Phase 9: Draw sensor cones overlay
    if (typeof sensoryEnabled !== 'undefined' && sensoryEnabled &&
        typeof showSensorsOverlay !== 'undefined' && showSensorsOverlay &&
        typeof creatureTracker !== 'undefined' && creatureTracker) {
        drawSensorCones();
    }

    // Phase 12: Draw creature glow based on recent signal emissions
    if (typeof sensoryEnabled !== 'undefined' && sensoryEnabled &&
        typeof creatureTracker !== 'undefined' && creatureTracker) {
        drawCreatureGlow();
    }

    // Phase 13: Draw flock links showing alignment neighbors
    if (typeof sensoryEnabled !== 'undefined' && sensoryEnabled &&
        typeof showFlockingOverlay !== 'undefined' && showFlockingOverlay &&
        typeof creatureTracker !== 'undefined' && creatureTracker) {
        drawFlockLinks();
    }

    // Phase 14: Draw migration zone centers
    if (typeof sensoryEnabled !== 'undefined' && sensoryEnabled &&
        typeof showZoneCenters !== 'undefined' && showZoneCenters &&
        typeof environment !== 'undefined' && environment &&
        environment.params.movingZonesEnabled) {
        drawZoneCenters();
    }

    // Phase 15: Draw energy bars above creatures
    if (typeof sensoryEnabled !== 'undefined' && sensoryEnabled &&
        typeof evolutionEnabled !== 'undefined' && evolutionEnabled &&
        typeof creatureTracker !== 'undefined' && creatureTracker) {
        drawCreatureEnergyBars();
    }

    // Living Aquarium: Draw ambient particles (most visible in Zen mode)
    if (ambientParticles) {
        // Get creatures for particle interaction
        const creatures = (typeof creatureTracker !== 'undefined' && creatureTracker)
            ? creatureTracker.getCreatures() : [];

        // Only update/draw in Zen mode or when explicitly enabled
        if (zenModeActive) {
            ambientParticles.setEnabled(true);
            ambientParticles.update(creatures);
            const sim = (typeof useFlowLenia !== 'undefined' && useFlowLenia && flowLenia) ? flowLenia : lenia;
            ambientParticles.draw(sim.colorMap);
        } else {
            ambientParticles.setEnabled(false);
        }
    }

    // Update stats
    updateStats();
}

/**
 * Phase 4: Draw heading vectors for each detected creature
 */
function drawCreatureHeadings() {
    if (!creatureTracker || creatureTracker.count === 0) return;
    if (zenModeActive) return;  // Hide in Zen mode for cleaner aesthetic

    const sim = flowLenia || lenia;
    const cellSize = width / sim.size;

    push();
    stroke(255, 255, 0);
    strokeWeight(2);

    for (const creature of creatureTracker.getCreatures()) {
        const screenX = creature.x * cellSize;
        const screenY = creature.y * cellSize;
        const arrowLen = Math.min(30, creature.radius * cellSize * 2);

        // Draw heading arrow
        const endX = screenX + Math.cos(creature.heading) * arrowLen;
        const endY = screenY + Math.sin(creature.heading) * arrowLen;

        line(screenX, screenY, endX, endY);

        // Arrowhead
        const arrowSize = 6;
        const angle = creature.heading;
        const ax1 = endX - arrowSize * Math.cos(angle - 0.4);
        const ay1 = endY - arrowSize * Math.sin(angle - 0.4);
        const ax2 = endX - arrowSize * Math.cos(angle + 0.4);
        const ay2 = endY - arrowSize * Math.sin(angle + 0.4);
        line(endX, endY, ax1, ay1);
        line(endX, endY, ax2, ay2);

        // Creature ID label
        noStroke();
        fill(255, 255, 0);
        textSize(10);
        textAlign(CENTER, CENTER);
        text(creature.id, screenX, screenY - arrowLen - 5);
    }

    pop();
}

/**
 * Phase 9: Draw sensor cones showing each creature's sensing direction and focus
 */
function drawSensorCones() {
    if (!creatureTracker || creatureTracker.count === 0) return;

    const sim = flowLenia || lenia;
    const cellSize = width / sim.size;

    push();
    noStroke();

    for (const creature of creatureTracker.getCreatures()) {
        if (!creature.genome) continue;

        const screenX = creature.x * cellSize;
        const screenY = creature.y * cellSize;

        // Get sensor parameters from genome
        const sensorAngle = creature.genome.sensorAngle || 0;
        const sensorFocus = creature.genome.sensorFocus || 0;

        // Sensor direction = creature heading + genome's sensor angle offset
        const sensorDir = creature.heading + sensorAngle;

        // Cone half-angle: high focus = narrow cone, low focus = wide cone
        // At focus=0: full circle (PI radians half-angle)
        // At focus=1: very narrow (but we keep a minimum of PI/12 for visibility)
        const minConeAngle = PI / 12;  // 15 degrees minimum
        const coneHalfAngle = Math.max(minConeAngle, PI * (1 - sensorFocus));

        // Cone radius based on creature size
        const coneRadius = creature.radius * cellSize * 2.5;

        // Color based on whether creature is a predator
        const isPredator = creature.genome.isPredator;
        if (isPredator) {
            fill(255, 100, 100, 50);  // Red with 20% alpha (50/255)
        } else {
            fill(100, 200, 255, 50);  // Blue with 20% alpha (50/255)
        }

        // Draw the arc (sensor cone)
        arc(screenX, screenY, coneRadius * 2, coneRadius * 2,
            sensorDir - coneHalfAngle, sensorDir + coneHalfAngle, PIE);
    }

    pop();
}

/**
 * Phase 12: Draw glowing aura around creatures that recently emitted signals
 * Enhanced for Living Aquarium aesthetic
 */
function drawCreatureGlow() {
    if (!creatureTracker || creatureTracker.count === 0) return;

    const sim = flowLenia || lenia;
    const cellSize = width / sim.size;

    push();
    noStroke();

    for (const creature of creatureTracker.getCreatures()) {
        const screenX = creature.x * cellSize;
        const screenY = creature.y * cellSize;

        // Always draw a subtle ambient glow for living creatures (Living Aquarium feature)
        if (typeof zenModeActive !== 'undefined' && zenModeActive) {
            // Enhanced glow in Zen mode
            const baseRadius = creature.radius * cellSize * 2.5;
            const energy = creature.energy || 50;
            const energyNorm = Math.min(1, energy / 80);

            // Outer soft glow - color based on creature type
            const isPredator = creature.genome?.isPredator;
            let glowR, glowG, glowB;
            if (isPredator) {
                glowR = 255; glowG = 100; glowB = 100;
            } else {
                glowR = 100; glowG = 200; glowB = 255;
            }

            // Pulsing effect based on time
            const pulse = 0.7 + 0.3 * Math.sin(millis() * 0.003 + creature.id * 0.5);

            // Outer glow
            fill(glowR, glowG, glowB, 15 * pulse * energyNorm);
            ellipse(screenX, screenY, baseRadius * 3, baseRadius * 3);

            // Middle glow
            fill(glowR, glowG, glowB, 25 * pulse * energyNorm);
            ellipse(screenX, screenY, baseRadius * 2, baseRadius * 2);

            // Inner glow
            fill(glowR, glowG, glowB, 40 * pulse * energyNorm);
            ellipse(screenX, screenY, baseRadius * 1.3, baseRadius * 1.3);
        }

        // Signal-based glow (original behavior)
        const recentSignal = creatureTracker.getRecentSignal(creature);
        if (!recentSignal) continue;

        const glowRadius = creature.radius * cellSize * 3;

        // Get signal color
        const signalColor = CreatureTracker.getSignalColor(recentSignal.type);
        const alpha = Math.floor(recentSignal.intensity * 100);

        // Draw glowing rings (expanding outward)
        for (let ring = 3; ring >= 1; ring--) {
            const ringRadius = glowRadius * (1 + (3 - ring) * 0.3);
            const ringAlpha = Math.floor(alpha * ring / 4);
            fill(signalColor[0], signalColor[1], signalColor[2], ringAlpha);
            ellipse(screenX, screenY, ringRadius * 2, ringRadius * 2);
        }

        // Inner bright core
        fill(signalColor[0], signalColor[1], signalColor[2], alpha * 2);
        ellipse(screenX, screenY, creature.radius * cellSize * 2, creature.radius * cellSize * 2);
    }

    pop();
}

/**
 * Phase 15: Draw energy bars above each creature
 * Color gradient: red (dying) → yellow → green (thriving)
 */
function drawCreatureEnergyBars() {
    if (!creatureTracker || creatureTracker.count === 0) return;
    if (!evolutionEnabled) return;  // Only show when evolution is active
    if (zenModeActive) return;  // Hide in Zen mode for cleaner aesthetic

    const sim = flowLenia || lenia;
    const cellSize = width / sim.size;

    push();
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(8);

    for (const creature of creatureTracker.getCreatures()) {
        if (!creature.genome) continue;

        const screenX = creature.x * cellSize;
        const screenY = creature.y * cellSize;

        // Position bar above creature
        const barY = screenY - creature.radius * cellSize * 1.5 - 15;
        const barWidth = 30;
        const barHeight = 6;

        // Calculate energy percentage (relative to reproduction threshold)
        const maxEnergy = creature.genome.reproductionThreshold * 1.5;
        const energyPercent = Math.min(1, creature.energy / maxEnergy);

        // Color gradient: red (0) → yellow (0.5) → green (1)
        let r, g, b;
        if (energyPercent < 0.3) {
            // Red zone (dying)
            r = 255;
            g = Math.floor(energyPercent / 0.3 * 100);
            b = 0;
        } else if (energyPercent < 0.6) {
            // Yellow zone (low)
            const t = (energyPercent - 0.3) / 0.3;
            r = 255;
            g = 100 + Math.floor(t * 155);
            b = 0;
        } else {
            // Green zone (thriving)
            const t = (energyPercent - 0.6) / 0.4;
            r = Math.floor(255 * (1 - t));
            g = 255;
            b = Math.floor(t * 100);
        }

        // Draw background (dark)
        fill(40, 40, 40, 180);
        rect(screenX - barWidth / 2 - 1, barY - 1, barWidth + 2, barHeight + 2, 2);

        // Draw energy fill
        fill(r, g, b, 220);
        const fillWidth = barWidth * energyPercent;
        rect(screenX - barWidth / 2, barY, fillWidth, barHeight, 1);

        // Draw energy number
        fill(255, 255, 255, 200);
        text(Math.floor(creature.energy), screenX, barY - 8);

        // Add predator indicator
        if (creature.genome.isPredator) {
            fill(255, 100, 100);
            text('🔴', screenX + barWidth / 2 + 8, barY + 3);
        }
    }

    pop();
}

/**
 * Phase 13: Draw lines between flocking neighbors to visualize alignment
 */
function drawFlockLinks() {
    if (!creatureTracker || creatureTracker.count === 0) return;

    const sim = flowLenia || lenia;
    const cellSize = width / sim.size;
    const size = sim.size;

    push();
    strokeWeight(1);

    for (const creature of creatureTracker.getCreatures()) {
        // Only draw for non-predators with alignment behavior
        if (!creature.genome) continue;
        if (creature.genome.isPredator) continue;
        if (creature.genome.alignmentWeight <= 0) continue;

        const screenX = creature.x * cellSize;
        const screenY = creature.y * cellSize;
        const flockRadius = creature.genome.flockingRadius;

        // Find neighbors within flocking radius
        for (const other of creatureTracker.getCreatures()) {
            if (other.id === creature.id) continue;
            if (other.genome && other.genome.isPredator) continue;

            // Calculate toroidal distance
            let dx = other.x - creature.x;
            let dy = other.y - creature.y;
            if (dx > size / 2) dx -= size;
            if (dx < -size / 2) dx += size;
            if (dy > size / 2) dy -= size;
            if (dy < -size / 2) dy += size;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < flockRadius && dist > 5) {
                // Draw link with alpha based on distance (closer = stronger)
                // Base alpha of 40, plus up to 120 more for close neighbors
                const alpha = Math.floor(40 + 120 * (1 - dist / flockRadius));
                stroke(100, 200, 255, alpha);

                const otherScreenX = creature.x * cellSize + dx * cellSize;
                const otherScreenY = creature.y * cellSize + dy * cellSize;
                line(screenX, screenY, otherScreenX, otherScreenY);
            }
        }
    }

    pop();
}

/**
 * Phase 14: Draw migration zone centers as bright pulsing indicators
 */
function drawZoneCenters() {
    if (!environment || !environment.migrationZones) return;

    const sim = flowLenia || lenia;
    const cellSize = width / sim.size;
    const zones = environment.getMigrationZones();

    push();
    noStroke();

    for (const zone of zones) {
        const screenX = zone.x * cellSize;
        const screenY = zone.y * cellSize;

        // Pulsing effect based on time
        const pulse = 0.7 + 0.3 * Math.sin(millis() * 0.005);

        // Outer glow (larger, more transparent)
        const glowRadius = environment.params.zoneRadius * cellSize * 0.8;
        fill(255, 220, 100, 30 * pulse);
        ellipse(screenX, screenY, glowRadius * 2, glowRadius * 2);

        // Middle ring
        fill(255, 200, 50, 60 * pulse);
        ellipse(screenX, screenY, glowRadius * 1.2, glowRadius * 1.2);

        // Inner bright core
        fill(255, 255, 150, 150 * pulse);
        ellipse(screenX, screenY, 12, 12);

        // Center point
        fill(255, 255, 255);
        ellipse(screenX, screenY, 4, 4);
    }

    pop();
}

function updateStats() {
    document.getElementById('stat-fps').textContent = fps.toFixed(1);

    if (typeof currentMode !== 'undefined' && currentMode === 'ecosystem' && multiChannel) {
        document.getElementById('stat-mass').textContent = multiChannel.totalMass().toFixed(1);
    } else if (typeof useFlowLenia !== 'undefined' && useFlowLenia && flowLenia) {
        document.getElementById('stat-mass').textContent = flowLenia.totalMass().toFixed(1);
    } else {
        document.getElementById('stat-mass').textContent = lenia.totalMass().toFixed(1);
    }

    document.getElementById('stat-gen').textContent = generation;
}

// Mouse interaction
let isDrawing = false;
let drawMode = 1; // 1 = add, -1 = erase

function mousePressed() {
    if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
        isDrawing = true;
        drawMode = keyIsDown(SHIFT) ? -1 : 1;
        handleDraw();
    }
}

function mouseReleased() {
    isDrawing = false;
}

function mouseDragged() {
    if (isDrawing) {
        handleDraw();
    }
}

function handleDraw() {
    if (mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
        const brushSize = parseInt(document.getElementById('brush-size').value);

        if (typeof currentMode !== 'undefined' && currentMode === 'ecosystem' && multiChannel) {
            const cellSize = width / multiChannel.size;
            const gx = mouseX / cellSize;
            const gy = mouseY / cellSize;
            multiChannel.drawBlob(multiChannel.activeChannel, gx, gy, brushSize / cellSize * 2, drawMode);
        } else if (typeof useFlowLenia !== 'undefined' && useFlowLenia && flowLenia) {
            const cellSize = width / flowLenia.size;
            const gx = mouseX / cellSize;
            const gy = mouseY / cellSize;
            flowLenia.drawBlob(gx, gy, brushSize / cellSize * 2, drawMode);
            // Update initial mass after drawing
            if (typeof initialMass !== 'undefined') {
                initialMass = flowLenia.totalMass();
                if (typeof updateMassStats === 'function') {
                    updateMassStats();
                }
            }
        } else {
            const cellSize = width / lenia.size;
            const gx = mouseX / cellSize;
            const gy = mouseY / cellSize;
            lenia.drawBlob(gx, gy, brushSize / cellSize * 2, drawMode);
        }
    }
}

// Keyboard shortcuts
function keyPressed() {
    // ESC exits Zen mode
    if (keyCode === ESCAPE && zenModeActive) {
        exitZenMode();
        return false;
    }
    if (key === ' ') {
        paused = !paused;
        document.getElementById('btn-pause').textContent = paused ? 'Resume' : 'Pause';
        return false; // Prevent scrolling
    }
    if (key === 'r' || key === 'R') {
        resetSimulation();
    }
    if (key === 'c' || key === 'C') {
        lenia.clear();
        generation = 0;
    }
    if (key === 's' || key === 'S') {
        saveScreenshot();
    }
    if (key === 'z' || key === 'Z') {
        toggleZenMode();
    }
}

/**
 * Toggle Zen Mode - immersive fullscreen viewing
 */
function toggleZenMode() {
    if (zenModeActive) {
        exitZenMode();
    } else {
        enterZenMode();
    }
}

/**
 * Enter Zen Mode - hide UI, fullscreen canvas, spawn peaceful ecosystem
 */
function enterZenMode() {
    zenModeActive = true;

    // Hide controls panel
    const controls = document.getElementById('controls');
    if (controls) {
        controls.style.display = 'none';
    }

    // Add zen mode class to body
    document.body.classList.add('zen-mode');

    // Make canvas container fullscreen
    const container = document.getElementById('canvas-container');
    if (container) {
        container.classList.add('zen-fullscreen');
    }

    // Show the zen hint
    const zenHint = document.getElementById('zen-hint');
    if (zenHint) {
        zenHint.style.display = 'block';
    }

    // Resize canvas to fill screen
    resizeCanvas(windowWidth, windowHeight);

    // Resize and redistribute particles for fullscreen
    if (ambientParticles) {
        ambientParticles.resize();
    }

    // If simulation is empty or very sparse, spawn a peaceful ecosystem
    const sim = (typeof useFlowLenia !== 'undefined' && useFlowLenia && flowLenia) ? flowLenia : lenia;
    if (sim.totalMass() < 100) {
        // Auto-setup for peaceful viewing
        if (typeof setFlowMode === 'function') {
            setFlowMode(true);
        }
        if (typeof setSensoryMode === 'function') {
            setSensoryMode(true);
        }
        if (typeof setEvolutionMode === 'function') {
            setEvolutionMode(true);
        }

        // Spawn peaceful grazers and schoolers (no predators for zen mode)
        if (flowLenia && creatureTracker && environment) {
            flowLenia.clear();
            environment.reset();
            environment.initializeFood();
            // Spawn only prey species for peaceful viewing
            creatureTracker.spawnZenEcosystem(flowLenia, 8);
            initialMass = flowLenia.totalMass();
        }
    }

    // Resume if paused
    if (paused) {
        paused = false;
    }

    // Add click listener to exit zen mode (with delay to avoid immediate trigger)
    setTimeout(() => {
        document.addEventListener('click', zenModeClickHandler);
    }, 500);
}

// Handler for clicking to exit Zen mode
function zenModeClickHandler(e) {
    // Only exit if actually in zen mode and click is on canvas area
    if (zenModeActive) {
        // Don't exit if clicking on UI elements
        const target = e.target;
        if (target.tagName === 'CANVAS' || target.id === 'canvas-container' ||
            target.classList.contains('zen-fullscreen')) {
            exitZenMode();
        }
    }
}

/**
 * Exit Zen Mode - restore UI
 */
function exitZenMode() {
    zenModeActive = false;

    // Show controls panel
    const controls = document.getElementById('controls');
    if (controls) {
        controls.style.display = 'block';
    }

    // Remove zen mode class
    document.body.classList.remove('zen-mode');

    // Remove fullscreen class
    const container = document.getElementById('canvas-container');
    if (container) {
        container.classList.remove('zen-fullscreen');
    }

    // Hide the zen hint
    const zenHint = document.getElementById('zen-hint');
    if (zenHint) {
        zenHint.style.display = 'none';
    }

    // Remove click listener
    document.removeEventListener('click', zenModeClickHandler);

    // Restore canvas size
    windowResized();
}

function resetSimulation() {
    const speciesSelect = document.getElementById('species-select');
    if (typeof useFlowLenia !== 'undefined' && useFlowLenia) {
        flowLenia.loadSpecies(speciesSelect.value);
    } else {
        lenia.loadSpecies(speciesSelect.value);
    }
    generation = 0;
}

function saveScreenshot() {
    const canvas = document.querySelector('canvas');
    if (canvas) {
        // Use enhanced screenshot with vignette
        ScreenshotCapture.download(canvas, null, 'png', true);
    } else {
        // Fallback to p5.js save
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        saveCanvas(`lenia-${timestamp}`, 'png');
    }
}

// Window resize handling
function windowResized() {
    const container = document.getElementById('canvas-container');
    const canvasSize = Math.min(container.clientWidth, container.clientHeight) - 40;
    resizeCanvas(canvasSize, canvasSize);

    // Resize particle system
    if (ambientParticles) {
        ambientParticles.resize();
    }
}
