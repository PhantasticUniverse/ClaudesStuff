/**
 * Multi-Channel Lenia - Ecosystems with interacting species
 *
 * Extends the basic Lenia to support multiple interacting "channels" (species).
 * Each channel can have its own kernel and growth parameters, and channels
 * can influence each other through an interaction matrix.
 *
 * This enables emergent behaviors like:
 * - Predator-prey dynamics
 * - Symbiotic relationships
 * - Chemical signaling
 * - Competition for resources
 */

class MultiChannelLenia {
    constructor(size, numChannels = 3) {
        this.size = size;
        this.numChannels = numChannels;

        // Per-channel grids
        this.channels = [];
        this.nextChannels = [];
        this.potentials = [];

        for (let i = 0; i < numChannels; i++) {
            this.channels.push(new Float32Array(size * size));
            this.nextChannels.push(new Float32Array(size * size));
            this.potentials.push(new Float32Array(size * size));
        }

        // Per-channel parameters
        this.channelParams = [];
        for (let i = 0; i < numChannels; i++) {
            this.channelParams.push({
                R: 13,
                peaks: 1,
                mu: 0.15,
                sigma: 0.015,
                kernelType: 'ring',
                kernelParams: {
                    arms: 3,
                    tightness: 1.5,
                    points: 5,
                    sharpness: 0.5,
                    angle: 0,
                    eccentricity: 0.6,
                    bias: 0.3
                },
                kernel: null
            });
        }

        // Interaction matrix: interactions[i][j] = how channel j affects channel i's growth
        // Positive = helps growth, Negative = inhibits growth
        // Default: no cross-channel interaction (identity-like)
        this.interactions = [];
        for (let i = 0; i < numChannels; i++) {
            const row = [];
            for (let j = 0; j < numChannels; j++) {
                row.push(i === j ? 1.0 : 0.0);
            }
            this.interactions.push(row);
        }

        // Global parameters
        this.dt = 0.1;
        this.activeChannel = 0; // Currently selected for editing

        // Channel colors (RGB channels by default)
        this.channelColors = [
            [255, 80, 80],   // Red
            [80, 255, 80],   // Green
            [80, 80, 255],   // Blue
            [255, 200, 80]   // Yellow (if 4 channels)
        ];

        // Initialize kernels
        this.updateAllKernels();
    }

    /**
     * Generate kernel for a specific channel
     */
    updateChannelKernel(channelIdx) {
        const p = this.channelParams[channelIdx];
        const kp = p.kernelParams;

        switch (p.kernelType) {
            case 'ring':
                p.kernel = Kernels.ring(p.R, p.peaks);
                break;
            case 'gaussian':
                p.kernel = Kernels.gaussian(p.R);
                break;
            case 'mexicanHat':
                p.kernel = Kernels.mexicanHat(p.R);
                break;
            case 'asymmetric':
                p.kernel = Kernels.asymmetric(p.R, kp.bias);
                break;
            case 'spiral':
                p.kernel = Kernels.spiral(p.R, kp.arms, kp.tightness);
                break;
            case 'star':
                p.kernel = Kernels.star(p.R, kp.points, kp.sharpness);
                break;
            case 'multiScale':
                p.kernel = Kernels.multiScale(p.R, kp.scales, kp.weights);
                break;
            case 'anisotropic':
                p.kernel = Kernels.anisotropic(p.R, kp.angle, kp.eccentricity);
                break;
            default:
                p.kernel = Kernels.ring(p.R, p.peaks);
        }
    }

    /**
     * Update all channel kernels
     */
    updateAllKernels() {
        for (let i = 0; i < this.numChannels; i++) {
            this.updateChannelKernel(i);
        }
    }

    /**
     * Growth function for a channel
     */
    growth(u, channelIdx) {
        const p = this.channelParams[channelIdx];
        const d = (u - p.mu) / p.sigma;
        return 2 * Math.exp(-d * d / 2) - 1;
    }

