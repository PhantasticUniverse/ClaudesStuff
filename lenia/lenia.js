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
let paused = false;
let generation = 0;
let lastFrameTime = 0;
let fps = 0;

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

        this.updateKernel();
    }

    /**
     * Update the convolution kernel based on current parameters
     */
    updateKernel() {
        const p = this.kernelParams;
        switch (this.kernelType) {
            case 'ring':
                this.kernel = Kernels.ring(this.R, this.peaks);
                break;
            case 'gaussian':
                this.kernel = Kernels.gaussian(this.R);
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
     * Uses toroidal (wrap-around) boundary conditions
     */
    convolve() {
        const { size, grid, potential, kernel } = this;
        const kSize = kernel.size;
        const kRadius = kernel.radius;

        // Clear potential
        potential.fill(0);

        // Naive convolution (can be optimized with FFT for larger kernels)
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let sum = 0;

                for (let ky = 0; ky < kSize; ky++) {
                    for (let kx = 0; kx < kSize; kx++) {
                        const kernelVal = kernel.data[ky * kSize + kx];
                        if (kernelVal === 0) continue;

                        // Toroidal wrapping
                        const gx = (x + kx - kRadius + size) % size;
                        const gy = (y + ky - kRadius + size) % size;

                        sum += grid[gy * size + gx] * kernelVal;
                    }
                }

                potential[y * size + x] = sum;
            }
        }
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
        const cellSize = width / lenia.size;

        for (let y = 0; y < lenia.size; y++) {
            for (let x = 0; x < lenia.size; x++) {
                const value = lenia.grid[y * lenia.size + x];
                const color = lenia.getColor(value);

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

    // Update stats
    updateStats();
}

function updateStats() {
    document.getElementById('stat-fps').textContent = fps.toFixed(1);

    if (typeof currentMode !== 'undefined' && currentMode === 'ecosystem' && multiChannel) {
        document.getElementById('stat-mass').textContent = multiChannel.totalMass().toFixed(1);
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
}

function resetSimulation() {
    const speciesSelect = document.getElementById('species-select');
    lenia.loadSpecies(speciesSelect.value);
    generation = 0;
}

function saveScreenshot() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    saveCanvas(`lenia-${timestamp}`, 'png');
}

// Window resize handling
function windowResized() {
    const container = document.getElementById('canvas-container');
    const canvasSize = Math.min(container.clientWidth, container.clientHeight) - 40;
    resizeCanvas(canvasSize, canvasSize);
}
