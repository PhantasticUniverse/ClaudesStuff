/**
 * Creature Detection and Tracking for Lenia Explorer - Phase 5
 *
 * Identifies discrete creatures from the continuous mass field using
 * connected component labeling. Tracks creatures across frames with
 * persistent IDs, computing:
 * - Center of mass position
 * - Total mass
 * - Velocity (from position change)
 * - Heading (direction of movement, smoothed)
 *
 * Also provides sensory systems for creatures to detect:
 * - Food gradients
 * - Pheromone gradients
 * - Other creatures (attraction/repulsion)
 *
 * Phase 5 additions:
 * - Genome class for heritable parameters
 * - Energy system for creatures (gain from food, lose from metabolism)
 * - Reproduction with mutation when energy threshold reached
 * - Death when energy depleted
 */

/**
 * CreatureMemory class - Spatial memory for creatures (Phase 11)
 * Creatures remember locations where they found food or encountered danger.
 * Memories influence movement decisions and fade over time.
 */
class CreatureMemory {
    constructor(resolution = 8) {
        this.resolution = resolution;
        this.food = new Float32Array(resolution * resolution);
        this.danger = new Float32Array(resolution * resolution);
        this.decayRate = 0.995;
    }

    /**
     * Convert world coordinates to memory grid index
     */
    worldToMemory(x, y, worldSize) {
        const mx = Math.floor((x / worldSize) * this.resolution) % this.resolution;
        const my = Math.floor((y / worldSize) * this.resolution) % this.resolution;
        return my * this.resolution + mx;
    }

    /**
     * Record a positive food memory at location
     */
    recordFood(x, y, worldSize, intensity = 0.3) {
        const idx = this.worldToMemory(x, y, worldSize);
        this.food[idx] = Math.min(1, this.food[idx] + intensity);
    }

    /**
     * Record a negative danger memory at location
     */
    recordDanger(x, y, worldSize, intensity = 0.5) {
        const idx = this.worldToMemory(x, y, worldSize);
        this.danger[idx] = Math.min(1, this.danger[idx] + intensity);
    }

    /**
     * Decay all memories toward zero
     */
    decay() {
        for (let i = 0; i < this.food.length; i++) {
            this.food[i] *= this.decayRate;
            this.danger[i] *= this.decayRate;
        }
    }

    /**
     * Get net memory value at location (food - danger)
     */
    getValue(x, y, worldSize) {
        const idx = this.worldToMemory(x, y, worldSize);
        return this.food[idx] - this.danger[idx];
    }

    /**
     * Compute gradient pointing toward positive memories / away from negative
     */
    getGradient(creatureX, creatureY, worldSize) {
        const step = worldSize / this.resolution;
        let gradX = 0, gradY = 0;
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [dx, dy] of dirs) {
            const nx = (creatureX + dx * step + worldSize) % worldSize;
            const ny = (creatureY + dy * step + worldSize) % worldSize;
            const value = this.getValue(nx, ny, worldSize);
            gradX += dx * value;
            gradY += dy * value;
        }
        return { x: gradX, y: gradY };
    }

    /**
     * Clone memory for offspring (optional - offspring may inherit partial memory)
     */
    clone(inheritanceRate = 0.5) {
        const child = new CreatureMemory(this.resolution);
        child.decayRate = this.decayRate;
        for (let i = 0; i < this.food.length; i++) {
            child.food[i] = this.food[i] * inheritanceRate;
            child.danger[i] = this.danger[i] * inheritanceRate;
        }
        return child;
    }
}

/**
 * Genome class - Heritable parameters for creatures
 * Each creature carries a genome that determines its behavior and physiology
 */
class Genome {
    constructor(defaults = {}) {
        // Sensory weights (how strongly creature responds to stimuli)
        this.foodWeight = defaults.foodWeight ?? 1.0;
        this.pheromoneWeight = defaults.pheromoneWeight ?? 0.5;
        this.socialWeight = defaults.socialWeight ?? 0.3;

        // Movement parameters
        this.turnRate = defaults.turnRate ?? 0.15;
        this.speedPreference = defaults.speedPreference ?? 1.0;

        // Metabolism and reproduction
        this.metabolismRate = defaults.metabolismRate ?? 0.02;   // Energy lost per frame
        this.reproductionThreshold = defaults.reproductionThreshold ?? 50;  // Energy needed to reproduce
        this.reproductionCost = defaults.reproductionCost ?? 0.6; // Fraction of energy given to offspring

        // Physical parameters (within bounds)
        this.sizePreference = defaults.sizePreference ?? 1.0;    // Preferred relative size

        // Behavioral traits
        this.isPredator = defaults.isPredator ?? false;

        // Phase 6: Morphology parameters - kernel characteristics
        // These define the creature's physical form and interaction radius
        this.kernelRadius = defaults.kernelRadius ?? 10;    // R: creature size (8-15 range)
        this.growthMu = defaults.growthMu ?? 0.15;          // μ: growth function center (0.1-0.3)
        this.growthSigma = defaults.growthSigma ?? 0.02;    // σ: growth function width (0.01-0.05)

        // Phase 7: Directional morphology parameters
        // These create asymmetric creatures with a "front" and "back"
        this.kernelBias = defaults.kernelBias ?? 0.0;       // Asymmetric bias (0 = symmetric, 0.1-0.5 = directional)
        this.kernelOrientation = defaults.kernelOrientation ?? 0;  // Preferred orientation relative to heading (radians)

        // Phase 8: Asymmetric sensing parameters
        // These control directional perception - creatures can sense better in certain directions
        this.sensorAngle = defaults.sensorAngle ?? 0;       // Direction of best sensing relative to heading (radians)
                                                            // 0 = forward, π = backward, ±π/2 = sideways
        this.sensorFocus = defaults.sensorFocus ?? 0.0;     // How focused the sensing is (0 = isotropic, 1 = narrow cone)

        // Phase 11: Memory parameters
        // These control how much creatures rely on past experience vs current stimuli
        this.memoryWeight = defaults.memoryWeight ?? 0.3;   // 0-1: how much memory influences movement
        this.memoryDecay = defaults.memoryDecay ?? 0.995;   // How fast memories fade (0.98-0.999)

        // Phase 12: Signal sensitivity parameters (bioluminescence)
        // These control how creatures respond to visual signals from others
        this.alarmSensitivity = defaults.alarmSensitivity ?? 0.5;     // Response to alarm signals (prey flee, hunters ignore)
        this.huntingSensitivity = defaults.huntingSensitivity ?? 0.3; // Response to hunting signals (hunters converge)
        this.matingSensitivity = defaults.matingSensitivity ?? 0.4;   // Attraction to mating signals
        this.territorySensitivity = defaults.territorySensitivity ?? 0.2; // Response to territory markings
        this.signalEmissionRate = defaults.signalEmissionRate ?? 0.5; // How strongly creature signals (0-1)

        // Phase 13: Collective behavior parameters
        // These control emergent group behaviors like schooling and pack hunting
        this.alignmentWeight = defaults.alignmentWeight ?? 0.3;       // Heading alignment strength for flocking (0-1)
        this.flockingRadius = defaults.flockingRadius ?? 30;          // Distance to consider neighbors for alignment
        this.packCoordination = defaults.packCoordination ?? 0.4;     // Flanking vs direct chase for hunters (0-1)
        this.territoryRadius = defaults.territoryRadius ?? 40;        // Home territory size in pixels
        this.homingStrength = defaults.homingStrength ?? 0.2;         // Attraction to birthplace (0-1)
    }