    /**
     * Convolve a single channel with its kernel
     */
    convolveChannel(channelIdx) {
        const { size } = this;
        const grid = this.channels[channelIdx];
        const potential = this.potentials[channelIdx];
        const kernel = this.channelParams[channelIdx].kernel;
        const kSize = kernel.size;
        const kRadius = kernel.radius;

        potential.fill(0);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let sum = 0;

                for (let ky = 0; ky < kSize; ky++) {
                    for (let kx = 0; kx < kSize; kx++) {
                        const kernelVal = kernel.data[ky * kSize + kx];
                        if (kernelVal === 0) continue;

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
     * Compute combined potential for a channel considering interactions
     * This is where cross-channel effects happen
     */
    getCombinedPotential(channelIdx, cellIdx) {
        let combined = 0;
        for (let j = 0; j < this.numChannels; j++) {
            combined += this.interactions[channelIdx][j] * this.potentials[j][cellIdx];
        }
        return combined;
    }

    /**
     * Perform one simulation step for all channels
     */
    step() {
        const { size, dt } = this;
        const totalCells = size * size;

        // First, compute all channel potentials
        for (let c = 0; c < this.numChannels; c++) {
            this.convolveChannel(c);
        }

        // Then update all channels based on combined potentials
        for (let c = 0; c < this.numChannels; c++) {
            const grid = this.channels[c];
            const nextGrid = this.nextChannels[c];

            for (let i = 0; i < totalCells; i++) {
                const combinedU = this.getCombinedPotential(c, i);
                const g = this.growth(combinedU, c);
                nextGrid[i] = Math.max(0, Math.min(1, grid[i] + dt * g));
            }
        }

        // Swap buffers
        for (let c = 0; c < this.numChannels; c++) {
            [this.channels[c], this.nextChannels[c]] = [this.nextChannels[c], this.channels[c]];
        }
    }

    /**
     * Get total mass across all channels
     */
    totalMass() {
        let total = 0;
        for (let c = 0; c < this.numChannels; c++) {
            for (let i = 0; i < this.channels[c].length; i++) {
                total += this.channels[c][i];
            }
        }
        return total;
    }

    /**
     * Get mass for a specific channel
     */
    channelMass(channelIdx) {
        let sum = 0;
        for (let i = 0; i < this.channels[channelIdx].length; i++) {
            sum += this.channels[channelIdx][i];
        }
        return sum;
    }

    /**
     * Clear all channels
     */
    clear() {
        for (let c = 0; c < this.numChannels; c++) {
            this.channels[c].fill(0);
        }
    }

    /**
     * Clear a specific channel
     */
    clearChannel(channelIdx) {
        this.channels[channelIdx].fill(0);
    }

    /**
     * Randomize a specific channel
     */
    randomizeChannel(channelIdx, density = 0.2) {
        const grid = this.channels[channelIdx];
        const size = this.size;
        const numClumps = Math.floor(size * size * density * 0.001);

        grid.fill(0);

        for (let c = 0; c < numClumps; c++) {
            const cx = Math.random() * size;
            const cy = Math.random() * size;
            const radius = 5 + Math.random() * 15;

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const dx = x - cx;
                    const dy = y - cy;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < radius) {
                        const value = (1 - dist / radius) * (0.5 + Math.random() * 0.5);
                        const idx = y * size + x;
                        grid[idx] = Math.min(1, grid[idx] + value * 0.5);
                    }
                }
            }
        }
    }

    /**
     * Randomize all channels
     */
    randomize() {
        for (let c = 0; c < this.numChannels; c++) {
            this.randomizeChannel(c, 0.15);
        }
    }

