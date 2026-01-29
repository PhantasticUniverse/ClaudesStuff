/**
 * Environment Layer System for Lenia Explorer - Phase 4
 *
 * Provides background fields that influence creature behavior:
 * - Food field: Regenerating resource that creatures consume
 * - Pheromone trails: Creatures leave traces that attract/repel others
 * - Flow currents: Global directional forces (like wind/water)
 *
 * These layers enable emergent behaviors like hunting, fleeing,
 * schooling, and territorial dynamics.
 */

class Environment {
    constructor(size) {
        this.size = size;

        // Environmental layers
        this.food = new Float32Array(size * size);
        this.pheromone = new Float32Array(size * size);

        // Phase 12: Visual signal channels (bioluminescence)
        this.alarmSignal = new Float32Array(size * size);      // Red/orange - prey danger warning
        this.huntingSignal = new Float32Array(size * size);    // Magenta - hunter activity
        this.matingSignal = new Float32Array(size * size);     // Cyan/blue - reproduction readiness
        this.territorySignal = new Float32Array(size * size);  // Green - territorial marking

        // Working buffers for gradient computation
        this.foodGradX = new Float32Array(size * size);
        this.foodGradY = new Float32Array(size * size);
        this.pheromoneGradX = new Float32Array(size * size);
        this.pheromoneGradY = new Float32Array(size * size);

        // Phase 12: Signal gradient buffers
        this.alarmGradX = new Float32Array(size * size);
        this.alarmGradY = new Float32Array(size * size);
        this.huntingGradX = new Float32Array(size * size);
        this.huntingGradY = new Float32Array(size * size);
        this.matingGradX = new Float32Array(size * size);
        this.matingGradY = new Float32Array(size * size);
        this.territoryGradX = new Float32Array(size * size);
        this.territoryGradY = new Float32Array(size * size);

        // Global current (wind/water flow)
        this.current = { x: 0, y: 0 };

        // Environment parameters
        this.params = {
            // Food parameters
            foodSpawnRate: 0.002,      // How fast food regrows (0-0.01)
            foodMaxDensity: 1.0,       // Maximum food density per cell
            foodConsumptionRate: 0.1,  // How fast creatures consume food
            foodSpawnMode: 'uniform',  // 'uniform', 'clusters', 'patches'

            // Pheromone parameters
            pheromoneDecayRate: 0.01,  // How fast pheromones fade (0-0.1)
            pheromoneEmissionRate: 0.1, // How much pheromone creatures emit
            pheromoneMaxDensity: 1.0,  // Maximum pheromone density
            pheromoneDiffusion: 0.05,  // How fast pheromones spread

            // Current parameters
            currentStrength: 0.0,      // Strength of global current (0-1)
            currentAngle: 0,           // Direction in radians
            currentOscillate: false,   // Whether current oscillates
            currentOscillationSpeed: 0.01,

            // Phase 12: Signal parameters (bioluminescence)
            signalDecayRate: 0.08,     // Faster decay than pheromones
            signalDiffusionRate: 0.3,  // Faster spread than pheromones
            signalMaxDensity: 1.0      // Maximum signal intensity
        };

        // For oscillating current
        this.currentPhase = 0;

        // Food cluster positions (for 'clusters' mode)
        this.foodClusters = [];

        // Initialize food field
        this.initializeFood();
    }

    /**
     * Initialize food field based on spawn mode
     */
    initializeFood() {
        this.food.fill(0);

        switch (this.params.foodSpawnMode) {
            case 'uniform':
                // Start with low uniform density
                for (let i = 0; i < this.food.length; i++) {
                    this.food[i] = 0.3;
                }
                break;

            case 'clusters':
                // Create random food clusters
                this.foodClusters = [];
                const numClusters = 5 + Math.floor(Math.random() * 5);
                for (let c = 0; c < numClusters; c++) {
                    this.foodClusters.push({
                        x: Math.random() * this.size,
                        y: Math.random() * this.size,
                        radius: 15 + Math.random() * 25,
                        strength: 0.5 + Math.random() * 0.5
                    });
                }
                this.applyFoodClusters();
                break;

            case 'patches':
                // Create stable food patches
                this.createFoodPatches();
                break;
        }
    }