    /**
     * Create a mutated copy of this genome
     * @param {number} mutationRate - How much parameters can change (0-1)
     * @returns {Genome} - New genome with mutations
     */
    mutate(mutationRate = 0.1) {
        const child = this.clone();

        // Add Gaussian noise to each parameter
        const mutate = (value, min, max) => {
            const noise = (Math.random() - 0.5) * 2 * mutationRate * (max - min);
            return Math.max(min, Math.min(max, value + noise));
        };

        // Mutate sensory weights
        child.foodWeight = mutate(child.foodWeight, -1, 2);
        child.pheromoneWeight = mutate(child.pheromoneWeight, -1, 2);
        child.socialWeight = mutate(child.socialWeight, -1, 2);

        // Mutate movement
        child.turnRate = mutate(child.turnRate, 0.01, 0.5);
        child.speedPreference = mutate(child.speedPreference, 0.5, 2.0);

        // Mutate metabolism (keep reasonable bounds)
        child.metabolismRate = mutate(child.metabolismRate, 0.005, 0.1);
        child.reproductionThreshold = mutate(child.reproductionThreshold, 20, 100);
        child.reproductionCost = mutate(child.reproductionCost, 0.4, 0.8);

        // Mutate physical
        child.sizePreference = mutate(child.sizePreference, 0.5, 2.0);

        // Phase 6: Mutate morphology parameters
        // Kernel radius affects creature size and sensing range
        child.kernelRadius = mutate(child.kernelRadius, 8, 15);
        // Growth mu affects what density the creature prefers
        child.growthMu = mutate(child.growthMu, 0.1, 0.3);
        // Growth sigma affects tolerance to density variations
        child.growthSigma = mutate(child.growthSigma, 0.01, 0.05);

        // Phase 7: Mutate directional parameters
        // Kernel bias affects how asymmetric/directional the creature is
        child.kernelBias = mutate(child.kernelBias, 0, 0.5);
        // Kernel orientation affects which direction is "forward" relative to heading
        child.kernelOrientation = mutate(child.kernelOrientation, -Math.PI, Math.PI);
        // Normalize orientation to [-PI, PI]
        while (child.kernelOrientation > Math.PI) child.kernelOrientation -= 2 * Math.PI;
        while (child.kernelOrientation < -Math.PI) child.kernelOrientation += 2 * Math.PI;

        // Phase 8: Mutate asymmetric sensing parameters
        // Sensor angle affects which direction the creature senses best
        child.sensorAngle = mutate(child.sensorAngle, -Math.PI, Math.PI);
        // Normalize to [-PI, PI]
        while (child.sensorAngle > Math.PI) child.sensorAngle -= 2 * Math.PI;
        while (child.sensorAngle < -Math.PI) child.sensorAngle += 2 * Math.PI;
        // Sensor focus affects how directional vs isotropic sensing is
        child.sensorFocus = mutate(child.sensorFocus, 0, 1.0);

        // Phase 11: Mutate memory parameters
        // Memory weight affects how much creature relies on past experience
        child.memoryWeight = mutate(child.memoryWeight, 0, 1.0);
        // Memory decay affects how long memories persist
        child.memoryDecay = mutate(child.memoryDecay, 0.98, 0.999);

        // Phase 12: Mutate signal sensitivity parameters
        // Alarm sensitivity - prey benefit from high values, hunters from low
        child.alarmSensitivity = mutate(child.alarmSensitivity, 0, 1.0);
        // Hunting sensitivity - hunters benefit from high values to converge
        child.huntingSensitivity = mutate(child.huntingSensitivity, -0.5, 1.0);
        // Mating sensitivity - affects clustering for reproduction
        child.matingSensitivity = mutate(child.matingSensitivity, 0, 1.0);
        // Territory sensitivity - affects spacing between creatures
        child.territorySensitivity = mutate(child.territorySensitivity, -0.5, 1.0);
        // Signal emission rate - affects how visible creature is
        child.signalEmissionRate = mutate(child.signalEmissionRate, 0.1, 1.0);

        // Phase 13: Mutate collective behavior parameters
        // Alignment weight - affects how strongly creature matches neighbor headings
        child.alignmentWeight = mutate(child.alignmentWeight, 0, 1.0);
        // Flocking radius - distance to consider neighbors for alignment
        child.flockingRadius = mutate(child.flockingRadius, 15, 50);
        // Pack coordination - hunters: flanking vs direct chase
        child.packCoordination = mutate(child.packCoordination, 0, 1.0);
        // Territory radius - size of home territory
        child.territoryRadius = mutate(child.territoryRadius, 0, 80);
        // Homing strength - attraction to birthplace
        child.homingStrength = mutate(child.homingStrength, 0, 0.5);

        // Small chance to flip predator status
        if (Math.random() < mutationRate * 0.1) {
            child.isPredator = !child.isPredator;
        }

        return child;
    }

    /**
     * Create an exact copy of this genome
     * @returns {Genome}
     */
    clone() {
        return new Genome({
            foodWeight: this.foodWeight,
            pheromoneWeight: this.pheromoneWeight,
            socialWeight: this.socialWeight,
            turnRate: this.turnRate,
            speedPreference: this.speedPreference,
            metabolismRate: this.metabolismRate,
            reproductionThreshold: this.reproductionThreshold,
            reproductionCost: this.reproductionCost,
            sizePreference: this.sizePreference,
            isPredator: this.isPredator,
            // Phase 6: Morphology parameters
            kernelRadius: this.kernelRadius,
            growthMu: this.growthMu,
            growthSigma: this.growthSigma,
            // Phase 7: Directional parameters
            kernelBias: this.kernelBias,
            kernelOrientation: this.kernelOrientation,
            // Phase 8: Asymmetric sensing parameters
            sensorAngle: this.sensorAngle,
            sensorFocus: this.sensorFocus,
            // Phase 11: Memory parameters
            memoryWeight: this.memoryWeight,
            memoryDecay: this.memoryDecay,
            // Phase 12: Signal sensitivity parameters
            alarmSensitivity: this.alarmSensitivity,
            huntingSensitivity: this.huntingSensitivity,
            matingSensitivity: this.matingSensitivity,
            territorySensitivity: this.territorySensitivity,
            signalEmissionRate: this.signalEmissionRate,
            // Phase 13: Collective behavior parameters
            alignmentWeight: this.alignmentWeight,
            flockingRadius: this.flockingRadius,
            packCoordination: this.packCoordination,
            territoryRadius: this.territoryRadius,
            homingStrength: this.homingStrength
        });
    }

    /**
     * Create a genome from species preset sensory parameters
     * @param {Object} sensory - Sensory parameters from species preset
     * @returns {Genome}
     */
    static fromSensoryParams(sensory) {
        return new Genome({
            foodWeight: sensory.foodWeight ?? 1.0,
            pheromoneWeight: sensory.pheromoneWeight ?? 0.5,
            socialWeight: sensory.socialWeight ?? 0.3,
            turnRate: sensory.turnRate ?? 0.15,
            isPredator: sensory.isPredator ?? false,
            // Phase 6: Morphology defaults
            kernelRadius: sensory.kernelRadius ?? 10,
            growthMu: sensory.growthMu ?? 0.15,
            growthSigma: sensory.growthSigma ?? 0.02,
            // Phase 7: Directional defaults
            kernelBias: sensory.kernelBias ?? 0.0,
            kernelOrientation: sensory.kernelOrientation ?? 0,
            // Phase 8: Asymmetric sensing defaults
            sensorAngle: sensory.sensorAngle ?? 0,
            sensorFocus: sensory.sensorFocus ?? 0.0,
            // Phase 11: Memory defaults
            memoryWeight: sensory.memoryWeight ?? 0.3,
            memoryDecay: sensory.memoryDecay ?? 0.995,
            // Phase 12: Signal sensitivity defaults
            alarmSensitivity: sensory.alarmSensitivity ?? 0.5,
            huntingSensitivity: sensory.huntingSensitivity ?? 0.3,
            matingSensitivity: sensory.matingSensitivity ?? 0.4,
            territorySensitivity: sensory.territorySensitivity ?? 0.2,
            signalEmissionRate: sensory.signalEmissionRate ?? 0.5,
            // Phase 13: Collective behavior defaults
            alignmentWeight: sensory.alignmentWeight ?? 0.3,
            flockingRadius: sensory.flockingRadius ?? 30,
            packCoordination: sensory.packCoordination ?? 0.4,
            territoryRadius: sensory.territoryRadius ?? 40,
            homingStrength: sensory.homingStrength ?? 0.2
        });
    }
}

