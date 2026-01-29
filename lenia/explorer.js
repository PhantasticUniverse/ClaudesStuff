/**
 * Parameter Space Explorer for Lenia
 *
 * Tools for discovering new stable creatures through:
 * 1. Grid search over parameter space
 * 2. Stability evaluation
 * 3. Heatmap visualization
 */

class ParameterExplorer {
    constructor() {
        this.results = [];
        this.isRunning = false;
        this.currentSearch = null;
        this.onProgress = null;
        this.onComplete = null;
    }

    /**
     * Evaluate stability of a parameter set
     * Returns a score: higher = more stable and interesting
     *
     * @param {Object} params - {R, mu, sigma, dt, kernelType}
     * @param {number} steps - Number of simulation steps
     * @returns {Object} - {stability, complexity, score, finalMass}
     */
    evaluateParams(params, steps = 200) {
        // Create a small test simulation
        const size = 64;
        const lenia = new Lenia(size);

        lenia.R = params.R;
        lenia.mu = params.mu;
        lenia.sigma = params.sigma;
        lenia.dt = params.dt || 0.1;
        lenia.peaks = params.peaks || 1;
        lenia.kernelType = params.kernelType || 'ring';
        lenia.updateKernel();

        // Initialize with a standard blob
        const cx = size / 2;
        const cy = size / 2;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - cx;
                const dy = y - cy;
                const dist = Math.sqrt(dx * dx + dy * dy) / 12;
                if (dist < 1) {
                    lenia.grid[y * size + x] = 1 - dist * dist;
                }
            }
        }

        // Track mass over time
        const masses = [];
        for (let i = 0; i < steps; i++) {
            lenia.step();
            if (i > steps * 0.5) { // Only measure second half
                masses.push(lenia.totalMass());
            }
        }

        // Calculate metrics
        const avgMass = masses.reduce((a, b) => a + b, 0) / masses.length;

        // Stability: inverse of mass variance
        let variance = 0;
        for (const m of masses) {
            variance += (m - avgMass) * (m - avgMass);
        }
        variance /= masses.length;
        const stability = 1 / (1 + variance);

        // Check if creature survived
        const survived = avgMass > 10;

        // Complexity: entropy of final grid
        let complexity = 0;
        const bins = new Float32Array(10);
        for (let i = 0; i < lenia.grid.length; i++) {
            const bin = Math.min(9, Math.floor(lenia.grid[i] * 10));
            bins[bin]++;
        }
        for (let i = 0; i < 10; i++) {
            const p = bins[i] / lenia.grid.length;
            if (p > 0) {
                complexity -= p * Math.log2(p);
            }
        }

        // Combined score
        const score = survived ? stability * complexity * (avgMass / 100) : 0;

        return {
            stability,
            complexity,
            score,
            finalMass: avgMass,
            survived,
            params: { ...params }
        };
    }

    /**
     * Grid search over mu and sigma with fixed other params
     *
     * @param {Object} baseParams - Fixed parameters
     * @param {Object} ranges - {mu: [min, max], sigma: [min, max]}
     * @param {number} resolution - Grid resolution (e.g., 10 = 10x10 grid)
     */
    async gridSearch(baseParams, ranges, resolution = 10) {
        this.isRunning = true;
        this.results = [];

        const muMin = ranges.mu[0];
        const muMax = ranges.mu[1];
        const sigmaMin = ranges.sigma[0];
        const sigmaMax = ranges.sigma[1];

        const totalTests = resolution * resolution;
        let completed = 0;

        for (let i = 0; i < resolution && this.isRunning; i++) {
            for (let j = 0; j < resolution && this.isRunning; j++) {
                const mu = muMin + (muMax - muMin) * i / (resolution - 1);
                const sigma = sigmaMin + (sigmaMax - sigmaMin) * j / (resolution - 1);

                const params = {
                    ...baseParams,
                    mu,
                    sigma
                };

                const result = this.evaluateParams(params);
                result.gridX = i;
                result.gridY = j;
                this.results.push(result);

                completed++;
                if (this.onProgress) {
                    this.onProgress(completed / totalTests, result);
                }

                // Yield to UI
                await new Promise(r => setTimeout(r, 0));
            }
        }

        this.isRunning = false;
        if (this.onComplete) {
            this.onComplete(this.results);
        }

        return this.results;
    }

    /**
     * Stop the current search
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * Get the best results sorted by score
     */
    getBestResults(n = 10) {
        return [...this.results]
            .sort((a, b) => b.score - a.score)
            .slice(0, n);
    }

    /**
     * Generate a heatmap canvas from results
     */
    generateHeatmap(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (this.results.length === 0) {
            ctx.fillStyle = '#1a1a24';
            ctx.fillRect(0, 0, width, height);
            return canvas;
        }

        // Find grid dimensions and max score
        let maxGridX = 0, maxGridY = 0, maxScore = 0;
        for (const r of this.results) {
            maxGridX = Math.max(maxGridX, r.gridX);
            maxGridY = Math.max(maxGridY, r.gridY);
            maxScore = Math.max(maxScore, r.score);
        }

        const cellW = width / (maxGridX + 1);
        const cellH = height / (maxGridY + 1);

        // Draw cells
        for (const r of this.results) {
            const x = r.gridX * cellW;
            const y = (maxGridY - r.gridY) * cellH; // Flip Y

            // Color based on score (viridis-like)
            const t = maxScore > 0 ? r.score / maxScore : 0;
            const color = this.getHeatmapColor(t);
            ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            ctx.fillRect(x, y, cellW + 1, cellH + 1);
        }

        return canvas;
    }

    /**
     * Get heatmap color for value 0-1
     */
    getHeatmapColor(t) {
        // Viridis-inspired colormap
        const colors = [
            [68, 1, 84],
            [59, 82, 139],
            [33, 145, 140],
            [94, 201, 98],
            [253, 231, 37]
        ];

        const idx = t * (colors.length - 1);
        const i = Math.floor(idx);
        const f = idx - i;

        if (i >= colors.length - 1) return colors[colors.length - 1];

        return [
            Math.round(colors[i][0] + (colors[i + 1][0] - colors[i][0]) * f),
            Math.round(colors[i][1] + (colors[i + 1][1] - colors[i][1]) * f),
            Math.round(colors[i][2] + (colors[i + 1][2] - colors[i][2]) * f)
        ];
    }
}

