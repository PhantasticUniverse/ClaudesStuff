/**
 * Flow-Lenia Implementation - Phase 5: Evolving Creatures
 *
 * Flow-Lenia transforms standard Lenia from "matter appearing/disappearing"
 * to "matter flowing" - creating creatures that feel more physical and solid.
 *
 * Key difference from standard Lenia:
 * - In standard Lenia, G(U) adds or removes mass directly
 * - In Flow-Lenia, G(U) creates an "affinity map" - regions where matter WANTS to be
 * - Matter then flows toward high-affinity regions via gradient descent
 * - Total mass is conserved through reintegration tracking
 *
 * Phase 4 additions:
 * - Environmental layers (food, pheromones, currents)
 * - Creature detection and tracking
 * - Sensory-driven steering (creatures respond to environment)
 * - Persistent heading with smooth turning
 *
 * Phase 5 additions:
 * - Creatures have genomes with heritable parameters
 * - Energy system: gain from food, lose from metabolism
 * - Reproduction: when energy > threshold, creature splits
 * - Death: when energy <= 0, creature dies
 * - Natural selection: successful traits spread through population
 *
 * Algorithm:
 * 1. Update environment (food regrows, pheromones decay)
 * 2. Detect and track creatures
 * 3. Update creature energy (metabolism, food consumption)
 * 4. Process reproduction and death events
 * 5. Compute sensory inputs and update headings
 * 6. Compute potential U = K * A (same as standard Lenia)
 * 7. Compute affinity map: affinity = G(U)
 * 8. Compute flow field F = ∇(affinity) + steering
 * 9. Transport mass using reintegration tracking (mass-conservative)
 *
 * References:
 * - Flow-Lenia Paper: https://direct.mit.edu/artl/article/31/2/228/130572/
 * - arXiv: https://arxiv.org/abs/2212.07906
 */

class FlowLenia {
    constructor(size) {
        this.size = size;

        // Main state: activation/mass grid
        this.A = new Float32Array(size * size);

        // Working buffers
        this.potential = new Float32Array(size * size);   // K * A (convolution result)
        this.affinity = new Float32Array(size * size);    // G(potential) - where mass wants to be
        this.Fx = new Float32Array(size * size);          // Flow field X component
        this.Fy = new Float32Array(size * size);          // Flow field Y component
        this.newA = new Float32Array(size * size);        // Buffer for mass after transport

        // Parameters (same as standard Lenia)
        this.R = 13;           // Kernel radius
        this.peaks = 1;        // Number of kernel peaks
        this.mu = 0.15;        // Growth function center
        this.sigma = 0.015;    // Growth function width
        this.dt = 0.1;         // Time step

        // Flow-specific parameters
        this.flowStrength = 1.0;   // How strongly mass follows the gradient (0.5 - 2.0)
        this.diffusion = 0.1;      // Diffusion rate to prevent mass collapse (0.0 - 0.3)

        // Phase 4: Sensory parameters
        this.sensoryEnabled = false;  // Enable sensory creature mode
        this.steeringStrength = 0.5;  // How much steering affects flow (0-1)

        // Kernel configuration
        this.kernelType = 'ring';
        this.kernelParams = {
            arms: 3,
            tightness: 1.5,
            points: 5,
            sharpness: 0.5,
            scales: [0.3, 0.6, 0.9],
            weights: [1, 0.5, 0.25],
            angle: 0,
            eccentricity: 0.6,
            bias: 0.3
        };

        this.kernel = null;
        this.colorMap = 'viridis';

        // Phase 4: Environment and creature tracking (initialized externally)
        this.environment = null;
        this.creatureTracker = null;
        this.frameNumber = 0;

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
     * Growth function G(u) - same as standard Lenia
     * In Flow-Lenia, this determines the "affinity" - where mass wants to flow
     * Returns value in [-1, 1]: 1 = high affinity, -1 = low affinity
     */
    growth(u) {
        const d = (u - this.mu) / this.sigma;
        return 2 * Math.exp(-d * d / 2) - 1;
    }

    /**
     * Phase 6: Growth function with local morphology influence
     * Blends global parameters with creature-specific parameters based on local density
     * @param {number} u - Neighborhood potential value
     * @param {number} localMu - Blended mu value for this location
     * @param {number} localSigma - Blended sigma value for this location
     */
    growthWithMorphology(u, localMu, localSigma) {
        const d = (u - localMu) / localSigma;
        return 2 * Math.exp(-d * d / 2) - 1;
    }

    /**
     * Compute neighborhood potential via convolution
     * U = K * A (kernel convolved with activations)
     */
    computePotential() {
        const { size, A, potential, kernel } = this;
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

                        // Toroidal wrapping
                        const gx = (x + kx - kRadius + size) % size;
                        const gy = (y + ky - kRadius + size) % size;

                        sum += A[gy * size + gx] * kernelVal;
                    }
                }