class CreatureTracker {
    constructor(size) {
        this.size = size;

        // Creature data
        this.creatures = [];         // Array of Creature objects
        this.nextId = 1;             // Next creature ID to assign
        this.labels = new Int32Array(size * size);  // Cell labels

        // Tracking parameters
        this.params = {
            massThreshold: 0.1,       // Minimum cell value to be part of creature
            minCreatureMass: 5.0,     // Minimum mass to be considered a creature
            maxCreatures: 50,         // Maximum creatures to track
            matchDistance: 30,        // Max distance to match creatures between frames
            headingSmoothing: 0.1,    // How quickly heading updates (0-1)
            velocitySmoothing: 0.3    // How quickly velocity updates (0-1)
        };

        // Sensory parameters
        this.sensory = {
            foodWeight: 1.0,          // Attraction to food (0-2)
            pheromoneWeight: 0.5,     // Attraction to pheromones (0-2)
            socialWeight: 0.3,        // Attraction to other creatures (can be negative)
            socialDistance: 50,       // Distance at which social forces apply
            turnRate: 0.15,           // How fast creatures can turn (0-1)
            isPredator: false         // If true, attracted to smaller creatures
        };

        // Phase 5: Evolution parameters
        this.evolution = {
            enabled: false,           // Whether evolution is active
            mutationRate: 0.1,        // How much genomes mutate (0.01-0.3)
            baseMetabolism: 0.02,     // Base energy cost per frame
            sizeMetabolismFactor: 0.001, // Additional cost per unit mass
            foodEnergyGain: 0.5,      // Energy gained per unit food consumed
            reproductionThreshold: 50, // Default energy to reproduce
            maxPopulation: 30,        // Maximum creatures allowed
            deathBecomesFood: true,   // Dead creature mass becomes food
            minCreatureEnergy: 10,    // Minimum energy for new creatures
            predationEnergy: 1.5      // Phase 10: Energy gained per unit prey mass consumed (higher to sustain hunters)
        };

        // Phase 10: Ecosystem mode
        this.ecosystemMode = false;
        this.hunterGenome = null;     // Base genome for hunters
        this.preyGenome = null;       // Base genome for prey

        // Evolution statistics
        this.stats = {
            totalBirths: 0,
            totalDeaths: 0,
            highestGeneration: 0,
            averageEnergy: 0,
            averageGeneration: 0,
            populationHistory: [],     // Track population over time
            traitAverages: {},         // Average genome values
            predationEvents: 0         // Phase 10: Number of successful hunts
        };

        // Pending reproduction events (processed after detection)
        this.pendingReproductions = [];
        this.pendingDeaths = [];

        // Base genome for species (set from species preset)
        this.baseGenome = null;

        // Working buffers
        this.visited = new Uint8Array(size * size);

        // Phase 12: Environment reference for signal emission
        this.environment = null;

        // Phase 12: Track recent signal emissions for glow effect
        this.recentSignals = new Map();  // creatureId -> { type, intensity, frame }
    }

    /**
     * Creature data structure
     */
    static Creature = class {
        constructor(id) {
            this.id = id;
            this.x = 0;               // Center of mass X
            this.y = 0;               // Center of mass Y
            this.mass = 0;            // Total mass
            this.vx = 0;              // Velocity X
            this.vy = 0;              // Velocity Y
            this.heading = 0;         // Current heading angle (radians)
            this.targetHeading = 0;   // Target heading from sensors
            this.cells = [];          // Array of {x, y, value} in creature
            this.age = 0;             // Frames since creation
            this.lastSeen = 0;        // Frame when last detected

            // Phase 5: Evolution fields
            this.energy = 25;         // Current energy level (starts at 25)
            this.genome = null;       // Genome object (set externally)
            this.generation = 0;      // Generation number (0 = original)
            this.parentId = null;     // ID of parent creature (null if original)
            this.birthFrame = 0;      // Frame when creature was born

            // Phase 13: Territory/homing fields
            this.homeX = null;        // Birth location X (set when first detected)
            this.homeY = null;        // Birth location Y (set when first detected)
        }

        /**
         * Get creature's speed
         */
        get speed() {
            return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        }

        /**
         * Get creature's approximate radius
         */
        get radius() {
            return Math.sqrt(this.mass / Math.PI);
        }

        /**
         * Check if creature has enough energy to reproduce
         */
        get canReproduce() {
            if (!this.genome) return false;
            return this.energy >= this.genome.reproductionThreshold;
        }

        /**
         * Check if creature is alive (has energy)
         */
        get isAlive() {
            return this.energy > 0;
        }
    };

    /**
     * Detect and track creatures in the mass field
     * @param {Float32Array} massField - The Lenia activation grid
     * @param {number} frameNumber - Current frame for tracking
     */
    update(massField, frameNumber = 0) {
        // Find connected components
        const newCreatures = this.findCreatures(massField);

        // Match with existing creatures
        this.matchCreatures(newCreatures, frameNumber);

        // Update creature properties
        this.updateCreatureProperties(frameNumber);
    }