/**
 * Evolutionary search for novel creatures
 */
class EvolutionarySearch {
    constructor() {
        this.population = [];
        this.populationSize = 20;
        this.generation = 0;
        this.isRunning = false;
        this.bestEver = null;
        this.history = [];

        this.onGeneration = null;
        this.onNewBest = null;

        // Parameter bounds
        this.bounds = {
            R: [5, 25],
            mu: [0.1, 0.4],
            sigma: [0.01, 0.08],
            peaks: [1, 3],
            dt: [0.05, 0.2]
        };
    }

    /**
     * Create a random genome
     */
    randomGenome() {
        return {
            R: this.randInRange(this.bounds.R),
            mu: this.randInRange(this.bounds.mu),
            sigma: this.randInRange(this.bounds.sigma),
            peaks: Math.floor(this.randInRange(this.bounds.peaks)),
            dt: this.randInRange(this.bounds.dt),
            kernelType: 'ring'
        };
    }

    randInRange([min, max]) {
        return min + Math.random() * (max - min);
    }

    /**
     * Mutate a genome
     */
    mutate(genome, rate = 0.3) {
        const mutated = { ...genome };

        if (Math.random() < rate) {
            mutated.R = Math.max(this.bounds.R[0],
                Math.min(this.bounds.R[1],
                    mutated.R + (Math.random() - 0.5) * 6));
        }
        if (Math.random() < rate) {
            mutated.mu = Math.max(this.bounds.mu[0],
                Math.min(this.bounds.mu[1],
                    mutated.mu + (Math.random() - 0.5) * 0.1));
        }
        if (Math.random() < rate) {
            mutated.sigma = Math.max(this.bounds.sigma[0],
                Math.min(this.bounds.sigma[1],
                    mutated.sigma + (Math.random() - 0.5) * 0.02));
        }
        if (Math.random() < rate * 0.5) {
            mutated.peaks = Math.max(this.bounds.peaks[0],
                Math.min(this.bounds.peaks[1],
                    mutated.peaks + Math.round(Math.random() * 2 - 1)));
        }

        return mutated;
    }

    /**
     * Crossover two genomes
     */
    crossover(a, b) {
        return {
            R: Math.random() < 0.5 ? a.R : b.R,
            mu: Math.random() < 0.5 ? a.mu : b.mu,
            sigma: Math.random() < 0.5 ? a.sigma : b.sigma,
            peaks: Math.random() < 0.5 ? a.peaks : b.peaks,
            dt: Math.random() < 0.5 ? a.dt : b.dt,
            kernelType: 'ring'
        };
    }