    /**
     * Draw a blob on a specific channel
     * @param {boolean} fullStrength - If true, draw at full value (for init patterns)
     */
    drawBlob(channelIdx, x, y, radius, value = 1.0, fullStrength = false) {
        const grid = this.channels[channelIdx];
        const size = this.size;
        const multiplier = fullStrength ? 1.0 : 0.3;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy) / radius;
                if (dist <= 1) {
                    const gx = (Math.floor(x) + dx + size) % size;
                    const gy = (Math.floor(y) + dy + size) % size;
                    const idx = gy * size + gx;
                    const brushVal = value * (1 - dist * dist);

                    if (value > 0) {
                        grid[idx] = Math.min(1, grid[idx] + brushVal * multiplier);
                    } else {
                        grid[idx] = Math.max(0, grid[idx] + brushVal * multiplier);
                    }
                }
            }
        }
    }

    /**
     * Get composite RGB color for a cell
     */
    getCompositeColor(cellIdx) {
        let r = 0, g = 0, b = 0;

        for (let c = 0; c < this.numChannels; c++) {
            const val = this.channels[c][cellIdx];
            const color = this.channelColors[c];
            r += val * color[0];
            g += val * color[1];
            b += val * color[2];
        }

        return [
            Math.min(255, Math.round(r)),
            Math.min(255, Math.round(g)),
            Math.min(255, Math.round(b))
        ];
    }

    /**
     * Load an ecosystem preset
     */
    loadEcosystem(presetName) {
        const preset = Ecosystems[presetName];
        if (!preset) return false;

        // Always reinitialize to the preset's channel count
        this.numChannels = preset.numChannels;

        // Reinitialize arrays
        this.channels = [];
        this.nextChannels = [];
        this.potentials = [];
        this.channelParams = [];
        this.interactions = [];

        for (let i = 0; i < this.numChannels; i++) {
            this.channels.push(new Float32Array(this.size * this.size));
            this.nextChannels.push(new Float32Array(this.size * this.size));
            this.potentials.push(new Float32Array(this.size * this.size));
            // Initialize channelParams with default structure
            this.channelParams.push({
                R: 13,
                peaks: 1,
                mu: 0.15,
                sigma: 0.015,
                kernelType: 'ring',
                kernelParams: {
                    arms: 3,
                    tightness: 1.5,
                    points: 5,
                    sharpness: 0.5,
                    angle: 0,
                    eccentricity: 0.6,
                    bias: 0.3
                },
                kernel: null
            });
        }

        // Load channel params from preset
        for (let i = 0; i < this.numChannels; i++) {
            Object.assign(this.channelParams[i], JSON.parse(JSON.stringify(preset.channelParams[i])));
        }

        // Load interactions
        this.interactions = JSON.parse(JSON.stringify(preset.interactions));

        // Load colors
        if (preset.colors) {
            this.channelColors = JSON.parse(JSON.stringify(preset.colors));
        }

        // Load dt
        if (preset.dt) {
            this.dt = preset.dt;
        }

        // Update kernels
        this.updateAllKernels();

        // Initialize with preset pattern if available
        this.clear();
        if (preset.initPattern) {
            preset.initPattern(this);
        } else {
            this.randomize();
        }

        return true;
    }
}

/**
 * Ecosystem presets - pre-configured multi-channel setups
 */
