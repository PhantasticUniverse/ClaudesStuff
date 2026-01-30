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

    // ==================== Sensory Species (Phase 4) ====================
    // These species are optimized for sensory-driven behavior with environmental awareness

    /**
     * Grazer - Strong food attraction, mild social avoidance
     * Slowly moves toward food sources, maintains distance from other grazers
     */
    grazer: {
        name: "Grazer",
        description: "Grazes on food sources, avoids crowding with other creatures.",
        params: {
            R: 10,
            peaks: 1,
            mu: 0.20,
            sigma: 0.032,
            dt: 0.12,
            flowStrength: 0.9,
            diffusion: 0.1,
            isFlowSpecies: true,
            isSensorySpecies: true,
            kernelType: 'ring',
            // Sensory parameters
            sensory: {
                foodWeight: 1.5,        // Strong attraction to food
                pheromoneWeight: 0.3,   // Mild trail following
                socialWeight: -0.2,     // Slight avoidance of others
                turnRate: 0.1,          // Slow turning
                isPredator: false
            },
            // Environment settings
            environment: {
                foodSpawnRate: 0.003,
                pheromoneDecayRate: 0.02,
                pheromoneEmissionRate: 0.05
            },
            // Phase 5: Evolution genome
            // Phase 6: Added morphology parameters
            // Phase 7: Added directional parameters
            // Phase 8: Added asymmetric sensing parameters
            genome: {
                foodWeight: 1.5,
                pheromoneWeight: 0.3,
                socialWeight: -0.2,
                turnRate: 0.1,
                speedPreference: 0.8,
                metabolismRate: 0.015,    // Low metabolism (efficient)
                reproductionThreshold: 45,
                reproductionCost: 0.55,
                sizePreference: 1.0,
                isPredator: false,
                // Morphology: medium-sized, balanced
                // Phase 15: Reduced growthSigma for tighter shape (was 0.025)
                kernelRadius: 10,
                growthMu: 0.18,
                growthSigma: 0.018,
                // Directional: symmetric forager
                kernelBias: 0.05,
                kernelOrientation: 0,
                // Sensing: mostly isotropic, explores evenly
                sensorAngle: 0,
                sensorFocus: 0.1,
                // Memory: strong food memory for returning to feeding grounds
                memoryWeight: 0.6,
                memoryDecay: 0.995,
                // Phase 12: Signal sensitivity - mild responses
                alarmSensitivity: 0.3,      // Some response to danger
                huntingSensitivity: 0.0,    // Ignores hunting activity
                matingSensitivity: 0.6,     // Strong mating attraction
                territorySensitivity: 0.2,  // Mild territorial spacing
                signalEmissionRate: 0.4,    // Moderate signaling
                // Phase 13: Collective behavior - territorial grazer
                alignmentWeight: 0.2,       // Light flocking
                flockingRadius: 25,         // Small flock awareness
                packCoordination: 0.0,      // Not a hunter
                territoryRadius: 45,        // Larger grazing territory
                homingStrength: 0.25,       // Strong homing instinct
                // Phase 16: Locomotion - slow foraging speed
                locomotionSpeed: 0.8
            }
        },
        // Compact circular blob
        pattern: (function() {
            const size = 16;
            const pattern = [];
            for (let y = 0; y < size; y++) {
                const row = [];
                for (let x = 0; x < size; x++) {
                    const cx = size / 2 - 0.5;
                    const cy = size / 2 - 0.5;
                    const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                    const maxR = size / 2.4;
                    let value = r < maxR ? 1 - (r / maxR) ** 2 : 0;
                    row.push(Math.max(0, value));
                }
                pattern.push(row);
            }
            return pattern;
        })()
    },

    /**
     * Schooler - Strong social attraction, follows pheromones
     * Forms groups with other schoolers, follows pheromone trails
     */
    schooler: {
        name: "Schooler",
        description: "Forms schools with others, follows pheromone trails.",
        params: {
            R: 11,
            peaks: 1,
            mu: 0.22,
            sigma: 0.03,
            dt: 0.1,
            flowStrength: 1.1,
            diffusion: 0.08,
            isFlowSpecies: true,
            isSensorySpecies: true,
            kernelType: 'ring',
            // Sensory parameters
            sensory: {
                foodWeight: 0.3,        // Weak food attraction
                pheromoneWeight: 1.2,   // Strong trail following
                socialWeight: 0.8,      // Strong attraction to others
                turnRate: 0.2,          // Medium turning
                isPredator: false
            },
            // Environment settings
            environment: {
                foodSpawnRate: 0.002,
                pheromoneDecayRate: 0.008,   // Slower decay for longer trails
                pheromoneEmissionRate: 0.15  // Stronger emissions
            },
            // Phase 5: Evolution genome
            // Phase 6: Added morphology parameters
            // Phase 7: Added directional parameters
            // Phase 8: Added asymmetric sensing parameters
            genome: {
                foodWeight: 0.3,
                pheromoneWeight: 1.2,
                socialWeight: 0.8,
                turnRate: 0.2,
                speedPreference: 1.1,
                metabolismRate: 0.02,
                reproductionThreshold: 50,
                reproductionCost: 0.6,
                sizePreference: 0.9,
                isPredator: false,
                // Morphology: medium-sized, moderate cohesion
                kernelRadius: 11,
                growthMu: 0.20,
                growthSigma: 0.022,
                // Directional: mild forward bias for group movement
                kernelBias: 0.1,
                kernelOrientation: 0,
                // Sensing: mild forward bias for group coordination
                sensorAngle: 0,
                sensorFocus: 0.2,
                // Memory: mild memory for group cohesion
                memoryWeight: 0.2,
                memoryDecay: 0.995,
                // Phase 12: Signal sensitivity - social coordination
                alarmSensitivity: 0.5,      // Responds to group alarms
                huntingSensitivity: -0.2,   // Mild avoidance of hunting activity
                matingSensitivity: 0.5,     // Moderate mating attraction
                territorySensitivity: 0.1,  // Low territorial behavior
                signalEmissionRate: 0.6,    // Active signaler for group coordination
                // Phase 13: Collective behavior - strong schooling
                alignmentWeight: 0.6,       // Strong heading alignment
                flockingRadius: 35,         // Medium flock awareness
                packCoordination: 0.0,      // Not a hunter
                territoryRadius: 0,         // No territory (nomadic)
                homingStrength: 0.0,        // No homing instinct
                // Phase 16: Locomotion - moderate group speed
                locomotionSpeed: 1.0
            }
        },
        // Streamlined shape for schooling
        pattern: (function() {
            const width = 18;
            const height = 14;
            const pattern = [];
            for (let y = 0; y < height; y++) {
                const row = [];
                for (let x = 0; x < width; x++) {
                    const cx = width / 2 - 0.5;
                    const cy = height / 2 - 0.5;
                    const dx = (x - cx) / (width / 2.5);
                    const dy = (y - cy) / (height / 2.5);
                    const r = Math.sqrt(dx * dx + dy * dy);
                    let value = r < 1 ? (1 - r * r) : 0;
                    row.push(Math.max(0, value));
                }
                pattern.push(row);
            }
            return pattern;
        })()
    },

    /**
     * Hunter - Attracted to other creatures, fast turning
     * Actively pursues smaller creatures (prey)
     */
    hunter: {
        name: "Hunter",
        description: "Actively hunts and pursues smaller creatures.",
        params: {
            R: 14,
            peaks: 1,
            mu: 0.24,
            sigma: 0.028,
            dt: 0.12,
            flowStrength: 1.8,    // Phase 15: FASTER than prey (1.2) for successful hunting
            diffusion: 0.06,
            isFlowSpecies: true,
            isSensorySpecies: true,
            kernelType: 'asymmetric',
            kernelParams: {
                bias: 0.3
            },
            // Sensory parameters
            sensory: {
                foodWeight: 0.0,        // Ignores food
                pheromoneWeight: 0.5,   // Uses pheromones to track
                socialWeight: 1.5,      // Strong creature attraction
                turnRate: 0.45,         // Phase 15: Very fast turning for predictive pursuit
                isPredator: true        // Chases smaller creatures
            },
            // Environment settings
            environment: {
                foodSpawnRate: 0.001,
                pheromoneDecayRate: 0.015,
                pheromoneEmissionRate: 0.08
            },
            // Phase 5: Evolution genome
            // Phase 6: Added morphology parameters
            // Phase 7: Added directional parameters
            // Phase 8: Added asymmetric sensing parameters
            genome: {
                foodWeight: 0.0,
                pheromoneWeight: 0.5,
                socialWeight: 1.5,
                turnRate: 0.45,         // Phase 15: Very fast turning for predictive pursuit
                speedPreference: 1.3,
                metabolismRate: 0.010,   // Phase 15: Very low metabolism - hunters need to survive long enough to catch prey
                reproductionThreshold: 80, // Increased from 60 for slower population growth
                reproductionCost: 0.65,
                sizePreference: 1.3,
                isPredator: true,
                // Morphology: LARGE kernel radius for better prey detection
                // Phase 15: Reduced growthSigma for tighter shape (was 0.028)
                kernelRadius: 14,
                growthMu: 0.24,
                growthSigma: 0.020,
                // Directional: HIGH bias for streamlined predator shape
                kernelBias: 0.3,
                kernelOrientation: 0,
                // Sensing: STRONG forward focus - spot prey ahead
                sensorAngle: 0,
                sensorFocus: 0.6,
                // Memory: remembers where prey was found
                memoryWeight: 0.4,
                memoryDecay: 0.99,
                // Phase 12: Signal sensitivity - pack hunting behavior
                alarmSensitivity: 0.0,      // Ignores prey warnings completely
                huntingSensitivity: 0.6,    // Converges on successful hunts
                matingSensitivity: 0.3,     // Moderate mating response
                territorySensitivity: 0.3,  // Some territorial spacing
                signalEmissionRate: 0.5,    // Signals on successful kills
                // Phase 13: Collective behavior - pack hunting
                alignmentWeight: 0.0,       // No flocking (predators don't school)
                flockingRadius: 0,          // N/A
                packCoordination: 0.5,      // Moderate flanking behavior
                territoryRadius: 50,        // Defends hunting grounds
                homingStrength: 0.1,        // Light homing instinct
                // Phase 16: Locomotion - fast pursuit speed
                locomotionSpeed: 2.0
            }
        },
        // Larger, more aggressive shape
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
                    const angle = Math.atan2(dy, dx);
                    // Slightly pointed forward
                    const maxR = (size / 2.3) * (1 + 0.15 * Math.cos(angle));
                    let value = r < maxR ? Math.pow(1 - (r / maxR) ** 2, 1.2) : 0;
                    row.push(Math.max(0, value));
                }
                pattern.push(row);
            }
            return pattern;
        })()
    },

    /**
     * Prey - Repelled by large creatures, fast but erratic
     * Flees from hunters, moves erratically
     */
    prey: {
        name: "Prey",
        description: "Flees from larger creatures, moves erratically.",
        params: {
            R: 9,
            peaks: 1,
            mu: 0.18,
            sigma: 0.035,
            dt: 0.14,
            flowStrength: 1.2,    // Phase 15: SLOWER than hunter (1.8) - realistic predator advantage
            diffusion: 0.12,
            isFlowSpecies: true,
            isSensorySpecies: true,
            kernelType: 'gaussian',
            // Sensory parameters
            sensory: {
                foodWeight: 0.8,        // Attracted to food for survival
                pheromoneWeight: -0.3,  // Avoids pheromone trails (could be predator)
                socialWeight: -0.8,     // Strong avoidance of other creatures
                turnRate: 0.4,          // Very fast turning for evasion
                isPredator: false
            },
            // Environment settings
            environment: {
                foodSpawnRate: 0.004,   // More food available
                pheromoneDecayRate: 0.025,
                pheromoneEmissionRate: 0.04  // Weak emissions to avoid detection
            },
            // Phase 5: Evolution genome
            // Phase 6: Added morphology parameters
            // Phase 7: Added directional parameters
            // Phase 8: Added asymmetric sensing parameters
            genome: {
                foodWeight: 0.8,
                pheromoneWeight: -0.3,
                socialWeight: -0.8,
                turnRate: 0.4,
                speedPreference: 1.4,
                metabolismRate: 0.03,    // Higher metabolism (always moving, burn energy faster)
                reproductionThreshold: 55, // Increased from 45 to prevent population explosion
                reproductionCost: 0.5,
                sizePreference: 0.7,     // Stay small
                isPredator: false,
                // Morphology: SMALL kernel radius for faster, more agile movement
                // Phase 15: Reduced growthSigma for tighter shape (was 0.03)
                kernelRadius: 8,
                growthMu: 0.16,
                growthSigma: 0.022,
                // Directional: LOW bias for maneuverability (can turn quickly)
                kernelBias: 0.1,
                kernelOrientation: 0,
                // Sensing: BACKWARD focus - detect approaching predators
                sensorAngle: Math.PI,    // π = backward
                sensorFocus: 0.4,
                // Memory: strong danger memory, remembers where predators attacked
                memoryWeight: 0.5,
                memoryDecay: 0.98,  // Remembers danger longer
                // Phase 12: Signal sensitivity - survival-focused
                alarmSensitivity: 0.8,      // Very responsive to danger signals
                huntingSensitivity: -0.3,   // Flees from hunting activity
                matingSensitivity: 0.4,     // Moderate mating response
                territorySensitivity: 0.1,  // Low territorial behavior
                signalEmissionRate: 0.7,    // Actively warns others of danger
                // Phase 13: Collective behavior - light schooling
                alignmentWeight: 0.4,       // Moderate heading alignment
                flockingRadius: 30,         // Medium flock awareness
                packCoordination: 0.0,      // Not a hunter
                territoryRadius: 35,        // Small territory
                homingStrength: 0.15,       // Moderate homing instinct
                // Phase 16: Locomotion - moderate escape speed
                locomotionSpeed: 1.2
            }
        },
        // Small, compact shape for speed
        pattern: (function() {
            const size = 12;
            const pattern = [];
            for (let y = 0; y < size; y++) {
                const row = [];
                for (let x = 0; x < size; x++) {
                    const cx = size / 2 - 0.5;
                    const cy = size / 2 - 0.5;
                    const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                    const maxR = size / 2.5;
                    let value = r < maxR ? 1 - (r / maxR) ** 2 : 0;
                    row.push(Math.max(0, value));
                }
                pattern.push(row);
            }
            return pattern;
        })()
    },

    // ==================== Phase 14: Migration Species ====================

    /**
     * Migrant - Nomadic creature optimized for seasonal migrations
     * Follows moving food zones, weak homing, strong exploration
     */
    migrant: {
        name: "Migrant",
        description: "Nomadic creature that follows seasonal food patterns and migrates across the world.",
        params: {
            R: 11,
            peaks: 1,
            mu: 0.20,
            sigma: 0.030,
            dt: 0.12,
            flowStrength: 1.2,
            diffusion: 0.10,
            isFlowSpecies: true,
            isSensorySpecies: true,
            kernelType: 'ring',
            // Sensory parameters
            sensory: {
                foodWeight: 1.2,        // Good food tracking
                pheromoneWeight: 0.6,   // Follow migration trails
                socialWeight: 0.4,      // Mild group cohesion
                turnRate: 0.2,          // Moderate turning
                isPredator: false
            },
            // Environment settings
            environment: {
                foodSpawnRate: 0.002,
                pheromoneDecayRate: 0.01,
                pheromoneEmissionRate: 0.1
            },
            // Phase 14: Migration-optimized genome
            genome: {
                foodWeight: 1.2,
                pheromoneWeight: 0.6,
                socialWeight: 0.4,
                turnRate: 0.2,
                speedPreference: 1.2,
                metabolismRate: 0.018,       // Efficient metabolism for long journeys
                reproductionThreshold: 55,
                reproductionCost: 0.55,
                sizePreference: 1.0,
                isPredator: false,
                // Morphology: medium-sized, balanced
                kernelRadius: 11,
                growthMu: 0.18,
                growthSigma: 0.025,
                // Directional: mild forward bias for travel
                kernelBias: 0.15,
                kernelOrientation: 0,
                // Sensing: forward-focused for spotting distant food
                sensorAngle: 0,
                sensorFocus: 0.3,
                // Memory: strong food memory for returning to good spots
                memoryWeight: 0.7,
                memoryDecay: 0.997,          // Long-lasting memories
                // Signal sensitivity
                alarmSensitivity: 0.4,
                huntingSensitivity: -0.1,
                matingSensitivity: 0.5,
                territorySensitivity: 0.1,
                signalEmissionRate: 0.5,
                // Collective behavior: nomadic, group migration
                alignmentWeight: 0.5,        // Strong group alignment for herds
                flockingRadius: 35,
                packCoordination: 0.0,
                territoryRadius: 20,         // Small territory (nomadic)
                homingStrength: 0.05,        // Very weak homing (nomadic)
                // Migration: optimized for following seasonal patterns
                migrationSensitivity: 0.8,   // Strong gradient following
                wanderlust: 0.7,             // High exploration when hungry
                seasonalAdaptation: 0.6,     // Anticipates changes
                // Phase 16: Locomotion - travel-oriented speed
                locomotionSpeed: 1.5
            }
        },
        // Elongated shape for long-distance travel
        pattern: (function() {
            const width = 20;
            const height = 14;
            const pattern = [];
            for (let y = 0; y < height; y++) {
                const row = [];
                for (let x = 0; x < width; x++) {
                    const cx = width / 2 - 0.5;
                    const cy = height / 2 - 0.5;
                    const dx = (x - cx) / (width / 2.5);
                    const dy = (y - cy) / (height / 2.5);
                    const r = Math.sqrt(dx * dx + dy * dy);
                    let value = r < 1 ? (1 - r * r) : 0;
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
