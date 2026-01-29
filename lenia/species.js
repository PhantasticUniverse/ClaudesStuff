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