const Ecosystems = {
    /**
     * Predator and Prey - Red creatures hunt blue creatures
     */
    predatorPrey: {
        name: "Predator & Prey",
        description: "Red predators chase and consume blue prey. Prey reproduce faster.",
        numChannels: 2,
        dt: 0.1,
        colors: [
            [255, 80, 80],   // Red - predator
            [80, 150, 255]   // Blue - prey
        ],
        channelParams: [
            // Predator - slower, needs prey to survive
            {
                R: 15,
                peaks: 1,
                mu: 0.22,
                sigma: 0.04,
                kernelType: 'ring',
                kernelParams: { arms: 3, tightness: 1.5, points: 5, sharpness: 0.5, angle: 0, eccentricity: 0.6, bias: 0.3 }
            },
            // Prey - faster reproduction, smaller
            {
                R: 10,
                peaks: 1,
                mu: 0.20,
                sigma: 0.035,
                kernelType: 'ring',
                kernelParams: { arms: 3, tightness: 1.5, points: 5, sharpness: 0.5, angle: 0, eccentricity: 0.6, bias: 0.3 }
            }
        ],
        interactions: [
            [0.7, 0.5],   // Predator: needs self (0.7) + prey (0.5) to thrive
            [1.0, -0.4]   // Prey: thrives alone (1.0), inhibited by predator (-0.4)
        ],
        initPattern(mc) {
            // Place predators in one area
            for (let i = 0; i < 3; i++) {
                const x = mc.size * 0.3 + Math.random() * mc.size * 0.2;
                const y = mc.size * 0.3 + Math.random() * mc.size * 0.4;
                mc.drawBlob(0, x, y, 12, 1, true);
            }
            // Place prey scattered around
            for (let i = 0; i < 8; i++) {
                const x = Math.random() * mc.size;
                const y = Math.random() * mc.size;
                mc.drawBlob(1, x, y, 10, 1, true);
            }
        }
    },

    /**
     * Symbiotic Pair - Both species thrive together, die alone
     */
    symbioticPair: {
        name: "Symbiotic Pair",
        description: "Green and purple creatures need each other to survive. Mutual benefit.",
        numChannels: 2,
        dt: 0.1,
        colors: [
            [80, 220, 120],  // Green
            [180, 80, 220]   // Purple
        ],
        channelParams: [
            {
                R: 12,
                peaks: 1,
                mu: 0.24,
                sigma: 0.035,
                kernelType: 'ring',
                kernelParams: { arms: 3, tightness: 1.5, points: 5, sharpness: 0.5, angle: 0, eccentricity: 0.6, bias: 0.3 }
            },
            {
                R: 12,
                peaks: 1,
                mu: 0.24,
                sigma: 0.035,
                kernelType: 'ring',
                kernelParams: { arms: 3, tightness: 1.5, points: 5, sharpness: 0.5, angle: 0, eccentricity: 0.6, bias: 0.3 }
            }
        ],
        interactions: [
            [0.5, 0.6],   // Green: needs self (0.5) + purple (0.6) - can't survive alone well
            [0.6, 0.5]    // Purple: needs green (0.6) + self (0.5)
        ],
        initPattern(mc) {
            const cx = mc.size / 2;
            const cy = mc.size / 2;
            // Place both together at center
            mc.drawBlob(0, cx - 10, cy, 15, 1, true);
            mc.drawBlob(1, cx + 10, cy, 15, 1, true);
        }
    },

    /**
     * Chemical Signals - One channel attracts another
     */
    chemicalSignals: {
        name: "Chemical Signals",
        description: "Cyan emitters attract orange followers through chemical gradients.",
        numChannels: 2,
        dt: 0.1,
        colors: [
            [80, 220, 220],  // Cyan - emitter
            [255, 160, 80]   // Orange - follower
        ],
        channelParams: [
            // Emitter - stable, self-sufficient
            {
                R: 13,
                peaks: 1,
                mu: 0.26,
                sigma: 0.036,
                kernelType: 'ring',
                kernelParams: { arms: 3, tightness: 1.5, points: 5, sharpness: 0.5, angle: 0, eccentricity: 0.6, bias: 0.3 }
            },
            // Follower - attracted to emitter
            {
                R: 10,
                peaks: 1,
                mu: 0.18,
                sigma: 0.04,
                kernelType: 'ring',
                kernelParams: { arms: 3, tightness: 1.5, points: 5, sharpness: 0.5, angle: 0, eccentricity: 0.6, bias: 0.3 }
            }
        ],
        interactions: [
            [1.0, 0.0],   // Emitter: self-sustaining, ignores follower
            [0.3, 0.8]    // Follower: somewhat self (0.3), strongly attracted to emitter (0.8)
        ],
        initPattern(mc) {
            // Emitter at center
            mc.drawBlob(0, mc.size / 2, mc.size / 2, 15, 1, true);
            // Followers scattered
            for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 40 + Math.random() * 50;
                mc.drawBlob(1, mc.size / 2 + Math.cos(angle) * dist, mc.size / 2 + Math.sin(angle) * dist, 10, 1, true);
            }
        }
    },

    /**
     * Competition - Two species competing for the same niche
     */
    competition: {
        name: "Competition",
        description: "Red and blue creatures compete for space. Only one may dominate.",
        numChannels: 2,
        dt: 0.1,
        colors: [
            [255, 100, 100],  // Red
            [100, 100, 255]   // Blue
        ],
        channelParams: [
            {
                R: 12,
                peaks: 1,
                mu: 0.25,
                sigma: 0.035,
                kernelType: 'ring',
                kernelParams: { arms: 3, tightness: 1.5, points: 5, sharpness: 0.5, angle: 0, eccentricity: 0.6, bias: 0.3 }
            },
            {
                R: 12,
                peaks: 1,
                mu: 0.25,
                sigma: 0.035,
                kernelType: 'ring',
                kernelParams: { arms: 3, tightness: 1.5, points: 5, sharpness: 0.5, angle: 0, eccentricity: 0.6, bias: 0.3 }
            }
        ],
        interactions: [
            [1.0, -0.5],   // Red: self-sustaining, inhibited by blue
            [-0.5, 1.0]    // Blue: inhibited by red, self-sustaining
        ],
        initPattern(mc) {
            // Start on opposite sides
            mc.drawBlob(0, mc.size * 0.25, mc.size / 2, 20, 1, true);
            mc.drawBlob(1, mc.size * 0.75, mc.size / 2, 20, 1, true);
        }
    },

    /**
     * Three Species Food Chain
     */
    foodChain: {
        name: "Food Chain",
        description: "Three-level food chain: plants (green) → herbivores (blue) → predators (red)",
        numChannels: 3,
        dt: 0.1,
        colors: [
            [80, 200, 80],   // Green - plants
            [80, 150, 255],  // Blue - herbivores
            [255, 80, 80]    // Red - predators
        ],
        channelParams: [
            // Plants - grow independently
            {
                R: 8,
                peaks: 1,
                mu: 0.18,
                sigma: 0.04,
                kernelType: 'ring',
                kernelParams: { arms: 3, tightness: 1.5, points: 5, sharpness: 0.5, angle: 0, eccentricity: 0.6, bias: 0.3 }
            },
            // Herbivores - need plants
            {
                R: 11,
                peaks: 1,
                mu: 0.22,
                sigma: 0.035,
                kernelType: 'ring',
                kernelParams: { arms: 3, tightness: 1.5, points: 5, sharpness: 0.5, angle: 0, eccentricity: 0.6, bias: 0.3 }
            },
            // Predators - need herbivores
            {
                R: 14,
                peaks: 1,
                mu: 0.24,
                sigma: 0.04,
                kernelType: 'ring',
                kernelParams: { arms: 3, tightness: 1.5, points: 5, sharpness: 0.5, angle: 0, eccentricity: 0.6, bias: 0.3 }
            }
        ],
        interactions: [
            [1.0, -0.3, 0.0],    // Plants: self (1.0), eaten by herbivores (-0.3)
            [0.4, 0.6, -0.4],    // Herbivores: eat plants (0.4), self (0.6), hunted by predators (-0.4)
            [0.0, 0.5, 0.7]      // Predators: eat herbivores (0.5), self (0.7)
        ],
        initPattern(mc) {
            // Scatter plants
            for (let i = 0; i < 15; i++) {
                mc.drawBlob(0, Math.random() * mc.size, Math.random() * mc.size, 8, 1, true);
            }
            // Some herbivores
            for (let i = 0; i < 5; i++) {
                mc.drawBlob(1, Math.random() * mc.size, Math.random() * mc.size, 10, 1, true);
            }
            // Few predators
            for (let i = 0; i < 2; i++) {
                mc.drawBlob(2, Math.random() * mc.size, Math.random() * mc.size, 12, 1, true);
            }
        }
    }
};