    /**
     * Apply food clusters to the food field
     */
    applyFoodClusters() {
        for (const cluster of this.foodClusters) {
            for (let y = 0; y < this.size; y++) {
                for (let x = 0; x < this.size; x++) {
                    const dx = x - cluster.x;
                    const dy = y - cluster.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < cluster.radius) {
                        const t = dist / cluster.radius;
                        const value = cluster.strength * (1 - t * t);
                        const idx = y * this.size + x;
                        this.food[idx] = Math.min(this.params.foodMaxDensity,
                            this.food[idx] + value);
                    }
                }
            }
        }
    }

    /**
     * Create stable food patches (grid-like)
     */
    createFoodPatches() {
        const patchSize = 30;
        const spacing = 60;

        for (let py = patchSize; py < this.size - patchSize; py += spacing) {
            for (let px = patchSize; px < this.size - patchSize; px += spacing) {
                for (let dy = -patchSize/2; dy < patchSize/2; dy++) {
                    for (let dx = -patchSize/2; dx < patchSize/2; dx++) {
                        const x = (Math.floor(px + dx) + this.size) % this.size;
                        const y = (Math.floor(py + dy) + this.size) % this.size;
                        const dist = Math.sqrt(dx*dx + dy*dy) / (patchSize/2);
                        if (dist < 1) {
                            this.food[y * this.size + x] = 0.8 * (1 - dist * dist);
                        }
                    }
                }
            }
        }
    }

    /**
     * Update environment (called each simulation step)
     */
    update(creatureMass = null) {
        this.updateFood(creatureMass);
        this.updatePheromones(creatureMass);
        this.updateSignals();  // Phase 12: Update bioluminescent signals
        this.updateCurrent();
        this.computeGradients();
    }

    /**
     * Update food field - regrowth and consumption
     */
    updateFood(creatureMass) {
        const { foodSpawnRate, foodMaxDensity, foodConsumptionRate } = this.params;

        for (let i = 0; i < this.size * this.size; i++) {
            // Regrowth
            if (this.food[i] < foodMaxDensity) {
                this.food[i] += foodSpawnRate;
                this.food[i] = Math.min(this.food[i], foodMaxDensity);
            }

            // Consumption by creatures (if mass field provided)
            if (creatureMass && creatureMass[i] > 0.1) {
                const consumed = creatureMass[i] * foodConsumptionRate;
                this.food[i] = Math.max(0, this.food[i] - consumed);
            }
        }

        // In cluster mode, slowly regenerate toward cluster centers
        if (this.params.foodSpawnMode === 'clusters') {
            for (const cluster of this.foodClusters) {
                const cx = Math.floor(cluster.x);
                const cy = Math.floor(cluster.y);
                const idx = cy * this.size + cx;
                this.food[idx] = Math.min(this.params.foodMaxDensity,
                    this.food[idx] + foodSpawnRate * 5);
            }
        }
    }

    /**
     * Update pheromone field - decay, diffusion, and emission
     */
    updatePheromones(creatureMass) {
        const { pheromoneDecayRate, pheromoneEmissionRate,
                pheromoneMaxDensity, pheromoneDiffusion } = this.params;
        const size = this.size;

        // Create temporary buffer for diffusion
        const newPheromone = new Float32Array(this.pheromone.length);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = y * size + x;
                let value = this.pheromone[idx];

                // Decay
                value *= (1 - pheromoneDecayRate);

                // Diffusion (average with neighbors)
                if (pheromoneDiffusion > 0) {
                    const xm = (x - 1 + size) % size;
                    const xp = (x + 1) % size;
                    const ym = (y - 1 + size) % size;
                    const yp = (y + 1) % size;

                    const neighbors = (
                        this.pheromone[y * size + xm] +
                        this.pheromone[y * size + xp] +
                        this.pheromone[ym * size + x] +
                        this.pheromone[yp * size + x]
                    ) / 4;

                    value = value * (1 - pheromoneDiffusion) + neighbors * pheromoneDiffusion;
                }

                // Emission from creatures
                if (creatureMass && creatureMass[idx] > 0.1) {
                    value += creatureMass[idx] * pheromoneEmissionRate;
                }

                newPheromone[idx] = Math.min(pheromoneMaxDensity, Math.max(0, value));
            }
        }

        // Copy back
        this.pheromone.set(newPheromone);
    }

    /**
     * Phase 12: Update all signal fields - decay and diffusion
     * Signals spread faster but fade faster than pheromones
     */
    updateSignals() {
        const { signalDecayRate, signalDiffusionRate, signalMaxDensity } = this.params;

        this.updateSignalField(this.alarmSignal, signalDecayRate, signalDiffusionRate, signalMaxDensity);
        this.updateSignalField(this.huntingSignal, signalDecayRate, signalDiffusionRate, signalMaxDensity);
        this.updateSignalField(this.matingSignal, signalDecayRate, signalDiffusionRate, signalMaxDensity);
        this.updateSignalField(this.territorySignal, signalDecayRate * 0.5, signalDiffusionRate * 0.3, signalMaxDensity); // Territory persists longer
    }

    /**
     * Phase 12: Update a single signal field with decay and diffusion
     */
    updateSignalField(field, decayRate, diffusionRate, maxDensity) {
        const size = this.size;
        const newField = new Float32Array(field.length);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = y * size + x;
                let value = field[idx];

                // Decay
                value *= (1 - decayRate);

                // Diffusion (average with neighbors) - creates expanding ring effect
                if (diffusionRate > 0) {
                    const xm = (x - 1 + size) % size;
                    const xp = (x + 1) % size;
                    const ym = (y - 1 + size) % size;
                    const yp = (y + 1) % size;

                    const neighbors = (
                        field[y * size + xm] +
                        field[y * size + xp] +
                        field[ym * size + x] +
                        field[yp * size + x]
                    ) / 4;

                    value = value * (1 - diffusionRate) + neighbors * diffusionRate;
                }

                newField[idx] = Math.min(maxDensity, Math.max(0, value));
            }
        }

        // Copy back
        field.set(newField);
    }

    /**
     * Phase 12: Emit a signal at a position (creates expanding pulse)
     * @param {string} type - 'alarm', 'hunting', 'mating', 'territory'
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} intensity - Signal strength (0-1)
     * @param {number} radius - Emission radius
     */
    emitSignal(type, x, y, intensity = 0.8, radius = 8) {
        let field;
        switch (type) {
            case 'alarm':
                field = this.alarmSignal;
                break;
            case 'hunting':
                field = this.huntingSignal;
                break;
            case 'mating':
                field = this.matingSignal;
                break;
            case 'territory':
                field = this.territorySignal;
                break;
            default:
                return;
        }

        // Emit signal in a circular area
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy) / radius;
                if (dist <= 1) {
                    const ix = ((Math.floor(x + dx) % this.size) + this.size) % this.size;
                    const iy = ((Math.floor(y + dy) % this.size) + this.size) % this.size;
                    const value = intensity * (1 - dist * dist);  // Smooth falloff
                    field[iy * this.size + ix] = Math.min(
                        this.params.signalMaxDensity,
                        field[iy * this.size + ix] + value
                    );
                }
            }
        }
    }

    /**
     * Phase 12: Get signal gradient at a position
     * @param {string} type - Signal type
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {Object} - Gradient {x, y}
     */
    getSignalGradient(type, x, y) {
        let gradX, gradY;
        switch (type) {
            case 'alarm':
                gradX = this.alarmGradX;
                gradY = this.alarmGradY;
                break;
            case 'hunting':
                gradX = this.huntingGradX;
                gradY = this.huntingGradY;
                break;
            case 'mating':
                gradX = this.matingGradX;
                gradY = this.matingGradY;
                break;
            case 'territory':
                gradX = this.territoryGradX;
                gradY = this.territoryGradY;
                break;
            default:
                return { x: 0, y: 0 };
        }
        return this.sampleGradient(x, y, gradX, gradY);
    }

    /**
     * Phase 12: Get signal value at a position
     */
    getSignalAt(type, x, y) {
        let field;
        switch (type) {
            case 'alarm':
                field = this.alarmSignal;
                break;
            case 'hunting':
                field = this.huntingSignal;
                break;
            case 'mating':
                field = this.matingSignal;
                break;
            case 'territory':
                field = this.territorySignal;
                break;
            default:
                return 0;
        }
        const ix = ((Math.floor(x) % this.size) + this.size) % this.size;
        const iy = ((Math.floor(y) % this.size) + this.size) % this.size;
        return field[iy * this.size + ix];
    }

    /**
     * Update global current (oscillation)
     */
    updateCurrent() {
        if (this.params.currentOscillate) {
            this.currentPhase += this.params.currentOscillationSpeed;
            const oscillation = Math.sin(this.currentPhase);
            this.current.x = Math.cos(this.params.currentAngle) * this.params.currentStrength * oscillation;
            this.current.y = Math.sin(this.params.currentAngle) * this.params.currentStrength * oscillation;
        } else {
            this.current.x = Math.cos(this.params.currentAngle) * this.params.currentStrength;
            this.current.y = Math.sin(this.params.currentAngle) * this.params.currentStrength;
        }
    }

    /**
     * Compute gradients for all fields using Sobel filter
     */
    computeGradients() {
        this.computeFieldGradient(this.food, this.foodGradX, this.foodGradY);
        this.computeFieldGradient(this.pheromone, this.pheromoneGradX, this.pheromoneGradY);

        // Phase 12: Compute signal gradients
        this.computeFieldGradient(this.alarmSignal, this.alarmGradX, this.alarmGradY);
        this.computeFieldGradient(this.huntingSignal, this.huntingGradX, this.huntingGradY);
        this.computeFieldGradient(this.matingSignal, this.matingGradX, this.matingGradY);
        this.computeFieldGradient(this.territorySignal, this.territoryGradX, this.territoryGradY);
    }

    /**
     * Compute gradient of a field using Sobel filter
     */
    computeFieldGradient(field, gradX, gradY) {
        const size = this.size;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const xm = (x - 1 + size) % size;
                const xp = (x + 1) % size;
                const ym = (y - 1 + size) % size;
                const yp = (y + 1) % size;

                // Sample 3x3 neighborhood
                const a_tl = field[ym * size + xm];
                const a_tc = field[ym * size + x];
                const a_tr = field[ym * size + xp];
                const a_ml = field[y * size + xm];
                const a_mr = field[y * size + xp];
                const a_bl = field[yp * size + xm];
                const a_bc = field[yp * size + x];
                const a_br = field[yp * size + xp];

                // Sobel gradient
                const gx = (-a_tl + a_tr - 2*a_ml + 2*a_mr - a_bl + a_br) / 8;
                const gy = (-a_tl - 2*a_tc - a_tr + a_bl + 2*a_bc + a_br) / 8;

                const idx = y * size + x;
                gradX[idx] = gx;
                gradY[idx] = gy;
            }
        }
    }

    /**
     * Get food gradient at a position (bilinear interpolation)
     */
    getFoodGradient(x, y) {
        return this.sampleGradient(x, y, this.foodGradX, this.foodGradY);
    }

    /**
     * Get pheromone gradient at a position
     */
    getPheromoneGradient(x, y) {
        return this.sampleGradient(x, y, this.pheromoneGradX, this.pheromoneGradY);
    }

    /**
     * Sample gradient with bilinear interpolation
     */
    sampleGradient(x, y, gradX, gradY) {
        const size = this.size;

        // Wrap coordinates
        x = ((x % size) + size) % size;
        y = ((y % size) + size) % size;

        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = (x0 + 1) % size;
        const y1 = (y0 + 1) % size;

        const fx = x - x0;
        const fy = y - y0;

        // Bilinear interpolation
        const gx00 = gradX[y0 * size + x0];
        const gx10 = gradX[y0 * size + x1];
        const gx01 = gradX[y1 * size + x0];
        const gx11 = gradX[y1 * size + x1];

        const gy00 = gradY[y0 * size + x0];
        const gy10 = gradY[y0 * size + x1];
        const gy01 = gradY[y1 * size + x0];
        const gy11 = gradY[y1 * size + x1];

        const gx = gx00 * (1-fx) * (1-fy) + gx10 * fx * (1-fy) +
                   gx01 * (1-fx) * fy + gx11 * fx * fy;
        const gy = gy00 * (1-fx) * (1-fy) + gy10 * fx * (1-fy) +
                   gy01 * (1-fx) * fy + gy11 * fx * fy;

        return { x: gx, y: gy };
    }

    /**
     * Get food value at a position
     */
    getFoodAt(x, y) {
        const ix = ((Math.floor(x) % this.size) + this.size) % this.size;
        const iy = ((Math.floor(y) % this.size) + this.size) % this.size;
        return this.food[iy * this.size + ix];
    }

    /**
     * Get pheromone value at a position
     */
    getPheromoneAt(x, y) {
        const ix = ((Math.floor(x) % this.size) + this.size) % this.size;
        const iy = ((Math.floor(y) % this.size) + this.size) % this.size;
        return this.pheromone[iy * this.size + ix];
    }

    /**
     * Add food at a position (for manual placement)
     */
    addFood(x, y, amount, radius = 10) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy) / radius;
                if (dist <= 1) {
                    const ix = ((Math.floor(x + dx) % this.size) + this.size) % this.size;
                    const iy = ((Math.floor(y + dy) % this.size) + this.size) % this.size;
                    const value = amount * (1 - dist * dist);
                    this.food[iy * this.size + ix] = Math.min(
                        this.params.foodMaxDensity,
                        this.food[iy * this.size + ix] + value
                    );
                }
            }
        }
    }

    /**
     * Add pheromone at a position
     */
    addPheromone(x, y, amount, radius = 5) {
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy) / radius;
                if (dist <= 1) {
                    const ix = ((Math.floor(x + dx) % this.size) + this.size) % this.size;
                    const iy = ((Math.floor(y + dy) % this.size) + this.size) % this.size;
                    const value = amount * (1 - dist * dist);
                    this.pheromone[iy * this.size + ix] = Math.min(
                        this.params.pheromoneMaxDensity,
                        this.pheromone[iy * this.size + ix] + value
                    );
                }
            }
        }
    }

    /**
     * Clear all environmental fields
     */
    clear() {
        this.food.fill(0);
        this.pheromone.fill(0);
        this.foodGradX.fill(0);
        this.foodGradY.fill(0);
        this.pheromoneGradX.fill(0);
        this.pheromoneGradY.fill(0);

        // Phase 12: Clear signal fields
        this.alarmSignal.fill(0);
        this.huntingSignal.fill(0);
        this.matingSignal.fill(0);
        this.territorySignal.fill(0);
        this.alarmGradX.fill(0);
        this.alarmGradY.fill(0);
        this.huntingGradX.fill(0);
        this.huntingGradY.fill(0);
        this.matingGradX.fill(0);
        this.matingGradY.fill(0);
        this.territoryGradX.fill(0);
        this.territoryGradY.fill(0);
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.pheromone.fill(0);
        this.currentPhase = 0;

        // Phase 12: Clear signals on reset
        this.alarmSignal.fill(0);
        this.huntingSignal.fill(0);
        this.matingSignal.fill(0);
        this.territorySignal.fill(0);

        this.initializeFood();
    }

    /**
     * Resize the environment
     */
    resize(newSize) {
        if (newSize === this.size) return;

        this.size = newSize;
        this.food = new Float32Array(newSize * newSize);
        this.pheromone = new Float32Array(newSize * newSize);
        this.foodGradX = new Float32Array(newSize * newSize);
        this.foodGradY = new Float32Array(newSize * newSize);
        this.pheromoneGradX = new Float32Array(newSize * newSize);
        this.pheromoneGradY = new Float32Array(newSize * newSize);

        // Phase 12: Resize signal fields
        this.alarmSignal = new Float32Array(newSize * newSize);
        this.huntingSignal = new Float32Array(newSize * newSize);
        this.matingSignal = new Float32Array(newSize * newSize);
        this.territorySignal = new Float32Array(newSize * newSize);
        this.alarmGradX = new Float32Array(newSize * newSize);
        this.alarmGradY = new Float32Array(newSize * newSize);
        this.huntingGradX = new Float32Array(newSize * newSize);
        this.huntingGradY = new Float32Array(newSize * newSize);
        this.matingGradX = new Float32Array(newSize * newSize);
        this.matingGradY = new Float32Array(newSize * newSize);
        this.territoryGradX = new Float32Array(newSize * newSize);
        this.territoryGradY = new Float32Array(newSize * newSize);

        this.initializeFood();
    }

    /**
     * Get visualization color for food (green tint)
     */
    getFoodColor(value) {
        const intensity = Math.min(1, value) * 255;
        return [0, intensity, intensity * 0.3];
    }

    /**
     * Get visualization color for pheromone (purple/magenta trail)
     */
    getPheromoneColor(value) {
        const intensity = Math.min(1, value) * 200;
        return [intensity, 0, intensity * 0.8];
    }
}