    /**
     * Find connected components (creatures) in the mass field
     */
    findCreatures(massField) {
        const { size, params } = this;
        const creatures = [];

        this.labels.fill(0);
        this.visited.fill(0);

        let labelId = 0;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = y * size + x;

                if (this.visited[idx] || massField[idx] < params.massThreshold) {
                    continue;
                }

                // Start flood fill for new component
                labelId++;
                const cells = this.floodFill(massField, x, y, labelId);

                // Calculate creature properties
                let totalMass = 0;
                let cx = 0, cy = 0;

                for (const cell of cells) {
                    totalMass += cell.value;
                    cx += cell.x * cell.value;
                    cy += cell.y * cell.value;
                }

                if (totalMass >= params.minCreatureMass) {
                    const creature = new CreatureTracker.Creature(0); // ID assigned later
                    creature.x = cx / totalMass;
                    creature.y = cy / totalMass;
                    creature.mass = totalMass;
                    creature.cells = cells;
                    creatures.push(creature);
                }
            }
        }

        // Sort by mass (largest first) and limit
        creatures.sort((a, b) => b.mass - a.mass);
        return creatures.slice(0, params.maxCreatures);
    }

    /**
     * Flood fill to find connected component
     */
    floodFill(massField, startX, startY, labelId) {
        const { size, params } = this;
        const cells = [];
        const stack = [{ x: startX, y: startY }];

        while (stack.length > 0) {
            const { x, y } = stack.pop();
            const idx = y * size + x;

            if (this.visited[idx]) continue;
            if (massField[idx] < params.massThreshold) continue;

            this.visited[idx] = 1;
            this.labels[idx] = labelId;

            const value = massField[idx];
            cells.push({ x, y, value });

            // Check 4 neighbors (toroidal)
            const neighbors = [
                { x: (x - 1 + size) % size, y },
                { x: (x + 1) % size, y },
                { x, y: (y - 1 + size) % size },
                { x, y: (y + 1) % size }
            ];

            for (const n of neighbors) {
                const nIdx = n.y * size + n.x;
                if (!this.visited[nIdx] && massField[nIdx] >= params.massThreshold) {
                    stack.push(n);
                }
            }
        }

        return cells;
    }

    /**
     * Match new creatures to existing ones using proximity
     */
    matchCreatures(newCreatures, frameNumber) {
        const { params } = this;
        const matched = new Set();
        const newList = [];

        // For each new creature, find best match
        for (const newCreature of newCreatures) {
            let bestMatch = null;
            let bestDist = params.matchDistance;

            for (const existing of this.creatures) {
                if (matched.has(existing.id)) continue;

                const dist = this.toroidalDistance(
                    newCreature.x, newCreature.y,
                    existing.x, existing.y
                );

                if (dist < bestDist) {
                    bestDist = dist;
                    bestMatch = existing;
                }
            }

            if (bestMatch) {
                // Update existing creature
                matched.add(bestMatch.id);

                const oldX = bestMatch.x;
                const oldY = bestMatch.y;

                bestMatch.x = newCreature.x;
                bestMatch.y = newCreature.y;
                bestMatch.mass = newCreature.mass;
                bestMatch.cells = newCreature.cells;
                bestMatch.lastSeen = frameNumber;
                bestMatch.age++;

                // Calculate velocity (with toroidal wrapping)
                const dx = this.toroidalDelta(newCreature.x, oldX, this.size);
                const dy = this.toroidalDelta(newCreature.y, oldY, this.size);

                bestMatch.vx = bestMatch.vx * (1 - params.velocitySmoothing) +
                               dx * params.velocitySmoothing;
                bestMatch.vy = bestMatch.vy * (1 - params.velocitySmoothing) +
                               dy * params.velocitySmoothing;

                // Update heading from velocity
                if (bestMatch.speed > 0.1) {
                    bestMatch.heading = Math.atan2(bestMatch.vy, bestMatch.vx);
                }

                // Phase 11: Ensure memory exists and set decay rate from genome
                if (!bestMatch.memory) {
                    bestMatch.memory = new CreatureMemory(8);
                }
                if (bestMatch.genome) {
                    bestMatch.memory.decayRate = bestMatch.genome.memoryDecay;
                }

                newList.push(bestMatch);
            } else {
                // Create new creature
                newCreature.id = this.nextId++;
                newCreature.lastSeen = frameNumber;
                newCreature.heading = Math.random() * Math.PI * 2;
                // Phase 11: Initialize memory for new creature
                newCreature.memory = new CreatureMemory(8);
                // Phase 13: Set home location to birth position
                newCreature.homeX = newCreature.x;
                newCreature.homeY = newCreature.y;
                newList.push(newCreature);
            }
        }

        this.creatures = newList;
    }

    /**
     * Update creature properties after matching
     */
    updateCreatureProperties(frameNumber) {
        const { headingSmoothing } = this.params;

        for (const creature of this.creatures) {
            // Smooth heading toward target
            if (creature.targetHeading !== undefined) {
                let headingDiff = creature.targetHeading - creature.heading;

                // Normalize to [-PI, PI]
                while (headingDiff > Math.PI) headingDiff -= 2 * Math.PI;
                while (headingDiff < -Math.PI) headingDiff += 2 * Math.PI;

                creature.heading += headingDiff * headingSmoothing;

                // Normalize heading
                while (creature.heading > Math.PI) creature.heading -= 2 * Math.PI;
                while (creature.heading < -Math.PI) creature.heading += 2 * Math.PI;
            }
        }

        // Remove stale creatures (not seen for 10 frames)
        this.creatures = this.creatures.filter(c => frameNumber - c.lastSeen < 10);
    }

    /**
     * Compute toroidal distance
     */
    toroidalDistance(x1, y1, x2, y2) {
        const dx = Math.min(Math.abs(x2 - x1), this.size - Math.abs(x2 - x1));
        const dy = Math.min(Math.abs(y2 - y1), this.size - Math.abs(y2 - y1));
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Compute toroidal delta (shortest path direction)
     */
    toroidalDelta(to, from, size) {
        let delta = to - from;
        if (delta > size / 2) delta -= size;
        if (delta < -size / 2) delta += size;
        return delta;
    }

    /**
     * Compute sensory input for a creature
     * Phase 8: Now applies directional weighting based on sensorAngle and sensorFocus
     * @param {Creature} creature - The sensing creature
     * @param {Environment} environment - Environment with food/pheromone fields
     * @returns {Object} - Sensory direction {x, y}
     */
    computeSensoryInput(creature, environment) {
        // Use per-creature sensory parameters if evolution is enabled
        const sensory = this.getCreatureSensory(creature);
        let senseX = 0;
        let senseY = 0;

        // Phase 8: Get asymmetric sensing parameters from genome
        const genome = creature.genome;
        const sensorAngle = genome ? genome.sensorAngle : 0;
        const sensorFocus = genome ? genome.sensorFocus : 0;

        // Preferred sensing direction = creature heading + sensor angle offset
        const preferredDir = creature.heading + sensorAngle;

        // Food gradient sensing with directional weighting
        if (sensory.foodWeight !== 0 && environment) {
            const foodGrad = environment.getFoodGradient(creature.x, creature.y);
            const weighted = this.applyDirectionalWeight(foodGrad, preferredDir, sensorFocus);
            senseX += weighted.x * sensory.foodWeight;
            senseY += weighted.y * sensory.foodWeight;
        }

        // Pheromone gradient sensing with directional weighting
        if (sensory.pheromoneWeight !== 0 && environment) {
            const pheromoneGrad = environment.getPheromoneGradient(creature.x, creature.y);
            const weighted = this.applyDirectionalWeight(pheromoneGrad, preferredDir, sensorFocus);
            senseX += weighted.x * sensory.pheromoneWeight;
            senseY += weighted.y * sensory.pheromoneWeight;
        }

        // Social sensing (other creatures) with directional weighting
        if (sensory.socialWeight !== 0) {
            const social = this.computeSocialForceForCreature(creature, sensory);
            const weighted = this.applyDirectionalWeight(social, preferredDir, sensorFocus);
            senseX += weighted.x * sensory.socialWeight;
            senseY += weighted.y * sensory.socialWeight;
        }

        // Add current (environmental flow) - no directional weighting for currents
        if (environment && environment.current) {
            senseX += environment.current.x;
            senseY += environment.current.y;
        }

        // Phase 11: Memory gradient influence
        if (creature.memory) {
            creature.memory.decay();  // Decay memories each frame
            const memGrad = creature.memory.getGradient(creature.x, creature.y, this.size);
            const memWeight = genome ? genome.memoryWeight : 0.3;
            // Scale memory gradient to be comparable to other sensory inputs
            senseX += memGrad.x * memWeight * 10;
            senseY += memGrad.y * memWeight * 10;
        }

        // Phase 12: Signal gradient sensing (bioluminescence response)
        if (environment && genome) {
            // Alarm signals - prey flee FROM them, hunters ignore
            const alarmGrad = environment.getSignalGradient('alarm', creature.x, creature.y);
            if (!genome.isPredator) {
                // Prey flee from alarm signals (negative attraction = repulsion)
                senseX -= alarmGrad.x * genome.alarmSensitivity * 15;
                senseY -= alarmGrad.y * genome.alarmSensitivity * 15;
            }

            // Hunting signals - hunters attracted TO them (pack hunting)
            const huntingGrad = environment.getSignalGradient('hunting', creature.x, creature.y);
            if (genome.isPredator) {
                senseX += huntingGrad.x * genome.huntingSensitivity * 10;
                senseY += huntingGrad.y * genome.huntingSensitivity * 10;
            } else {
                // Prey flee from hunting signals too
                senseX -= huntingGrad.x * Math.abs(genome.huntingSensitivity) * 8;
                senseY -= huntingGrad.y * Math.abs(genome.huntingSensitivity) * 8;
            }

            // Mating signals - all creatures attracted when fertile
            const reproThreshold = genome.reproductionThreshold || 50;
            if (creature.energy > reproThreshold * 0.5) {
                const matingGrad = environment.getSignalGradient('mating', creature.x, creature.y);
                const fertility = Math.min(1, (creature.energy - reproThreshold * 0.5) / (reproThreshold * 0.5));
                senseX += matingGrad.x * genome.matingSensitivity * fertility * 8;
                senseY += matingGrad.y * genome.matingSensitivity * fertility * 8;
            }

            // Territory signals - same species repelled, different attracted (or vice versa)
            const territoryGrad = environment.getSignalGradient('territory', creature.x, creature.y);
            // Generally repelled from territory markings (spacing behavior)
            senseX -= territoryGrad.x * genome.territorySensitivity * 5;
            senseY -= territoryGrad.y * genome.territorySensitivity * 5;
        }

        // Phase 13: Homing behavior - attraction to birthplace when outside territory
        if (genome && genome.homingStrength > 0 && creature.homeX !== null) {
            const homeDistX = this.toroidalDelta(creature.homeX, creature.x, this.size);
            const homeDistY = this.toroidalDelta(creature.homeY, creature.y, this.size);
            const homeDist = Math.sqrt(homeDistX * homeDistX + homeDistY * homeDistY);

            if (homeDist > genome.territoryRadius && homeDist > 1) {
                // Outside territory - gentle pull home
                const homeForce = genome.homingStrength * 0.5;
                senseX += (homeDistX / homeDist) * homeForce * 10;
                senseY += (homeDistY / homeDist) * homeForce * 10;
            }
        }

        // Phase 13: Flocking alignment (prey only - non-predators)
        if (genome && !genome.isPredator && genome.alignmentWeight > 0) {
            let avgHeadingX = 0, avgHeadingY = 0;
            let neighborCount = 0;

            for (const other of this.creatures) {
                if (other.id === creature.id) continue;
                if (other.genome && other.genome.isPredator) continue;  // Only align with fellow prey

                const dx = this.toroidalDelta(other.x, creature.x, this.size);
                const dy = this.toroidalDelta(other.y, creature.y, this.size);
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < genome.flockingRadius && dist > 5) {
                    // Use unit heading vectors for alignment
                    avgHeadingX += Math.cos(other.heading);
                    avgHeadingY += Math.sin(other.heading);
                    neighborCount++;
                }
            }

            if (neighborCount > 0) {
                avgHeadingX /= neighborCount;
                avgHeadingY /= neighborCount;

                // Blend alignment into sensory input
                senseX += avgHeadingX * genome.alignmentWeight * 5;
                senseY += avgHeadingY * genome.alignmentWeight * 5;
            }
        }

        // Phase 13: Pack hunting coordination (hunters only)
        if (genome && genome.isPredator && genome.packCoordination > 0) {
            // Find nearest prey
            let nearestPrey = null;
            let nearestDist = Infinity;

            for (const other of this.creatures) {
                if (other.genome && other.genome.isPredator) continue;  // Skip other hunters
                const dx = this.toroidalDelta(other.x, creature.x, this.size);
                const dy = this.toroidalDelta(other.y, creature.y, this.size);
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestPrey = other;
                }
            }

            if (nearestPrey && nearestDist < 60) {
                // Check for other hunters targeting same prey
                let otherHuntersNearby = 0;
                let avgHunterAngle = 0;

                for (const other of this.creatures) {
                    if (!other.genome || !other.genome.isPredator || other.id === creature.id) continue;
                    const otherToPreyX = this.toroidalDelta(nearestPrey.x, other.x, this.size);
                    const otherToPreyY = this.toroidalDelta(nearestPrey.y, other.y, this.size);
                    const otherToPrey = Math.sqrt(otherToPreyX * otherToPreyX + otherToPreyY * otherToPreyY);
                    if (otherToPrey < 80) {
                        otherHuntersNearby++;
                        avgHunterAngle += Math.atan2(otherToPreyY, otherToPreyX);
                    }
                }

                if (otherHuntersNearby > 0) {
                    // Flank: approach from perpendicular angle
                    const directDx = this.toroidalDelta(nearestPrey.x, creature.x, this.size);
                    const directDy = this.toroidalDelta(nearestPrey.y, creature.y, this.size);
                    const directAngle = Math.atan2(directDy, directDx);
                    avgHunterAngle /= otherHuntersNearby;

                    // Rotate 90 degrees from average hunter approach
                    // Use consistent side based on creature ID to avoid oscillation
                    const side = (creature.id % 2 === 0) ? 1 : -1;
                    const flankAngle = avgHunterAngle + Math.PI / 2 * side;

                    // Blend between direct chase and flanking
                    const finalAngle = directAngle * (1 - genome.packCoordination) +
                                       flankAngle * genome.packCoordination;

                    senseX += Math.cos(finalAngle) * 3;
                    senseY += Math.sin(finalAngle) * 3;
                }
            }
        }

        return { x: senseX, y: senseY };
    }

    /**
     * Apply directional weighting to a gradient based on sensor focus
     * Phase 8: Cosine-weighted sensing - strongest at preferredDir, weakest opposite
     * @param {Object} gradient - The gradient vector {x, y}
     * @param {number} preferredDir - The preferred sensing direction (radians)
     * @param {number} focus - How focused the sensing is (0 = isotropic, 1 = narrow cone)
     * @returns {Object} - Weighted gradient {x, y}
     */
    applyDirectionalWeight(gradient, preferredDir, focus) {
        // If focus is 0, return gradient unchanged (isotropic sensing)
        if (focus <= 0.001) {
            return gradient;
        }

        const gradMag = Math.sqrt(gradient.x * gradient.x + gradient.y * gradient.y);
        if (gradMag < 0.001) {
            return gradient; // No gradient to weight
        }

        // Compute direction of the gradient stimulus
        const stimulusDir = Math.atan2(gradient.y, gradient.x);

        // Compute angle difference between stimulus and preferred direction
        let relativeAngle = stimulusDir - preferredDir;
        // Normalize to [-PI, PI]
        while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
        while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;

        // Cosine weighting: strongest at angle=0 (aligned with preferred), weakest at angle=±π
        // baseFactor ranges from 0 (opposite direction) to 1 (aligned)
        const baseFactor = (1 + Math.cos(relativeAngle)) / 2;

        // Interpolate between full sensitivity (1.0) and directional sensitivity based on focus
        const directionWeight = 1.0 - focus + focus * baseFactor;

        return {
            x: gradient.x * directionWeight,
            y: gradient.y * directionWeight
        };
    }

    /**
     * Compute social force from other creatures (uses global sensory)
     */
    computeSocialForce(creature) {
        return this.computeSocialForceForCreature(creature, this.sensory);
    }

    /**
     * Compute social force from other creatures with specific sensory params
     * @param {Creature} creature - The creature computing forces
     * @param {Object} sensory - Sensory parameters to use
     */
    computeSocialForceForCreature(creature, sensory) {
        const { size } = this;
        let forceX = 0;
        let forceY = 0;

        for (const other of this.creatures) {
            if (other.id === creature.id) continue;

            const dist = this.toroidalDistance(
                creature.x, creature.y,
                other.x, other.y
            );

            if (dist < sensory.socialDistance && dist > 0) {
                // Direction toward other creature
                const dx = this.toroidalDelta(other.x, creature.x, size);
                const dy = this.toroidalDelta(other.y, creature.y, size);
                const len = Math.sqrt(dx * dx + dy * dy);

                if (len > 0) {
                    const nx = dx / len;
                    const ny = dy / len;

                    // Force magnitude decreases with distance
                    const strength = 1 - dist / sensory.socialDistance;

                    // Predator/prey: attracted to smaller, repelled by larger
                    if (sensory.isPredator) {
                        if (other.mass < creature.mass * 0.8) {
                            // Attracted to smaller (prey)
                            forceX += nx * strength * other.mass / creature.mass;
                            forceY += ny * strength * other.mass / creature.mass;
                        } else {
                            // Repelled by similar or larger
                            forceX -= nx * strength * 0.5;
                            forceY -= ny * strength * 0.5;
                        }
                    } else {
                        // Normal: attracted to similar size (schooling)
                        const sizeSimilarity = Math.min(creature.mass, other.mass) /
                                             Math.max(creature.mass, other.mass);
                        forceX += nx * strength * sizeSimilarity;
                        forceY += ny * strength * sizeSimilarity;
                    }
                }
            }
        }

        return { x: forceX, y: forceY };
    }

    /**
     * Update target headings for all creatures based on sensors
     */
    updateCreatureHeadings(environment) {
        for (const creature of this.creatures) {
            const sense = this.computeSensoryInput(creature, environment);
            const senseMag = Math.sqrt(sense.x * sense.x + sense.y * sense.y);

            if (senseMag > 0.001) {
                // Compute target heading from sensory input
                creature.targetHeading = Math.atan2(sense.y, sense.x);
            } else {
                // Keep current heading if no sensory input
                creature.targetHeading = creature.heading;
            }
        }
    }

    /**
     * Get steering force to inject into flow field at a position
     */
    getSteeringForce(x, y) {
        const idx = Math.floor(y) * this.size + Math.floor(x);
        const label = this.labels[idx];

        if (label === 0) return { x: 0, y: 0 };

        // Find the creature this cell belongs to
        for (const creature of this.creatures) {
            // Check if this creature contains this position
            for (const cell of creature.cells) {
                if (Math.floor(cell.x) === Math.floor(x) &&
                    Math.floor(cell.y) === Math.floor(y)) {
                    // Return steering force based on heading
                    const steer = this.sensory.turnRate;
                    return {
                        x: Math.cos(creature.heading) * steer * cell.value,
                        y: Math.sin(creature.heading) * steer * cell.value
                    };
                }
            }
        }

        return { x: 0, y: 0 };
    }

    /**
     * Get creature at position (if any)
     */
    getCreatureAt(x, y) {
        for (const creature of this.creatures) {
            const dist = this.toroidalDistance(x, y, creature.x, creature.y);
            if (dist < creature.radius * 2) {
                return creature;
            }
        }
        return null;
    }

    /**
     * Get all creatures
     */
    getCreatures() {
        return this.creatures;
    }

    /**
     * Get creature by ID
     */
    getCreatureById(id) {
        return this.creatures.find(c => c.id === id);
    }

    /**
     * Get largest creature
     */
    getLargestCreature() {
        if (this.creatures.length === 0) return null;
        return this.creatures.reduce((a, b) => a.mass > b.mass ? a : b);
    }

    /**
     * Get number of creatures
     */
    get count() {
        return this.creatures.length;
    }

    // ==================== Phase 5: Evolution Methods ====================

    /**
     * Update energy for all creatures based on food consumption and metabolism
     * @param {Environment} environment - Environment with food field
     */
    updateEnergy(environment) {
        if (!this.evolution.enabled) return;

        const { baseMetabolism, sizeMetabolismFactor, foodEnergyGain } = this.evolution;

        for (const creature of this.creatures) {
            if (!creature.genome) {
                // Assign default genome if missing
                creature.genome = new Genome();
            }

            // Metabolism cost: base + size-dependent cost
            const metabolismCost = creature.genome.metabolismRate +
                                   creature.mass * sizeMetabolismFactor;
            creature.energy -= metabolismCost;

            // Energy gain from food (if environment available)
            if (environment) {
                let foodConsumed = 0;
                for (const cell of creature.cells) {
                    const idx = Math.floor(cell.y) * this.size + Math.floor(cell.x);
                    if (idx >= 0 && idx < environment.food.length) {
                        const foodHere = environment.food[idx];
                        const consumed = Math.min(foodHere, cell.value * 0.1);
                        foodConsumed += consumed;
                        environment.food[idx] = Math.max(0, foodHere - consumed);
                    }
                }
                creature.energy += foodConsumed * foodEnergyGain;

                // Phase 11: Record food memory when food is consumed
                if (foodConsumed > 0 && creature.memory) {
                    creature.memory.recordFood(creature.x, creature.y, this.size, foodConsumed * 0.1);
                }
            }

            // Clamp energy
            creature.energy = Math.max(0, creature.energy);
        }
    }

    /**
     * Check for reproduction and death conditions
     * Returns lists of creatures to reproduce and remove
     */
    checkEvolutionEvents() {
        if (!this.evolution.enabled) return { reproduce: [], die: [] };

        const reproduce = [];
        const die = [];

        for (const creature of this.creatures) {
            // Check for death
            if (creature.energy <= 0) {
                die.push(creature);
                continue;
            }

            // Check for reproduction
            if (creature.canReproduce && this.creatures.length < this.evolution.maxPopulation) {
                reproduce.push(creature);
            }

            // Phase 12: Emit mating signal when energy is above 80% of reproduction threshold
            if (creature.genome) {
                const threshold = creature.genome.reproductionThreshold;
                if (creature.energy > threshold * 0.8 && creature.energy < threshold) {
                    // Emit mating signal - intensity based on how close to threshold
                    const readiness = (creature.energy - threshold * 0.8) / (threshold * 0.2);
                    this.emitSignal('mating', creature.x, creature.y, 0.5 * readiness, creature);
                }

                // Phase 13: Emit territory signal when inside core territory
                if (creature.homeX !== null && creature.genome.territoryRadius > 0) {
                    const homeDistX = this.toroidalDelta(creature.homeX, creature.x, this.size);
                    const homeDistY = this.toroidalDelta(creature.homeY, creature.y, this.size);
                    const homeDist = Math.sqrt(homeDistX * homeDistX + homeDistY * homeDistY);

                    // Inside core territory (80% of territory radius) - emit territory signal
                    if (homeDist < creature.genome.territoryRadius * 0.8) {
                        const intensity = creature.genome.signalEmissionRate * 0.3;
                        this.emitSignal('territory', creature.x, creature.y, intensity, creature);
                    }
                }
            }
        }

        return { reproduce, die };
    }

    /**
     * Process a reproduction event - creates offspring data
     * The actual mass splitting is handled by flow-lenia.js
     * @param {Creature} parent - Parent creature
     * @param {number} frameNumber - Current frame
     * @returns {Object} - Offspring data for flow field manipulation
     */
    processReproduction(parent, frameNumber) {
        if (!parent.genome) return null;

        // Energy cost
        const energyPerChild = parent.energy * parent.genome.reproductionCost / 2;
        parent.energy *= (1 - parent.genome.reproductionCost);

        // Create two offspring genomes with mutations
        const genome1 = parent.genome.mutate(this.evolution.mutationRate);
        const genome2 = parent.genome.mutate(this.evolution.mutationRate);

        // Track statistics
        this.stats.totalBirths += 2;
        const newGen = parent.generation + 1;
        if (newGen > this.stats.highestGeneration) {
            this.stats.highestGeneration = newGen;
        }

        // Phase 11: Offspring inherit partial memory from parent
        const memory1 = parent.memory ? parent.memory.clone(0.5) : null;
        const memory2 = parent.memory ? parent.memory.clone(0.5) : null;

        return {
            parentId: parent.id,
            parentX: parent.x,
            parentY: parent.y,
            parentMass: parent.mass,
            offspring: [
                {
                    genome: genome1,
                    energy: energyPerChild,
                    generation: newGen,
                    heading: parent.heading + Math.PI / 4,  // Slight angle offset
                    memory: memory1
                },
                {
                    genome: genome2,
                    energy: energyPerChild,
                    generation: newGen,
                    heading: parent.heading - Math.PI / 4,
                    memory: memory2
                }
            ]
        };
    }

    /**
     * Process a death event
     * @param {Creature} creature - Dying creature
     * @param {Environment} environment - Environment to add food to
     */
    processDeath(creature, environment) {
        this.stats.totalDeaths++;

        // Optionally convert dead mass to food
        if (this.evolution.deathBecomesFood && environment) {
            const foodAmount = creature.mass * 0.3;  // 30% of mass becomes food
            environment.addFood(creature.x, creature.y, foodAmount, creature.radius);
        }
    }

    /**
     * Assign genome to a newly detected creature that doesn't have one
     * @param {Creature} creature - Creature needing a genome
     */
    assignDefaultGenome(creature) {
        if (creature.genome) return;

        // Use base genome if set (from species preset), otherwise create from sensory settings
        if (this.baseGenome) {
            creature.genome = this.baseGenome.clone();
        } else {
            // Create genome from current global sensory settings
            creature.genome = new Genome({
                foodWeight: this.sensory.foodWeight,
                pheromoneWeight: this.sensory.pheromoneWeight,
                socialWeight: this.sensory.socialWeight,
                turnRate: this.sensory.turnRate,
                isPredator: this.sensory.isPredator
            });
        }

        creature.energy = this.evolution.minCreatureEnergy +
                          creature.mass * 0.5;  // Some energy based on size
    }

    /**
     * Register a new creature from reproduction
     * @param {Object} offspringData - Data from processReproduction
     * @param {number} offspringIndex - Which offspring (0 or 1)
     * @param {number} x - Position X
     * @param {number} y - Position Y
     * @param {number} mass - Initial mass
     * @param {number} frameNumber - Birth frame
     */
    registerOffspring(offspringData, offspringIndex, x, y, mass, frameNumber) {
        const data = offspringData.offspring[offspringIndex];

        const creature = new CreatureTracker.Creature(this.nextId++);
        creature.x = x;
        creature.y = y;
        creature.mass = mass;
        creature.genome = data.genome;
        creature.energy = data.energy;
        creature.generation = data.generation;
        creature.parentId = offspringData.parentId;
        creature.birthFrame = frameNumber;
        creature.heading = data.heading;
        creature.lastSeen = frameNumber;

        // Phase 11: Inherit memory from parent or create new
        if (data.memory) {
            creature.memory = data.memory;
            creature.memory.decayRate = creature.genome.memoryDecay;
        } else {
            creature.memory = new CreatureMemory(8);
            creature.memory.decayRate = creature.genome.memoryDecay;
        }

        // Phase 13: Set home location to birth position
        creature.homeX = x;
        creature.homeY = y;

        this.creatures.push(creature);
        return creature;
    }

    /**
     * Update evolution statistics
     */
    updateStats() {
        if (this.creatures.length === 0) {
            this.stats.averageEnergy = 0;
            this.stats.averageGeneration = 0;
            this.stats.traitAverages = {};
            return;
        }

        let totalEnergy = 0;
        let totalGen = 0;
        const traits = {
            foodWeight: 0,
            pheromoneWeight: 0,
            socialWeight: 0,
            turnRate: 0,
            metabolismRate: 0,
            // Phase 6: Morphology traits
            kernelRadius: 0,
            growthMu: 0,
            growthSigma: 0,
            // Phase 7: Directional traits
            kernelBias: 0,
            // Phase 8: Asymmetric sensing traits
            sensorFocus: 0,
            // Phase 11: Memory traits
            memoryWeight: 0,
            // Phase 13: Collective behavior traits
            alignmentWeight: 0,
            packCoordination: 0,
            homingStrength: 0
        };

        for (const creature of this.creatures) {
            totalEnergy += creature.energy;
            totalGen += creature.generation;

            if (creature.genome) {
                traits.foodWeight += creature.genome.foodWeight;
                traits.pheromoneWeight += creature.genome.pheromoneWeight;
                traits.socialWeight += creature.genome.socialWeight;
                traits.turnRate += creature.genome.turnRate;
                traits.metabolismRate += creature.genome.metabolismRate;
                // Phase 6: Morphology traits
                traits.kernelRadius += creature.genome.kernelRadius;
                traits.growthMu += creature.genome.growthMu;
                traits.growthSigma += creature.genome.growthSigma;
                // Phase 7: Directional traits
                traits.kernelBias += creature.genome.kernelBias;
                // Phase 8: Asymmetric sensing traits
                traits.sensorFocus += creature.genome.sensorFocus;
                // Phase 11: Memory traits
                traits.memoryWeight += creature.genome.memoryWeight;
                // Phase 13: Collective behavior traits
                traits.alignmentWeight += creature.genome.alignmentWeight;
                traits.packCoordination += creature.genome.packCoordination;
                traits.homingStrength += creature.genome.homingStrength;
            }
        }

        const n = this.creatures.length;
        this.stats.averageEnergy = totalEnergy / n;
        this.stats.averageGeneration = totalGen / n;

        for (const key in traits) {
            this.stats.traitAverages[key] = traits[key] / n;
        }

        // Track population history (keep last 500 frames)
        this.stats.populationHistory.push(n);
        if (this.stats.populationHistory.length > 500) {
            this.stats.populationHistory.shift();
        }
    }

    /**
     * Get sensory parameters for a specific creature (from genome or global)
     * @param {Creature} creature
     * @returns {Object} - Sensory parameters to use
     */
    getCreatureSensory(creature) {
        if (this.evolution.enabled && creature.genome) {
            return {
                foodWeight: creature.genome.foodWeight,
                pheromoneWeight: creature.genome.pheromoneWeight,
                socialWeight: creature.genome.socialWeight,
                turnRate: creature.genome.turnRate,
                isPredator: creature.genome.isPredator,
                socialDistance: this.sensory.socialDistance  // Keep global
            };
        }
        return this.sensory;
    }

    /**
     * Reset evolution statistics
     */
    resetStats() {
        this.stats = {
            totalBirths: 0,
            totalDeaths: 0,
            highestGeneration: 0,
            averageEnergy: 0,
            averageGeneration: 0,
            populationHistory: [],
            traitAverages: {},
            predationEvents: 0
        };
    }

    // ==================== Phase 12: Bioluminescent Signaling ====================

    /**
     * Phase 12: Set environment reference for signal emission
     */
    setEnvironment(environment) {
        this.environment = environment;
    }

    /**
     * Phase 12: Emit a visual signal from a creature
     * @param {string} type - 'alarm', 'hunting', 'mating', 'territory'
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} intensity - Signal strength (0-1)
     * @param {Creature} creature - The emitting creature (for tracking glow)
     */
    emitSignal(type, x, y, intensity, creature = null) {
        if (!this.environment) return;

        // Scale intensity by creature's signal emission rate if available
        let finalIntensity = intensity;
        if (creature && creature.genome) {
            finalIntensity *= creature.genome.signalEmissionRate;
        }

        // Emit signal to environment
        this.environment.emitSignal(type, x, y, finalIntensity);

        // Track recent emission for creature glow effect
        if (creature) {
            this.recentSignals.set(creature.id, {
                type: type,
                intensity: finalIntensity,
                frame: Date.now()
            });
        }
    }

    /**
     * Phase 12: Get recent signal info for a creature (for glow rendering)
     */
    getRecentSignal(creature) {
        const signal = this.recentSignals.get(creature.id);
        if (!signal) return null;

        // Fade out over 500ms
        const elapsed = Date.now() - signal.frame;
        if (elapsed > 500) {
            this.recentSignals.delete(creature.id);
            return null;
        }

        return {
            type: signal.type,
            intensity: signal.intensity * (1 - elapsed / 500)
        };
    }

    /**
     * Phase 12: Get signal color for a type
     */
    static getSignalColor(type) {
        switch (type) {
            case 'alarm':
                return [255, 100, 50];   // Red/orange
            case 'hunting':
                return [255, 50, 200];   // Magenta
            case 'mating':
                return [50, 200, 255];   // Cyan
            case 'territory':
                return [50, 255, 100];   // Green
            default:
                return [255, 255, 255];
        }
    }

    // ==================== Phase 10: Predator-Prey Ecosystem ====================

    /**
     * Process predation - hunters eat prey on contact
     * @param {Float32Array} grid - The Lenia mass field (for removing prey mass)
     * @param {number} size - Grid size
     */
    processPredation(grid, size) {
        if (!this.ecosystemMode) return;

        const hunters = this.creatures.filter(c => c.genome?.isPredator);
        const prey = this.creatures.filter(c => c.genome && !c.genome.isPredator);
        const eaten = new Set();
        const alarmedPrey = new Set();  // Phase 12: Track prey that have already emitted alarm

        for (const hunter of hunters) {
            for (const preyCreature of prey) {
                if (eaten.has(preyCreature.id)) continue;

                const dist = this.toroidalDistance(
                    hunter.x, hunter.y,
                    preyCreature.x, preyCreature.y
                );

                // Catch radius based on both creature sizes (generous to allow predation)
                const catchRadius = (hunter.radius + preyCreature.radius) * 1.0;

                // Phase 11: Record danger memory for nearby prey (within 2x catch radius)
                const dangerRadius = catchRadius * 2;
                if (dist < dangerRadius && preyCreature.memory && !eaten.has(preyCreature.id)) {
                    const intensity = 0.3 * (1 - dist / dangerRadius);
                    preyCreature.memory.recordDanger(hunter.x, hunter.y, size, intensity);
                }

                // Phase 12: Prey emit alarm signal when hunter is nearby (within 1.5x catch radius)
                const alarmRadius = catchRadius * 1.5;
                if (dist < alarmRadius && !alarmedPrey.has(preyCreature.id) && !eaten.has(preyCreature.id)) {
                    const alarmIntensity = 0.8 * (1 - dist / alarmRadius);
                    this.emitSignal('alarm', preyCreature.x, preyCreature.y, alarmIntensity, preyCreature);
                    alarmedPrey.add(preyCreature.id);
                }

                if (dist < catchRadius) {
                    // Predation! Hunter eats prey
                    hunter.energy += preyCreature.mass * this.evolution.predationEnergy;
                    eaten.add(preyCreature.id);
                    this.stats.predationEvents++;

                    // Phase 12: Hunter emits hunting signal on successful catch
                    this.emitSignal('hunting', hunter.x, hunter.y, 1.0, hunter);

                    // Remove prey mass from the grid
                    for (const cell of preyCreature.cells) {
                        const idx = Math.floor(cell.y) * size + Math.floor(cell.x);
                        if (idx >= 0 && idx < grid.length) {
                            grid[idx] = 0;
                        }
                    }
                }
            }
        }

        // Remove eaten prey from creature list
        if (eaten.size > 0) {
            this.creatures = this.creatures.filter(c => !eaten.has(c.id));
            this.stats.totalDeaths += eaten.size;
        }
    }

    /**
     * Spawn a mixed ecosystem with hunters and prey
     * @param {FlowLenia} flowLenia - Flow-Lenia simulation instance
     * @param {number} numHunters - Number of hunters to spawn (default 2)
     * @param {number} numPrey - Number of prey to spawn (default 6)
     */
    spawnEcosystem(flowLenia, numHunters = 2, numPrey = 6) {
        const size = flowLenia.size;

        // Create base genomes from species presets
        this.hunterGenome = new Genome(Species.hunter.params.genome);
        this.preyGenome = new Genome(Species.prey.params.genome);

        // Clear existing creatures
        this.creatures = [];
        this.ecosystemMode = true;

        // Track spawned positions to avoid overlap
        const positions = [];

        const getSpawnPosition = (minDist = 40) => {
            for (let attempts = 0; attempts < 50; attempts++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                let valid = true;

                for (const pos of positions) {
                    if (this.toroidalDistance(x, y, pos.x, pos.y) < minDist) {
                        valid = false;
                        break;
                    }
                }

                if (valid) {
                    positions.push({ x, y });
                    return { x, y };
                }
            }
            // Fallback if can't find good position
            const x = Math.random() * size;
            const y = Math.random() * size;
            positions.push({ x, y });
            return { x, y };
        };

        // Spawn hunters (larger blobs)
        for (let i = 0; i < numHunters; i++) {
            const pos = getSpawnPosition(50);
            flowLenia.drawBlob(pos.x, pos.y, 14, 0.9);
        }

        // Spawn prey (smaller blobs, more spread out)
        for (let i = 0; i < numPrey; i++) {
            const pos = getSpawnPosition(30);
            flowLenia.drawBlob(pos.x, pos.y, 10, 0.85);
        }

        // Store expected counts for genome assignment
        this._pendingHunters = numHunters;
        this._pendingPrey = numPrey;
    }

    /**
     * Assign genomes to newly detected creatures in ecosystem mode
     * Uses pending hunter/prey counts to assign largest creatures as hunters
     */
    assignEcosystemGenomes() {
        if (!this.ecosystemMode) return;

        // Sort creatures by mass (largest first)
        const unassigned = this.creatures.filter(c => !c.genome);
        if (unassigned.length === 0) return;

        unassigned.sort((a, b) => b.mass - a.mass);

        // Count how many hunters and prey we currently have
        const currentHunters = this.creatures.filter(c => c.genome?.isPredator).length;
        const currentPrey = this.creatures.filter(c => c.genome && !c.genome.isPredator).length;

        // Use pending counts if available (initial spawn)
        let huntersNeeded = (this._pendingHunters || 0) - currentHunters;
        let preyNeeded = (this._pendingPrey || 0) - currentPrey;

        // Clear pending counts after first assignment
        if (this._pendingHunters !== undefined) {
            this._pendingHunters = 0;
            this._pendingPrey = 0;
        }

        for (const creature of unassigned) {
            // Assign largest unassigned creatures as hunters first
            if (huntersNeeded > 0 && this.hunterGenome) {
                creature.genome = this.hunterGenome.clone();
                huntersNeeded--;
                // Hunters get more starting energy since they can't eat food
                creature.energy = this.evolution.minCreatureEnergy + creature.mass * 1.0;
            } else if (this.preyGenome) {
                creature.genome = this.preyGenome.clone();
                creature.energy = this.evolution.minCreatureEnergy + creature.mass * 0.5;
            } else {
                // Fallback
                this.assignDefaultGenome(creature);
                creature.energy = this.evolution.minCreatureEnergy + creature.mass * 0.5;
            }
        }
    }

    /**
     * Check and maintain population balance in ecosystem mode
     * Respawns species if they go extinct
     * @param {FlowLenia} flowLenia - Flow-Lenia instance for spawning
     */
    balancePopulation(flowLenia) {
        if (!this.ecosystemMode || !this.evolution.enabled) return;

        const hunters = this.creatures.filter(c => c.genome?.isPredator);
        const prey = this.creatures.filter(c => c.genome && !c.genome.isPredator);
        const size = flowLenia.size;

        // Respawn prey if extinct (and hunters exist)
        if (prey.length === 0 && hunters.length > 0) {
            // Spawn 2 new prey at random locations
            for (let i = 0; i < 2; i++) {
                const x = Math.random() * size;
                const y = Math.random() * size;
                flowLenia.drawBlob(x, y, 10, 0.85);
            }
        }

        // Respawn hunter if extinct (and prey exist)
        if (hunters.length === 0 && prey.length > 0) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            flowLenia.drawBlob(x, y, 14, 0.9);
        }
    }

    /**
     * Clear all creatures
     */
    clear() {
        this.creatures = [];
        this.labels.fill(0);
        this.resetStats();
    }

    /**
     * Resize the tracker
     */
    resize(newSize) {
        this.size = newSize;
        this.labels = new Int32Array(newSize * newSize);
        this.visited = new Uint8Array(newSize * newSize);
        this.creatures = [];
    }
}
