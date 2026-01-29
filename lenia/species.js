/**
 * Species presets for Lenia
 *
 * These are known stable "creatures" discovered through exploration.
 * Each species has specific kernel and growth parameters that allow it to persist.
 *
 * The parameters are:
 * - R: kernel radius
 * - peaks: number of kernel rings
 * - mu: center of growth function (what neighborhood density promotes growth)
 * - sigma: width of growth function (how tolerant of density variations)
 * - dt: time step (smaller = smoother but slower)
 *
 * Pattern data is a simplified representation of the creature's shape.
 */

const Species = {
    /**
     * Orbium - The classic Lenia "glider"
     * These parameters produce stable solitons that glide across the grid
     */
    orbium: {
        name: "Orbium",
        description: "The iconic Lenia creature. Moves smoothly across the grid.",
        params: {
            R: 13,
            peaks: 1,
            mu: 0.26,  // Adjusted to match actual potential values
            sigma: 0.036,  // Wider tolerance
            dt: 0.1
        },
        // Create a smooth circular blob
        pattern: (function() {
            const size = 20;
            const pattern = [];
            for (let y = 0; y < size; y++) {
                const row = [];
                for (let x = 0; x < size; x++) {
                    const cx = size / 2 - 0.5;
                    const cy = size / 2 - 0.5;
                    const dx = x - cx;
                    const dy = y - cy;
                    const r = Math.sqrt(dx * dx + dy * dy);
                    const maxR = size / 2.3;
                    // Smooth falloff
                    let value = 0;
                    if (r < maxR) {
                        const t = r / maxR;
                        value = 1 - t * t;
                    }
                    row.push(Math.max(0, value));
                }
                pattern.push(row);
            }
            return pattern;
        })()
    },

    /**
     * Geminium - A self-replicating creature
     * Periodically splits into two copies of itself
     */
    geminium: {
        name: "Geminium",
        description: "A self-replicating creature that periodically divides.",
        params: {
            R: 10,
            peaks: 1,
            mu: 0.22,  // Calibrated for actual potential
            sigma: 0.035,
            dt: 0.1
        },
        // Geminium pattern - circular blob
        pattern: (function() {
            const size = 16;
            const pattern = [];
            for (let y = 0; y < size; y++) {
                const row = [];
                for (let x = 0; x < size; x++) {
                    const cx = size / 2 - 0.5;
                    const cy = size / 2 - 0.5;
                    const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                    const maxR = size / 2.3;
                    let value = r < maxR ? 1 - (r / maxR) ** 2 : 0;
                    row.push(Math.max(0, value));
                }
                pattern.push(row);
            }
            return pattern;
        })()
    },

    /**
     * Hydrogeminium - Water-like flowing creature
     */
    hydrogeminium: {
        name: "Hydrogeminium",
        description: "Fluid, water-like behavior with smooth transitions.",
        params: {
            R: 8,
            peaks: 1,
            mu: 0.20,  // Calibrated for actual potential
            sigma: 0.04,
            dt: 0.12
        },
        // Soft circular blob
        pattern: (function() {
            const size = 14;
            const pattern = [];
            for (let y = 0; y < size; y++) {
                const row = [];
                for (let x = 0; x < size; x++) {
                    const cx = size / 2 - 0.5;
                    const cy = size / 2 - 0.5;
                    const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                    const maxR = size / 2.2;
                    let value = r < maxR ? 1 - (r / maxR) ** 2 : 0;
                    row.push(Math.max(0, value));
                }
                pattern.push(row);
            }
            return pattern;
        })()
    },

    /**
     * Scutium Gravidus - Heavy shield-like creature
     */
    scutium: {
        name: "Scutium Gravidus",
        description: "Dense, shield-like structure with interesting dynamics.",
        params: {
            R: 15,
            peaks: 1,
            mu: 0.28,  // Calibrated for actual potential
            sigma: 0.04,
            dt: 0.1
        },
        // Larger circular blob
        pattern: (function() {
            const size = 24;
            const pattern = [];
            for (let y = 0; y < size; y++) {
                const row = [];
                for (let x = 0; x < size; x++) {
                    const cx = size / 2 - 0.5;
                    const cy = size / 2 - 0.5;
                    const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                    const maxR = size / 2.3;
                    let value = r < maxR ? 1 - (r / maxR) ** 2 : 0;
                    row.push(Math.max(0, value));
                }
                pattern.push(row);
            }
            return pattern;
        })()
    },

    /**
     * Custom - Default starting point for experimentation
     */
    custom: {
        name: "Custom",
        description: "Your own parameters - experiment freely!",
        params: {
            R: 13,
            peaks: 1,
            mu: 0.26,
            sigma: 0.036,
            dt: 0.1
        },
        pattern: null // Will use current grid state or random
    },

    // ==================== Flow-Lenia Species ====================
    // These species are optimized for mass-conservative Flow-Lenia dynamics

    /**
     * Swimmer - Streamlined shape that propels through flow
     * Optimized for directional movement via asymmetric affinity gradients
     */
    swimmer: {
        name: "Swimmer",
        description: "Streamlined shape that propels itself through flow dynamics.",
        params: {
            R: 12,
            peaks: 1,
            mu: 0.22,
            sigma: 0.028,
            dt: 0.15,
            flowStrength: 1.2,
            diffusion: 0.08,
            isFlowSpecies: true,
            kernelType: 'asymmetric',
            kernelParams: {
                bias: 0.4
            }
        },
        // Elongated, streamlined shape
        pattern: (function() {
            const width = 24;
            const height = 16;
            const pattern = [];
            for (let y = 0; y < height; y++) {
                const row = [];
                for (let x = 0; x < width; x++) {
                    const cx = width / 2 - 0.5;
                    const cy = height / 2 - 0.5;
                    // Elliptical shape, longer in x direction
                    const dx = (x - cx) / (width / 2.5);
                    const dy = (y - cy) / (height / 2.5);
                    const r = Math.sqrt(dx * dx + dy * dy);
                    // Smooth falloff with slight front-heavy bias
                    let value = 0;
                    if (r < 1) {
                        const t = r;
                        value = (1 - t * t) * (1 + 0.2 * (cx - x) / cx);
                    }
                    row.push(Math.max(0, Math.min(1, value)));
                }
                pattern.push(row);
            }
            return pattern;
        })()
    },

    /**
     * Amoeba - Blob that extends pseudopods
     * Optimized for dynamic shape changes via flow
     */
    amoeba: {
        name: "Amoeba",
        description: "Amorphous blob that extends and retracts pseudopods.",
        params: {
            R: 10,
            peaks: 1,
            mu: 0.18,
            sigma: 0.032,
            dt: 0.12,
            flowStrength: 1.0,
            diffusion: 0.12,
            isFlowSpecies: true,
            kernelType: 'gaussian'
        },
        // Irregular blob shape
        pattern: (function() {
            const size = 20;
            const pattern = [];
            // Create a lumpy, irregular shape
            const lumps = [
                { x: 10, y: 10, r: 7, strength: 1.0 },
                { x: 14, y: 8, r: 4, strength: 0.8 },
                { x: 6, y: 12, r: 4, strength: 0.8 },
                { x: 10, y: 14, r: 3, strength: 0.6 },
            ];
            for (let y = 0; y < size; y++) {
                const row = [];
                for (let x = 0; x < size; x++) {
                    let value = 0;
                    for (const lump of lumps) {
                        const dx = x - lump.x;
                        const dy = y - lump.y;
                        const dist = Math.sqrt(dx * dx + dy * dy) / lump.r;
                        if (dist < 1) {
                            value += lump.strength * (1 - dist * dist);
                        }
                    }
                    row.push(Math.min(1, value));
                }
                pattern.push(row);
            }
            return pattern;
        })()
    },

    /**
     * Vortex - Rotating structure maintained by flow
     * Uses spiral kernel for rotational dynamics
     */
    vortex: {
        name: "Vortex",
        description: "Spinning structure that maintains rotation through flow.",
        params: {
            R: 14,
            peaks: 1,
            mu: 0.24,
            sigma: 0.03,
            dt: 0.1,
            flowStrength: 1.5,
            diffusion: 0.06,
            isFlowSpecies: true,
            kernelType: 'spiral',
            kernelParams: {
                arms: 3,
                tightness: 1.2
            }
        },
        // Ring/donut shape that works well with spiral flow
        pattern: (function() {
            const size = 22;
            const pattern = [];
            for (let y = 0; y < size; y++) {
                const row = [];
                for (let x = 0; x < size; x++) {
                    const cx = size / 2 - 0.5;
                    const cy = size / 2 - 0.5;
                    const dx = x - cx;
                    const dy = y - cy;
                    const r = Math.sqrt(dx * dx + dy * dy);
                    const innerR = size / 6;
                    const outerR = size / 2.3;
                    // Ring shape
                    let value = 0;
                    if (r > innerR && r < outerR) {
                        const mid = (innerR + outerR) / 2;
                        const width = (outerR - innerR) / 2;
                        const t = Math.abs(r - mid) / width;
                        value = 1 - t * t;
                    }
                    row.push(Math.max(0, value));
                }
                pattern.push(row);
            }
            return pattern;
        })()
    },

    /**
     * Droplet - Stable spherical mass that resists spreading
     * Optimized for maintaining cohesion
     */
    droplet: {
        name: "Droplet",
        description: "Cohesive spherical mass that maintains its shape.",
        params: {
            R: 10,
            peaks: 1,
            mu: 0.25,
            sigma: 0.025,
            dt: 0.08,
            flowStrength: 0.8,
            diffusion: 0.05,
            isFlowSpecies: true,
            kernelType: 'ring'
        },
        // Dense, compact circular blob
        pattern: (function() {
            const size = 16;
            const pattern = [];
            for (let y = 0; y < size; y++) {
                const row = [];
                for (let x = 0; x < size; x++) {
                    const cx = size / 2 - 0.5;
                    const cy = size / 2 - 0.5;
                    const dx = x - cx;
                    const dy = y - cy;
                    const r = Math.sqrt(dx * dx + dy * dy);
                    const maxR = size / 2.5;
                    // Sharp-edged, dense blob
                    let value = 0;
                    if (r < maxR) {
                        const t = r / maxR;
                        // Steeper falloff for more defined edges
                        value = Math.pow(1 - t * t, 1.5);
                    }
                    row.push(Math.max(0, value));
                }
                pattern.push(row);
            }
            return pattern;
        })()
    },

    /**
     * Place a species pattern onto the grid
     */
    placePattern(grid, gridSize, pattern, centerX, centerY) {
        if (!pattern) return;

        const patternH = pattern.length;
        const patternW = pattern[0].length;
        const startX = Math.floor(centerX - patternW / 2);
        const startY = Math.floor(centerY - patternH / 2);

        for (let py = 0; py < patternH; py++) {
            for (let px = 0; px < patternW; px++) {
                const gx = (startX + px + gridSize) % gridSize;
                const gy = (startY + py + gridSize) % gridSize;
                grid[gy * gridSize + gx] = pattern[py][px];
            }
        }
    },

    /**
     * Create a smooth circular blob (useful for drawing)
     */
    createBlob(radius) {
        const size = radius * 2 + 1;
        const pattern = [];

        for (let y = 0; y < size; y++) {
            const row = [];
            for (let x = 0; x < size; x++) {
                const dx = x - radius;
                const dy = y - radius;
                const dist = Math.sqrt(dx * dx + dy * dy) / radius;
                // Smooth falloff
                const value = Math.max(0, 1 - dist * dist);
                row.push(value);
            }
            pattern.push(row);
        }

        return pattern;
    }
};