    /**
     * Initialize population
     */
    initialize() {
        this.population = [];
        this.generation = 0;
        this.history = [];

        const explorer = new ParameterExplorer();

        for (let i = 0; i < this.populationSize; i++) {
            const genome = this.randomGenome();
            const evaluation = explorer.evaluateParams(genome);
            this.population.push({
                genome,
                fitness: evaluation.score,
                evaluation
            });
        }

        this.population.sort((a, b) => b.fitness - a.fitness);
        this.bestEver = this.population[0];
    }

    /**
     * Run one generation
     */
    async runGeneration() {
        const explorer = new ParameterExplorer();

        // Selection: keep top 50%
        const survivors = this.population.slice(0, Math.floor(this.populationSize / 2));

        // Create offspring through crossover and mutation
        const offspring = [];
        while (offspring.length < this.populationSize - survivors.length) {
            const parent1 = survivors[Math.floor(Math.random() * survivors.length)];
            const parent2 = survivors[Math.floor(Math.random() * survivors.length)];

            let childGenome = this.crossover(parent1.genome, parent2.genome);
            childGenome = this.mutate(childGenome);

            const evaluation = explorer.evaluateParams(childGenome);
            offspring.push({
                genome: childGenome,
                fitness: evaluation.score,
                evaluation
            });

            // Yield to UI
            await new Promise(r => setTimeout(r, 0));
        }

        // New population
        this.population = [...survivors, ...offspring];
        this.population.sort((a, b) => b.fitness - a.fitness);

        // Track best
        if (this.population[0].fitness > this.bestEver.fitness) {
            this.bestEver = this.population[0];
            if (this.onNewBest) {
                this.onNewBest(this.bestEver);
            }
        }

        this.generation++;
        this.history.push({
            generation: this.generation,
            bestFitness: this.population[0].fitness,
            avgFitness: this.population.reduce((s, p) => s + p.fitness, 0) / this.population.length
        });

        if (this.onGeneration) {
            this.onGeneration(this.generation, this.population);
        }
    }

    /**
     * Run evolution for N generations
     */
    async run(generations) {
        this.isRunning = true;
        this.initialize();

        for (let g = 0; g < generations && this.isRunning; g++) {
            await this.runGeneration();
        }

        this.isRunning = false;
        return this.bestEver;
    }

    /**
     * Stop evolution
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * Get top N individuals
     */
    getTopN(n = 5) {
        return this.population.slice(0, n);
    }
}

/**
 * Discovery gallery for saving interesting creatures
 */
class CreatureGallery {
    constructor() {
        this.discoveries = [];
        this.storageKey = 'lenia-discoveries';
        this.load();
    }

    /**
     * Add a discovery
     */
    add(name, params, thumbnail = null) {
        const discovery = {
            id: Date.now(),
            name,
            params: { ...params },
            thumbnail,
            timestamp: new Date().toISOString()
        };
        this.discoveries.push(discovery);
        this.save();
        return discovery;
    }

    /**
     * Remove a discovery
     */
    remove(id) {
        this.discoveries = this.discoveries.filter(d => d.id !== id);
        this.save();
    }

    /**
     * Save to localStorage
     */
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.discoveries));
        } catch (e) {
            console.warn('Failed to save discoveries:', e);
        }
    }

    /**
     * Load from localStorage
     */
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                this.discoveries = JSON.parse(data);
            }
        } catch (e) {
            console.warn('Failed to load discoveries:', e);
        }
    }

    /**
     * Export all discoveries as JSON
     */
    export() {
        const blob = new Blob([JSON.stringify(this.discoveries, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lenia-gallery-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Import discoveries from JSON
     */
    import(json) {
        try {
            const data = JSON.parse(json);
            if (Array.isArray(data)) {
                this.discoveries = [...this.discoveries, ...data];
                this.save();
                return true;
            }
        } catch (e) {
            console.warn('Failed to import discoveries:', e);
        }
        return false;
    }
}

// Global instances
let parameterExplorer = null;
let evolutionarySearch = null;
let creatureGallery = null;

function initExplorer() {
    parameterExplorer = new ParameterExplorer();
    evolutionarySearch = new EvolutionarySearch();
    creatureGallery = new CreatureGallery();
}