                potential[y * size + x] = sum;
            }
        }
    }

    /**
     * Compute affinity map from potential using growth function
     * Affinity = G(U) - this tells us where mass "wants" to be
     * Phase 6: Now includes morphology influence from creature genomes
     * Phase 7: Also stores directional bias for flow field computation
     */
    computeAffinity() {
        const { size, potential, affinity, A } = this;

        // Phase 6: Check if morphology evolution is active
        const useMorphology = this.sensoryEnabled &&
                              this.creatureTracker &&
                              this.creatureTracker.evolution.enabled &&
                              this.creatureTracker.creatures.length > 0;

        if (!useMorphology) {
            // Standard computation without morphology
            for (let i = 0; i < size * size; i++) {
                affinity[i] = this.growth(potential[i]);
            }
            // Clear morphology influence cache
            this.morphInfluenceCache = null;
            return;
        }

        // Phase 6 & 7: Compute with local morphology influence
        // Build a map of morphology influence at each cell
        const morphInfluence = this.computeMorphologyInfluence();
        // Cache for use in flow field computation (Phase 7)
        this.morphInfluenceCache = morphInfluence;

        for (let i = 0; i < size * size; i++) {
            const influence = morphInfluence[i];

            if (influence.weight > 0.01) {
                // Blend global and local morphology based on influence weight
                // Higher local mass = stronger creature influence
                const blendFactor = Math.min(1, influence.weight * 2);
                const localMu = this.mu * (1 - blendFactor) + influence.mu * blendFactor;
                const localSigma = this.sigma * (1 - blendFactor) + influence.sigma * blendFactor;

                affinity[i] = this.growthWithMorphology(potential[i], localMu, localSigma);
            } else {
                affinity[i] = this.growth(potential[i]);
            }
        }
    }

    /**
     * Phase 6 & 7: Compute local morphology influence from creatures
     * Returns an array where each cell has { mu, sigma, weight, biasX, biasY }
     * Weight indicates how strongly creatures influence that location
     * Phase 7 adds biasX/biasY for directional asymmetry based on creature heading
     */
    computeMorphologyInfluence() {
        const { size, A, creatureTracker } = this;
        const influence = new Array(size * size);

        // Initialize with zeros
        for (let i = 0; i < size * size; i++) {
            influence[i] = { mu: this.mu, sigma: this.sigma, weight: 0, biasX: 0, biasY: 0 };
        }

        if (!creatureTracker) return influence;

        // For each creature, spread its morphology influence
        for (const creature of creatureTracker.creatures) {
            if (!creature.genome) continue;

            const genome = creature.genome;
            const cx = Math.floor(creature.x);
            const cy = Math.floor(creature.y);
            const radius = Math.ceil(genome.kernelRadius * 1.5); // Influence extends beyond kernel

            // Phase 7: Compute effective orientation (heading + genome orientation)
            const effectiveOrientation = creature.heading + genome.kernelOrientation;
            const biasStrength = genome.kernelBias;
            // Direction vector for bias
            const biasDirX = Math.cos(effectiveOrientation) * biasStrength;
            const biasDirY = Math.sin(effectiveOrientation) * biasStrength;

            // Spread influence in a circle around creature center
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > radius) continue;

                    // Toroidal wrapping
                    const x = (cx + dx + size) % size;
                    const y = (cy + dy + size) % size;
                    const idx = y * size + x;

                    // Weight based on distance and local mass
                    const distFactor = 1 - dist / radius;
                    const massFactor = A[idx];
                    const weight = distFactor * distFactor * massFactor;

                    if (weight > influence[idx].weight) {
                        // Strongest creature influence wins (avoids averaging artifacts)
                        influence[idx] = {
                            mu: genome.growthMu,
                            sigma: genome.growthSigma,
                            weight: weight,
                            // Phase 7: Directional bias
                            biasX: biasDirX,
                            biasY: biasDirY
                        };
                    }
                }
            }
        }

        return influence;
    }

    /**
     * Compute flow field using Sobel gradient estimation
     * F = ∇(affinity) - gradient of affinity map
     * Mass flows toward higher affinity (gradient ascent)
     * Phase 7: Adds directional bias from creature genomes
     */
    computeGradient() {
        const { size, affinity, Fx, Fy, flowStrength, A } = this;

        // Sobel kernels for gradient estimation
        // Sobel X: [-1, 0, 1; -2, 0, 2; -1, 0, 1] / 8
        // Sobel Y: [-1, -2, -1; 0, 0, 0; 1, 2, 1] / 8

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Sample 3x3 neighborhood with toroidal wrapping
                const xm = (x - 1 + size) % size;
                const xp = (x + 1) % size;
                const ym = (y - 1 + size) % size;
                const yp = (y + 1) % size;

                // Get affinity values at 8 neighbors + center
                const a_tl = affinity[ym * size + xm];  // top-left
                const a_tc = affinity[ym * size + x];   // top-center
                const a_tr = affinity[ym * size + xp];  // top-right
                const a_ml = affinity[y * size + xm];   // middle-left
                const a_mr = affinity[y * size + xp];   // middle-right
                const a_bl = affinity[yp * size + xm];  // bottom-left
                const a_bc = affinity[yp * size + x];   // bottom-center
                const a_br = affinity[yp * size + xp];  // bottom-right

                // Sobel gradient (note: we want gradient ascent, so positive toward higher values)
                let gx = (-a_tl + a_tr - 2*a_ml + 2*a_mr - a_bl + a_br) / 8;
                let gy = (-a_tl - 2*a_tc - a_tr + a_bl + 2*a_bc + a_br) / 8;

                const idx = y * size + x;

                // Phase 7: Add directional bias from creature morphology
                // Only apply where there's significant mass and morphology influence
                if (this.morphInfluenceCache && A[idx] > 0.1) {
                    const influence = this.morphInfluenceCache[idx];
                    if (influence.weight > 0.01) {
                        // Scale bias by local mass density for natural movement
                        const biasScale = A[idx] * influence.weight;
                        gx += influence.biasX * biasScale;
                        gy += influence.biasY * biasScale;
                    }
                }

                Fx[idx] = gx * flowStrength;
                Fy[idx] = gy * flowStrength;
            }
        }
    }

    /**
     * Apply Laplacian diffusion to spread mass slightly
     * This is mass-conservative: each cell shares a fraction of its mass with neighbors
     * We ensure no cell goes negative by limiting how much mass can leave
     */
    applyDiffusion() {
        const { size, A, newA, diffusion } = this;

        if (diffusion <= 0) return;

        // Copy current state
        for (let i = 0; i < size * size; i++) {
            newA[i] = A[i];
        }

        // Each cell shares a small fraction of its mass with its 4 neighbors
        // This is guaranteed mass-conservative: mass only moves, never created/destroyed
        const shareRate = diffusion * 0.1; // Fraction of mass to share with each neighbor

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = y * size + x;
                const mass = A[idx];

                if (mass < 0.0001) continue;

                // Amount to share with each of 4 neighbors
                const shareAmount = mass * shareRate;
                const totalShared = shareAmount * 4;

                // Get neighbor indices with toroidal wrapping
                const xm = (x - 1 + size) % size;
                const xp = (x + 1) % size;
                const ym = (y - 1 + size) % size;
                const yp = (y + 1) % size;

                // Remove mass from this cell
                newA[idx] -= totalShared;

                // Add mass to neighbors
                newA[y * size + xm] += shareAmount;
                newA[y * size + xp] += shareAmount;
                newA[ym * size + x] += shareAmount;
                newA[yp * size + x] += shareAmount;
            }
        }

        // Copy back - values should never be negative with this approach
        for (let i = 0; i < size * size; i++) {
            A[i] = Math.max(0, newA[i]);
        }
    }

    /**
     * Transport mass using Reintegration Tracking
     * This is the key to mass conservation - instead of adding/subtracting mass,
     * we move existing mass according to the flow field.
     *
     * For each cell:
     * 1. Compute destination = position + flow * dt
     * 2. Distribute mass bilinearly to the 4 neighboring target cells
     * 3. Sum all incoming mass
     */
    transportMass() {
        const { size, A, newA, Fx, Fy, dt } = this;

        newA.fill(0);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = y * size + x;
                const mass = A[idx];

                if (mass < 0.0001) continue; // Skip near-zero cells for efficiency

                // Compute destination position
                const fx = Fx[idx];
                const fy = Fy[idx];

                // Flow destination (where mass wants to go)
                const destX = x + fx * dt;
                const destY = y + fy * dt;

                // Bilinear interpolation coordinates
                const x0 = Math.floor(destX);
                const y0 = Math.floor(destY);
                const fx_frac = destX - x0;
                const fy_frac = destY - y0;

                // Toroidal wrapping for all 4 target cells
                const x0w = ((x0 % size) + size) % size;
                const x1w = ((x0 + 1) % size + size) % size;
                const y0w = ((y0 % size) + size) % size;
                const y1w = ((y0 + 1) % size + size) % size;

                // Distribute mass bilinearly (exactly conserves total mass)
                const w00 = (1 - fx_frac) * (1 - fy_frac);
                const w10 = fx_frac * (1 - fy_frac);
                const w01 = (1 - fx_frac) * fy_frac;
                const w11 = fx_frac * fy_frac;

                newA[y0w * size + x0w] += mass * w00;
                newA[y0w * size + x1w] += mass * w10;
                newA[y1w * size + x0w] += mass * w01;
                newA[y1w * size + x1w] += mass * w11;
            }
        }

        // Copy result back to main grid
        // Only clamp negative values (shouldn't happen, but prevents numerical issues)
        // Do NOT clamp upper bound - mass can concentrate above 1.0 and that's fine
        // The rendering will handle values > 1 by clamping only for display
        for (let i = 0; i < size * size; i++) {
            A[i] = Math.max(0, newA[i]);
        }
    }

    /**
     * Main simulation step
     */
    step() {
        this.frameNumber++;

        // Phase 4: Update environment if enabled
        if (this.sensoryEnabled && this.environment) {
            this.environment.update(this.A);
        }

        // Phase 4: Detect and track creatures if enabled
        if (this.sensoryEnabled && this.creatureTracker) {
            this.creatureTracker.update(this.A, this.frameNumber);

            // Phase 5: Match pending offspring with newly detected creatures
            if (this.pendingOffspring && this.pendingOffspring.length > 0) {
                this.matchPendingOffspring();
            }

            // Phase 5: Evolution - update energy and check for events
            if (this.creatureTracker.evolution.enabled) {
                // Assign genomes to any creatures that don't have one
                // Phase 10: In ecosystem mode, use ecosystem genome assignment instead
                if (this.creatureTracker.ecosystemMode) {
                    this.creatureTracker.assignEcosystemGenomes();
                } else {
                    for (const creature of this.creatureTracker.creatures) {
                        if (!creature.genome) {
                            this.creatureTracker.assignDefaultGenome(creature);
                        }
                    }
                }

                // Update energy (metabolism + food consumption)
                this.creatureTracker.updateEnergy(this.environment);

                // Phase 10: Process predation (hunters eat prey)
                this.creatureTracker.processPredation(this.A, this.size);

                // Check for reproduction and death
                const events = this.creatureTracker.checkEvolutionEvents();

                // Process deaths
                for (const creature of events.die) {
                    this.creatureTracker.processDeath(creature, this.environment);
                }

                // Remove dead creatures
                this.creatureTracker.creatures = this.creatureTracker.creatures.filter(
                    c => c.energy > 0
                );

                // Process reproductions
                for (const parent of events.reproduce) {
                    this.processReproduction(parent);
                }

                // Phase 10: Balance population in ecosystem mode
                this.creatureTracker.balancePopulation(this);

                // Update statistics
                this.creatureTracker.updateStats();
            }

            this.creatureTracker.updateCreatureHeadings(this.environment);
        }

        this.computePotential();   // U = K * A
        this.computeAffinity();    // affinity = G(U)
        this.computeGradient();    // F = ∇(affinity)

        // Phase 4: Add steering forces from creatures
        if (this.sensoryEnabled && this.creatureTracker) {
            this.applySteeringForces();
            // Phase 15: Apply pursuit boost for hunters (based on CA predator-prey research)
            this.applyPursuitBoost();
        }

        this.transportMass();      // Mass-conservative transport
        this.applyDiffusion();     // Laplacian diffusion to prevent collapse
    }

    /**
     * Phase 4: Apply steering forces from creature headings to flow field
     */
    applySteeringForces() {
        if (!this.creatureTracker || this.steeringStrength === 0) return;

        const { size, Fx, Fy, steeringStrength } = this;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const idx = y * size + x;

                // Only apply steering where there's mass
                if (this.A[idx] < 0.1) continue;

                const steering = this.creatureTracker.getSteeringForce(x, y);
                Fx[idx] += steering.x * steeringStrength;
                Fy[idx] += steering.y * steeringStrength;
            }
        }
    }

    /**
     * Phase 15: Apply pursuit boost for hunters
     * Based on CA predator-prey research - hunters get extra flow velocity toward prey
     * This is similar to the "pursuit subrule" in Boccara et al. (1994)
     */
    applyPursuitBoost() {
        if (!this.creatureTracker || !this.creatureTracker.ecosystemMode) return;

        const { size, Fx, Fy, A } = this;
        const tracker = this.creatureTracker;
        const pursuitStrength = 5.0;  // Phase 15: Significantly increased for effective hunting

        // Get all hunters and prey
        const hunters = tracker.creatures.filter(c => c.genome?.isPredator);
        const prey = tracker.creatures.filter(c => c.genome && !c.genome.isPredator);

        if (hunters.length === 0 || prey.length === 0) return;

        // For each hunter, add extra flow toward nearest prey
        for (const hunter of hunters) {
            // Find nearest prey using predictive position
            let nearestPrey = null;
            let nearestDist = Infinity;

            for (const p of prey) {
                const dist = tracker.toroidalDistance(hunter.x, hunter.y, p.x, p.y);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestPrey = p;
                }
            }

            if (!nearestPrey || nearestDist > 150) continue;  // Phase 15: Extended range for active hunting

            // Calculate pursuit vector (using predictive position from smoothed velocity)
            const smoothedVel = nearestPrey.getSmoothedVelocity ?
                nearestPrey.getSmoothedVelocity(size) : { vx: nearestPrey.vx || 0, vy: nearestPrey.vy || 0 };

            // Predict where prey will be (shorter lookahead for direct pursuit boost)
            const lookAhead = Math.min(15, nearestDist / 2);
            let targetX = nearestPrey.x + smoothedVel.vx * lookAhead;
            let targetY = nearestPrey.y + smoothedVel.vy * lookAhead;
            targetX = ((targetX % size) + size) % size;
            targetY = ((targetY % size) + size) % size;

            // Direction from hunter to predicted prey position
            const dx = tracker.toroidalDelta(targetX, hunter.x, size);
            const dy = tracker.toroidalDelta(targetY, hunter.y, size);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 0.1) continue;

            const dirX = dx / dist;
            const dirY = dy / dist;

            // Apply extra flow boost to all cells belonging to this hunter
            // Boost is stronger when closer to prey (more urgent pursuit)
            // Phase 15: Quadratic proximity boost for aggressive closing
            const proximityBoost = 1 + Math.pow(1 - nearestDist / 150, 2) * 3;

            for (const cell of hunter.cells) {
                const idx = Math.floor(cell.y) * size + Math.floor(cell.x);
                if (idx >= 0 && idx < size * size && A[idx] > 0.1) {
                    // Add pursuit velocity to flow field at this cell
                    Fx[idx] += dirX * pursuitStrength * proximityBoost * cell.value;
                    Fy[idx] += dirY * pursuitStrength * proximityBoost * cell.value;
                }
            }
        }
    }

    /**
     * Phase 5: Process reproduction - split a creature's mass into two offspring
     * @param {Creature} parent - Parent creature to reproduce
     */
    processReproduction(parent) {
        if (!this.creatureTracker) return;

        // Get offspring data from creature tracker
        const offspringData = this.creatureTracker.processReproduction(
            parent, this.frameNumber
        );
        if (!offspringData) return;

        const { size, A } = this;

        // Calculate split direction (perpendicular to heading)
        const splitAngle = parent.heading + Math.PI / 2;
        const splitDist = parent.radius * 0.7;

        // Offspring positions
        const pos1 = {
            x: (parent.x + Math.cos(splitAngle) * splitDist + size) % size,
            y: (parent.y + Math.sin(splitAngle) * splitDist + size) % size
        };
        const pos2 = {
            x: (parent.x - Math.cos(splitAngle) * splitDist + size) % size,
            y: (parent.y - Math.sin(splitAngle) * splitDist + size) % size
        };

        // Redistribute parent's mass to two locations
        // First, collect all mass from parent's cells
        let totalMass = 0;
        const parentCells = [];

        for (const cell of parent.cells) {
            const idx = Math.floor(cell.y) * size + Math.floor(cell.x);
            if (idx >= 0 && idx < A.length) {
                totalMass += A[idx];
                parentCells.push({ x: cell.x, y: cell.y, idx });
            }
        }

        // Split mass ratio (roughly 50/50 with some variation)
        const ratio1 = 0.45 + Math.random() * 0.1;
        const mass1 = totalMass * ratio1;
        const mass2 = totalMass * (1 - ratio1);

        // Mass-conserving reproduction: redistribute parent mass to two offspring
        // First, remove all parent mass
        for (const cell of parentCells) {
            A[cell.idx] = 0;
        }

        // Create blob patterns for offspring and calculate normalization
        const offspringRadius = Math.max(parent.radius * 0.75, 6);

        // Generate blob patterns centered at each offspring position
        const blob1Cells = [];
        const blob2Cells = [];
        let blob1Total = 0;
        let blob2Total = 0;

        for (let dy = -offspringRadius; dy <= offspringRadius; dy++) {
            for (let dx = -offspringRadius; dx <= offspringRadius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy) / offspringRadius;
                if (dist <= 1) {
                    const weight = (1 - dist * dist); // Smooth falloff

                    // Blob 1
                    const gx1 = (Math.floor(pos1.x) + dx + size) % size;
                    const gy1 = (Math.floor(pos1.y) + dy + size) % size;
                    const idx1 = gy1 * size + gx1;
                    blob1Cells.push({ idx: idx1, weight });
                    blob1Total += weight;

                    // Blob 2
                    const gx2 = (Math.floor(pos2.x) + dx + size) % size;
                    const gy2 = (Math.floor(pos2.y) + dy + size) % size;
                    const idx2 = gy2 * size + gx2;
                    blob2Cells.push({ idx: idx2, weight });
                    blob2Total += weight;
                }
            }
        }

        // Distribute mass proportionally to each offspring
        // Normalize so total distributed = totalMass (mass conservation)
        const scale1 = mass1 / blob1Total;
        const scale2 = mass2 / blob2Total;

        // CRITICAL: Clear offspring regions first to prevent mass duplication
        // when offspring overlap with existing creatures
        for (const cell of blob1Cells) {
            A[cell.idx] = 0;
        }
        for (const cell of blob2Cells) {
            A[cell.idx] = 0;
        }

        // Now set (not add) the offspring mass
        for (const cell of blob1Cells) {
            A[cell.idx] = Math.min(1, cell.weight * scale1);
        }
        for (const cell of blob2Cells) {
            A[cell.idx] = Math.min(1, cell.weight * scale2);
        }

        // Note: The actual offspring creatures will be detected and registered
        // by the creature tracker in the next frame when it scans for connected
        // components. The offspring data is stored so we can assign genomes
        // when those creatures are detected.

        // Store pending offspring data for matching
        if (!this.pendingOffspring) {
            this.pendingOffspring = [];
        }
        this.pendingOffspring.push({
            data: offspringData,
            positions: [pos1, pos2],
            frame: this.frameNumber,
            assigned: [false, false]
        });

        // Clean up old pending offspring (more than 5 frames old)
        this.pendingOffspring = this.pendingOffspring.filter(
            o => this.frameNumber - o.frame < 5
        );
    }

    /**
     * Helper: compute toroidal delta (shortest path direction)
     */
    toroidalDelta(to, from, size) {
        let delta = to - from;
        if (delta > size / 2) delta -= size;
        if (delta < -size / 2) delta += size;
        return delta;
    }

    /**
     * Phase 5: Match newly detected creatures with pending offspring
     * Called after creature detection to assign genomes to offspring
     */
    matchPendingOffspring() {
        if (!this.pendingOffspring || !this.creatureTracker) return;

        const tracker = this.creatureTracker;

        for (const pending of this.pendingOffspring) {
            for (let i = 0; i < 2; i++) {
                if (pending.assigned[i]) continue;

                const pos = pending.positions[i];

                // Find closest unassigned creature near this position
                let bestCreature = null;
                let bestDist = 20; // Max match distance

                for (const creature of tracker.creatures) {
                    // Skip creatures that already have genomes from a parent
                    if (creature.genome && creature.parentId !== null) continue;
                    // Skip creatures that were around before this reproduction
                    if (creature.birthFrame < pending.frame) continue;

                    const dx = this.toroidalDelta(creature.x, pos.x, this.size);
                    const dy = this.toroidalDelta(creature.y, pos.y, this.size);
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < bestDist) {
                        bestDist = dist;
                        bestCreature = creature;
                    }
                }

                if (bestCreature) {
                    // Assign genome and metadata from offspring data
                    const offspringInfo = pending.data.offspring[i];
                    bestCreature.genome = offspringInfo.genome;
                    bestCreature.energy = offspringInfo.energy;
                    bestCreature.generation = offspringInfo.generation;
                    bestCreature.parentId = pending.data.parentId;
                    bestCreature.birthFrame = pending.frame;

                    pending.assigned[i] = true;
                }
            }
        }

        // Remove fully assigned pending offspring
        this.pendingOffspring = this.pendingOffspring.filter(
            o => !o.assigned[0] || !o.assigned[1]
        );
    }

    /**
     * Set environment reference
     */
    setEnvironment(environment) {
        this.environment = environment;
    }

    /**
     * Set creature tracker reference
     */
    setCreatureTracker(tracker) {
        this.creatureTracker = tracker;
    }

    /**
     * Enable/disable sensory mode
     */
    setSensoryMode(enabled) {
        this.sensoryEnabled = enabled;
    }

    /**
     * Calculate total mass (should remain constant!)
     */
    totalMass() {
        let sum = 0;
        for (let i = 0; i < this.A.length; i++) {
            sum += this.A[i];
        }
        return sum;
    }

    /**
     * Clear the grid
     */
    clear() {
        this.A.fill(0);
        this.frameNumber = 0;

        // Reset environment and creature tracker
        if (this.environment) {
            this.environment.reset();
        }
        if (this.creatureTracker) {
            this.creatureTracker.clear();
        }
    }

    /**
     * Fill with random clumps (similar to standard Lenia)
     */
    randomize(density = 0.3, clumpiness = 0.5) {
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
                        this.A[idx] = Math.min(1, this.A[idx] + value * clumpiness);
                    }
                }
            }
        }

        // Add some noise
        for (let i = 0; i < this.A.length; i++) {
            this.A[i] = Math.min(1, this.A[i] + Math.random() * 0.1);
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
                        this.A[idx] = Math.min(1, this.A[idx] + brushVal * 0.3);
                    } else {
                        this.A[idx] = Math.max(0, this.A[idx] + brushVal * 0.3);
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
        this.peaks = species.params.peaks || 1;
        this.mu = species.params.mu;
        this.sigma = species.params.sigma;
        this.dt = species.params.dt;

        // Flow-specific params
        if (species.params.flowStrength !== undefined) {
            this.flowStrength = species.params.flowStrength;
        }
        if (species.params.diffusion !== undefined) {
            this.diffusion = species.params.diffusion;
        }

        // Kernel type
        if (species.params.kernelType) {
            this.kernelType = species.params.kernelType;
        } else {
            this.kernelType = 'ring';
        }

        // Kernel-specific params
        if (species.params.kernelParams) {
            Object.assign(this.kernelParams, species.params.kernelParams);
        }

        this.updateKernel();

        // Place pattern at center
        if (species.pattern) {
            this.clear();
            this.placePattern(
                species.pattern,
                Math.floor(this.size / 2),
                Math.floor(this.size / 2)
            );
        }
    }

    /**
     * Place a pattern onto the grid
     */
    placePattern(pattern, centerX, centerY) {
        if (!pattern) return;

        const patternH = pattern.length;
        const patternW = pattern[0].length;
        const startX = Math.floor(centerX - patternW / 2);
        const startY = Math.floor(centerY - patternH / 2);

        for (let py = 0; py < patternH; py++) {
            for (let px = 0; px < patternW; px++) {
                const gx = (startX + px + this.size) % this.size;
                const gy = (startY + py + this.size) % this.size;
                this.A[gy * this.size + gx] = pattern[py][px];
            }
        }
    }

    /**
     * Resize the simulation grid
     */
    resize(newSize) {
        if (newSize === this.size) return;

        const oldA = this.A;
        const oldSize = this.size;

        this.size = newSize;
        this.A = new Float32Array(newSize * newSize);
        this.potential = new Float32Array(newSize * newSize);
        this.affinity = new Float32Array(newSize * newSize);
        this.Fx = new Float32Array(newSize * newSize);
        this.Fy = new Float32Array(newSize * newSize);
        this.newA = new Float32Array(newSize * newSize);

        // Simple nearest-neighbor scaling
        const scale = oldSize / newSize;
        for (let y = 0; y < newSize; y++) {
            for (let x = 0; x < newSize; x++) {
                const ox = Math.min(Math.floor(x * scale), oldSize - 1);
                const oy = Math.min(Math.floor(y * scale), oldSize - 1);
                this.A[y * newSize + x] = oldA[oy * oldSize + ox];
            }
        }

        // Resize environment and creature tracker if present
        if (this.environment) {
            this.environment.resize(newSize);
        }
        if (this.creatureTracker) {
            this.creatureTracker.resize(newSize);
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

    /**
     * Get the grid (for compatibility with rendering code)
     */
    get grid() {
        return this.A;
    }

    set grid(value) {
        this.A = value;
    }
}
