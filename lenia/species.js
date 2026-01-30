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
            mu: 0.15,   // Official Chakazul Orbium parameters
            sigma: 0.017, // Tight sigma for stable soliton
            dt: 0.1,
            kernelType: 'bump4'  // Use official Lenia kernel
        },
        // Orbium bicaudatus pattern - from official Lenia repository
        // This asymmetric ring pattern with a tail creates a stable traveling wave
        pattern: [
            [0,0,0,0,0,0,0.1,0.14,0.1,0,0,0.03,0.03,0,0,0.3,0,0,0,0],
            [0,0,0,0,0,0.08,0.24,0.3,0.3,0.18,0.14,0.15,0.16,0.15,0.09,0.2,0,0,0,0],
            [0,0,0,0,0,0.15,0.34,0.44,0.46,0.38,0.18,0.14,0.11,0.13,0.19,0.18,0.45,0,0,0],
            [0,0,0,0,0.06,0.13,0.39,0.5,0.5,0.37,0.06,0,0,0,0.02,0.16,0.68,0,0,0],
            [0,0,0,0.11,0.17,0.17,0.33,0.4,0.38,0.28,0.14,0,0,0,0,0,0.18,0.42,0,0],
            [0,0,0.09,0.18,0.13,0.06,0.08,0.26,0.32,0.32,0.27,0,0,0,0,0,0,0.82,0,0],
            [0.27,0,0.16,0.12,0,0,0,0.25,0.38,0.44,0.45,0.34,0,0,0,0,0,0.22,0.17,0],
            [0,0.07,0.2,0.02,0,0,0,0.31,0.48,0.57,0.6,0.57,0,0,0,0,0,0,0.49,0],
            [0,0.59,0.19,0,0,0,0,0.2,0.57,0.69,0.76,0.76,0.49,0,0,0,0,0,0.36,0],
            [0,0.58,0.19,0,0,0,0,0,0.67,0.83,0.9,0.92,0.87,0.12,0,0,0,0,0.22,0.07],
            [0,0,0.46,0,0,0,0,0,0.7,0.93,1,1,1,0.61,0,0,0,0,0.18,0.11],
            [0,0,0.82,0,0,0,0,0,0.47,1,1,0.98,1,0.96,0.27,0,0,0,0.19,0.1],
            [0,0,0.46,0,0,0,0,0,0.25,1,1,0.84,0.92,0.97,0.54,0.14,0.04,0.1,0.21,0.05],
            [0,0,0,0.4,0,0,0,0,0.09,0.8,1,0.82,0.8,0.85,0.63,0.31,0.18,0.19,0.2,0.01],
            [0,0,0,0.36,0.1,0,0,0,0.05,0.54,0.86,0.79,0.74,0.72,0.6,0.39,0.28,0.24,0.13,0],
            [0,0,0,0.01,0.3,0.07,0,0,0.08,0.36,0.64,0.7,0.64,0.6,0.51,0.39,0.29,0.19,0.04,0],
            [0,0,0,0,0.1,0.24,0.14,0.1,0.15,0.29,0.45,0.53,0.52,0.46,0.4,0.31,0.21,0.08,0,0],
            [0,0,0,0,0,0.08,0.21,0.21,0.22,0.29,0.36,0.39,0.37,0.33,0.26,0.18,0.09,0,0,0],
            [0,0,0,0,0,0,0.03,0.13,0.19,0.22,0.24,0.24,0.23,0.18,0.13,0.05,0,0,0,0],
            [0,0,0,0,0,0,0,0,0.02,0.06,0.08,0.09,0.07,0.05,0.01,0,0,0,0,0]
        ]
    },

    /**
     * Geminium - A self-replicating creature (Aerogeminium volitans)
     * From official Lenia: R=18, quad4 bimodal kernel b=[1, 11/12], μ=0.32, σ=0.051
     * Periodically splits into two copies of itself
     *
     * CRITICAL: Geminidae family requires quad4 kernel (multi-peak), NOT bump4!
     * The betas parameter [1, 0.917] creates a bimodal kernel with two concentric peaks.
     */
    geminium: {
        name: "Geminium",
        description: "A self-replicating creature that periodically divides.",
        params: {
            R: 18,
            mu: 0.32,           // Official Aerogeminium volitans parameters
            sigma: 0.051,
            dt: 0.1,
            kernelType: 'quad4', // Multi-peak kernel for Geminidae family
            betas: [1, 11/12]    // Bimodal: b="1,11/12" from official Lenia
        },
        // Official Aerogeminium volitans pattern extracted from Chakazul's implementation
        // 32x49 matrix - the specific shape is critical for self-replication
        pattern: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0.13,0.24,0.31,0.33,0.31,0.25,0.17,0.08,0.01,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0.38,0.73,1,1,1,1,1,1,1,1,0.99,0.77,0.5,0.21,0.02,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0.11,0.83,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0.77,0.38,0.09,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0.72,0.94,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0.85,0.47,0.19,0.03,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0.17,0.59,0.86,0.99,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0.68,0.4,0.19,0.08,0.03,0.01,0.01,0.01,0.01,0.01,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0.08,0.4,0.72,0.95,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0.9,0.62,0.45,0.36,0.34,0.36,0.43,0.48,0.45,0.31,0.12,0.01,0,0,0,0,0,0,0,0,0,0,0],
            [0,0.15,0.51,0.84,0.99,1,1,1,1,1,1,1,1,0.67,0.39,0.38,0.63,0.98,1,1,1,1,1,1,1,1,1,1,1,1,0.97,0.96,1,1,1,1,0.85,0.51,0.15,0,0,0,0,0,0,0,0,0,0],
            [0,0.26,0.65,0.94,1,1,1,1,1,1,1,0.39,0,0,0,0,0,0,0.64,0.95,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0.98,0.45,0.02,0,0,0,0,0,0,0,0],
            [0,0.4,0.8,0.99,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0.16,0.65,0.91,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0.78,0.13,0,0,0,0,0,0,0],
            [0.09,0.57,0.92,1,1,1,1,1,1,0.24,0,0,0,0,0,0,0,0,0,0,0,0.27,0.71,0.96,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0.28,0,0,0,0,0,0],
            [0.24,0.71,0.98,1,1,1,1,1,1,0.33,0.01,0,0,0,0,0,0,0,0,0,0,0,0.09,0.6,0.93,0.99,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0.39,0,0,0,0,0],
            [0.37,0.82,1,1,1,1,1,1,1,0.56,0.15,0.04,0.04,0.06,0.05,0.01,0,0,0,0,0,0,0,0.22,0.66,0.86,0.84,0.72,0.62,0.59,0.64,0.73,0.82,0.89,0.96,1,1,1,1,1,1,1,1,1,0.42,0,0,0,0],
            [0.46,0.88,1,1,1,1,1,1,1,0.86,0.35,0.24,0.29,0.35,0.35,0.26,0.07,0,0,0,0,0,0,0.23,0.63,0.66,0.4,0.08,0,0,0,0,0,0,0,0,0.44,1,1,1,1,1,1,1,1,0.32,0,0,0],
            [0.51,0.9,1,1,1,1,1,1,1,0.88,0.31,0.25,0.35,0.45,0.49,0.44,0.19,0,0,0,0,0,0,0.74,0.98,0.83,0.21,0,0,0,0,0,0,0,0,0,0,0.1,1,1,1,1,1,1,1,1,0.01,0,0],
            [0.52,0.9,1,1,1,1,1,1,1,0.28,0,0.02,0.11,0.22,0.28,0.24,0.04,0,0,0,0,0,0.26,1,1,0.99,0.26,0,0,0,0,0,0,0,0,0,0,0,0.18,1,1,1,1,1,1,1,0.9,0,0],
            [0.47,0.85,0.99,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0.5,1,1,1,0.01,0,0,0,0,0,0,0,0,0,0,0,0,0.7,1,1,1,1,1,1,0.93,0.24,0],
            [0.37,0.75,0.95,1,1,1,1,1,0.39,0,0,0,0,0,0,0,0,0,0,0,0,0,0.96,1,1,0.89,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0.92,0.67,0],
            [0.2,0.58,0.83,0.95,0.99,1,1,1,0.19,0,0,0,0,0,0,0,0,0,0,0,0,0,0.95,1,1,0.58,0,0,0,0,0,0.03,0.21,0.24,0.14,0.02,0,0,0,0.01,1,1,1,1,1,1,0.89,0.62,0.05],
            [0,0.35,0.62,0.79,0.91,0.99,1,1,0.44,0.04,0,0,0,0,0,0,0,0,0,0,0,0.38,0.94,0.99,0.94,0.12,0,0,0,0,0,0.1,0.42,0.5,0.41,0.24,0.05,0,0,0.15,0.98,1,1,1,1,1,0.86,0.55,0.22],
            [0,0.05,0.35,0.56,0.73,0.87,0.98,1,0.83,0.38,0.09,0,0,0,0,0,0,0,0,0,0,0.71,0.98,0.98,0.76,0,0,0,0,0,0,0,0.29,0.47,0.48,0.38,0.22,0.13,0.21,0.5,1,1,1,1,1,1,0.82,0.47,0.12],
            [0,0,0,0.26,0.46,0.66,0.85,0.98,1,0.95,0.65,0.47,0.41,0.4,0.34,0.22,0.09,0.01,0,0,0.74,1,1,1,0.68,0,0,0,0,0,0,0,0.01,0.16,0.26,0.28,0.27,0.37,0.71,1,1,1,1,1,1,1,0.78,0.37,0],
            [0,0,0,0,0.11,0.35,0.6,0.83,0.98,1,1,1,1,1,1,1,1,0.88,0.71,0.9,1,1,1,1,0.99,0,0,0,0,0,0,0,0,0,0,0,0.11,0.55,1,1,1,1,1,1,1,0.99,0.72,0.27,0],
            [0,0,0,0,0,0,0.25,0.54,0.81,0.96,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0.01,0,0,0,0,0,0,0,0,0,0,0,0.58,1,1,1,1,1,1,1,0.97,0.64,0.16,0],
            [0,0,0,0,0,0,0,0.12,0.48,0.79,0.94,0.98,0.98,0.97,0.96,0.97,0.99,1,1,1,1,1,1,1,1,0.89,0.29,0.04,0,0,0,0,0,0,0,0,0,0.96,1,1,1,1,1,1,1,0.91,0.54,0.02,0],
            [0,0,0,0,0,0,0,0,0.03,0.5,0.84,0.96,0.92,0.73,0.71,0.83,0.85,0.85,0.82,0.77,0.69,0.7,0.9,1,1,1,1,0.94,0.51,0.17,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0.81,0.39,0,0],
            [0,0,0,0,0,0,0,0,0,0,0.34,0.51,0.41,0.16,0,0,0.05,0.14,0.14,0.06,0,0.11,0.46,0.82,0.99,1,1,1,1,1,0.56,0.15,0,0,0,0,0.17,1,1,1,1,1,1,1,0.95,0.66,0.2,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.38,0.77,0.93,0.97,0.99,1,1,1,0.87,0.43,0.25,0.24,0.38,0.65,1,1,1,1,1,1,0.99,0.82,0.45,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.1,0.67,0.85,0.91,0.96,1,1,1,1,0.95,0.88,0.95,1,1,1,1,0.99,0.99,0.97,0.86,0.59,0.18,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.11,0.49,0.87,0.97,0.99,1,1,1,1,1,0.98,0.95,0.92,0.91,0.9,0.87,0.79,0.61,0.28,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.42,0.9,0.96,0.95,0.93,0.91,0.87,0.82,0.76,0.72,0.69,0.68,0.66,0.6,0.48,0.25,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.09,0.55,0.83,0.78,0.65,0.55,0.48,0.42,0.38,0.35,0.34,0.34,0.3,0.22,0.07,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.18,0.2,0.08,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ]
    },

    /**
     * Hydrogeminium - Water-like flowing creature (Hydrogeminium natans)
     * From official Lenia: R=18, quad4 trimodal kernel b=[1/2, 1, 2/3], μ=0.26, σ=0.036
     *
     * CRITICAL: Geminidae family requires quad4 kernel (multi-peak), NOT bump4!
     * The betas parameter [0.5, 1, 0.667] creates a trimodal kernel with three concentric peaks.
     */
    hydrogeminium: {
        name: "Hydrogeminium",
        description: "Fluid, water-like behavior with smooth transitions.",
        params: {
            R: 18,
            mu: 0.26,           // Official Hydrogeminium natans parameters
            sigma: 0.036,
            dt: 0.1,
            kernelType: 'quad4', // Multi-peak kernel for Geminidae family
            betas: [1/2, 1, 2/3] // Trimodal: b="1/2,1,2/3" from official Lenia
        },
        // Official Hydrogeminium natans pattern extracted from Chakazul's implementation
        // 51x55 matrix - the specific shape is critical for water-like behavior
        pattern: [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.01,0.02,0.03,0.04,0.04,0.04,0.03,0.02,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.04,0.1,0.16,0.2,0.23,0.25,0.24,0.21,0.18,0.14,0.1,0.07,0.03,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.01,0.09,0.2,0.33,0.44,0.52,0.56,0.58,0.55,0.51,0.44,0.37,0.3,0.23,0.16,0.08,0.01,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.13,0.29,0.45,0.6,0.75,0.85,0.9,0.91,0.88,0.82,0.74,0.64,0.55,0.46,0.36,0.25,0.12,0.03,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.14,0.38,0.6,0.78,0.93,1,1,1,1,1,1,0.99,0.89,0.78,0.67,0.56,0.44,0.3,0.15,0.04,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.08,0.39,0.74,1,1,1,1,1,1,1,1,1,1,1,0.98,0.85,0.74,0.62,0.47,0.3,0.14,0.03,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.32,0.76,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0.88,0.75,0.61,0.45,0.27,0.11,0.01,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.35,0.83,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0.88,0.73,0.57,0.38,0.19,0.05,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.5,1,1,1,1,1,1,1,0.99,1,1,1,1,0.99,1,1,1,1,1,1,0.85,0.67,0.47,0.27,0.11,0.01],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.55,1,1,1,1,1,1,1,0.93,0.83,0.79,0.84,0.88,0.89,0.9,0.93,0.98,1,1,1,1,0.98,0.79,0.57,0.34,0.15,0.03],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.47,1,1,1,1,1,1,1,0.9,0.72,0.54,0.44,0.48,0.6,0.7,0.76,0.82,0.91,0.99,1,1,1,1,0.91,0.67,0.41,0.19,0.05],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.27,0.99,1,1,1,1,0.9,0.71,0.65,0.55,0.38,0.2,0.14,0.21,0.36,0.52,0.64,0.73,0.84,0.95,1,1,1,1,1,0.78,0.49,0.24,0.07],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.14,0.63,0.96,1,1,1,0.84,0.17,0,0,0,0,0,0,0,0.13,0.35,0.51,0.64,0.77,0.91,0.99,1,1,1,1,0.88,0.58,0.29,0.09],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.07,0.38,0.72,0.95,1,1,1,0.22,0,0,0,0,0,0,0,0,0,0.11,0.33,0.5,0.67,0.86,0.99,1,1,1,1,0.95,0.64,0.33,0.1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.32,0.49,0.71,0.93,1,1,1,0.56,0,0,0,0,0,0,0,0,0,0,0,0.1,0.31,0.52,0.79,0.98,1,1,1,1,0.98,0.67,0.35,0.11],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.01,0.6,0.83,0.98,1,1,0.68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.15,0.38,0.71,0.97,1,1,1,1,0.97,0.67,0.35,0.11],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.51,0.96,1,1,0.18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.09,0.34,0.68,0.95,1,1,1,1,0.91,0.61,0.32,0.1],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.13,0.56,0.99,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.17,0.45,0.76,0.96,1,1,1,1,0.82,0.52,0.26,0.07],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.33,0.7,0.94,1,1,0.44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.33,0.68,0.91,0.99,1,1,1,1,0.71,0.42,0.19,0.03],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.53,0.89,1,1,1,0.8,0.43,0.04,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.47,0.86,1,1,1,1,1,0.95,0.58,0.32,0.12,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.77,0.99,1,0.97,0.58,0.41,0.33,0.18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.54,0.95,1,1,1,1,1,0.8,0.44,0.21,0.06,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.39,0.83,1,1,0.55,0.11,0.05,0.15,0.22,0.06,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.58,0.99,1,1,1,1,1,0.59,0.29,0.11,0.01,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.04,0.55,0.81,0.86,0.97,1,1,0.5,0,0,0.01,0.09,0.03,0,0,0,0,0,0,0,0,0,0,0,0,0,0.26,0.78,1,1,1,1,1,0.66,0.35,0.13,0.03,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.33,1,1,1,1,1,1,0.93,0.11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.23,0.73,0.95,1,1,1,1,1,0.62,0.35,0.12,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.51,1,1,1,1,1,1,1,0.72,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0.56,0.25,0.09,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.12,0.38,1,1,1,0.66,0.08,0.55,1,1,1,0.03,0,0,0,0,0,0,0,0,0,0,0,0,0,0.35,1,1,1,1,1,1,0.67,0.12,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0.6,1,1,1,1,1,1,0.49,0,0,0.87,1,0.88,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0.7,0.07,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0.04,0.21,0.48,1,1,1,1,1,1,1,1,0,0,0.04,0.42,0.26,0,0,0,0,0,0,0,0,0,0.12,0.21,0.34,0.58,1,1,1,0.99,0.97,0.99,0.46,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0.5,1,1,1,1,0.96,0,0.31,1,1,1,0.53,0,0,0,0,0,0,0,0,0.2,0.21,0,0,0,0.27,1,1,1,1,1,1,0.87,0.52,0.01,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0.84,1,1,1,1,1,0,0,0,0.83,1,1,0.52,0,0,0,0,0,0,0,0.26,0.82,0.59,0.02,0,0,0.46,1,1,1,1,1,0.9,0.55,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0.39,0.99,1,1,1,1,0.78,0.04,0,0,0,0.93,0.92,0,0,0,0,0,0,0,0,0.69,1,1,0.36,0,0,1,1,0.65,0.66,0.97,0.87,0.54,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0.55,0.75,0.59,0.74,1,1,0,0,0.75,0.71,0.18,0,0,0,0,0,0,0,0,0,0,0.29,0,0,0.45,1,1,1,1,1,1,1,0.47,0.39,0.71,0.25,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0.69,0.81,0.8,0.92,1,0.13,0,0,0.13,0.94,0.58,0,0,0,0,0,0,0,0,0,1,1,0.34,0,0.04,1,1,1,1,1,1,1,0.24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0.63,0.85,0.9,0.98,1,0.09,0,0,0.02,1,0.64,0,0,0,0,0,0,0,0,0.59,1,1,0.84,0,0,1,1,1,1,1,1,0.64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0.64,0.65,0.67,1,1,0.21,0.01,0,0.04,0.02,0,0,0,0,0,0,0,0,0,0.69,1,1,1,0.29,0.37,1,1,0.6,0.63,1,0.84,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0.44,0.73,0.73,0.85,1,0.97,0.23,0.05,0,0,0,0,0,0,0,0,0.06,0,0,0,0.97,1,1,1,1,1,1,0.33,0.24,0.67,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0.12,0.55,0.9,0.9,1,1,1,0.43,0.04,0,0,0,0,0,0,0,0.31,0.54,0,0,0,0.88,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0.29,0.71,1,1,1,1,0.79,0.28,0,0,0,0,0,0,0,0,0.4,0.77,0.54,0,0,0.87,1,1,1,1,1,0.31,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0.16,0.27,0.41,0.72,0.99,1,1,0.82,0.42,0.09,0,0,0,0,0,0,0,0,0.1,0.55,0.58,0.58,0.77,0.99,1,1,1,1,0.63,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0.31,0.48,0.45,0.46,0.63,0.88,1,0.83,0.59,0.28,0.06,0,0,0,0,0,0,0,0,0,0.32,0.7,0.95,1,1,1,1,0.7,0.58,0.12,0.04,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0.23,0.54,0.53,0.48,0.57,0.59,0.65,0.63,0.55,0.35,0.13,0.03,0.02,0.09,0.74,1,0.09,0,0,0,0.32,0.86,1,1,1,1,0.57,0.44,0.31,0.16,0.01,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0.31,0.45,0.31,0.18,0.28,0.39,0.47,0.54,0.5,0.35,0.2,0.16,0.28,0.75,1,0.42,0.01,0,0,0.6,1,1,1,1,0.51,0.29,0.09,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0.14,0.3,0.4,0.54,0.71,0.74,0.65,0.49,0.35,0.27,0.47,0.6,0.6,0.72,0.98,1,1,1,1,0.65,0.33,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0.06,0.33,0.53,0.69,0.94,0.99,1,0.84,0.41,0.16,0.15,0.96,1,1,1,1,1,1,1,0.73,0.13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0.42,0.86,0.98,0.98,0.99,1,0.94,0.63,0.32,0.62,1,1,1,1,1,1,1,0.65,0.23,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0.07,0.62,0.95,1,1,0.99,0.98,0.99,1,1,1,1,1,1,1,0.98,0.14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0.03,0.46,0.89,1,1,0.97,0.83,0.75,0.81,0.94,1,1,1,1,0.99,0.03,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0.14,0.57,0.88,0.93,0.81,0.58,0.45,0.48,0.64,0.86,0.97,0.99,0.99,0.42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0.23,0.45,0.47,0.39,0.29,0.19,0.2,0.46,0.28,0.03,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0.08,0.22,0.24,0.15,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0,0.07,0.22,0.14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ]
    },

    /**
     * Scutium Gravidus - Heavy shield-like creature
     * From official Lenia: R=13, bump4 kernel, μ=0.283, σ=0.0369
     * A "bug with stomach" - filled form rather than ring
     */
    scutium: {
        name: "Scutium Gravidus",
        description: "Dense, shield-like structure with interesting dynamics.",
        params: {
            R: 13,           // Official Scutium Gravidus parameters
            peaks: 1,
            mu: 0.283,       // Official value
            sigma: 0.0369,   // Official value (tighter than before)
            dt: 0.1,
            kernelType: 'bump4'  // Use official Lenia kernel
        },
        // Official Scutium Gravidus pattern extracted from Chakazul's implementation
        // This is a stable 18x18 "bug with stomach" filled disc pattern
        pattern: [
            [0,0,0,0,0,0.33,0.31,0.21,0.02,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0.01,0.15,0.76,0.75,0.65,0.46,0,0,0,0,0,0,0,0],
            [0,0,0,0.11,0.26,0.36,0.43,1,1,0.96,0.82,0.23,0,0,0,0,0,0],
            [0,0,0.11,0.29,0.31,0.21,0.12,0.11,1,1,1,0.99,0.49,0.08,0,0,0,0],
            [0,0.01,0.26,0.31,0.11,0,0,0,0.01,0.86,1,1,1,0.58,0.21,0,0,0],
            [0.33,0.15,0.36,0.21,0,0,0,0,0,0.35,0.94,1,1,0.99,0.54,0.19,0,0],
            [0.31,0.76,0.43,0.12,0,0,0,0,0,0.28,0.73,1,1,1,0.79,0.4,0.1,0],
            [0.21,0.75,1,0.11,0,0,0,0,0.06,0.36,0.71,0.99,1,1,0.94,0.54,0.21,0.01],
            [0.02,0.65,1,1,0.01,0,0,0.06,0.26,0.51,0.79,1,1,1,1,0.63,0.28,0.03],
            [0,0.46,0.96,1,0.86,0.35,0.28,0.36,0.51,0.7,0.92,1,1,1,1,0.65,0.31,0.05],
            [0,0,0.82,1,1,0.94,0.73,0.71,0.79,0.92,1,1,1,1,0.93,0.61,0.29,0.05],
            [0,0,0.23,0.99,1,1,1,0.99,1,1,1,1,1,1,0.82,0.53,0.23,0.02],
            [0,0,0,0.49,1,1,1,1,1,1,1,1,1,0.93,0.68,0.4,0.15,0],
            [0,0,0,0.08,0.58,0.99,1,1,1,1,1,1,0.93,0.72,0.49,0.26,0.05,0],
            [0,0,0,0,0.21,0.54,0.79,0.94,1,1,0.93,0.82,0.68,0.49,0.3,0.1,0,0],
            [0,0,0,0,0,0.19,0.4,0.54,0.63,0.65,0.61,0.53,0.4,0.26,0.1,0.01,0,0],
            [0,0,0,0,0,0,0.1,0.21,0.28,0.31,0.29,0.23,0.15,0.05,0,0,0,0],
            [0,0,0,0,0,0,0,0.01,0.03,0.05,0.05,0.02,0,0,0,0,0,0]
        ]
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
     * Uses Phase 16 locomotion system (kernel modulation) for directed movement.
     * IMPORTANT: Requires sensory mode to be enabled for locomotion to work.
     */
    swimmer: {
        name: "Swimmer",
        description: "Streamlined shape that propels itself through flow dynamics.",
        params: {
            R: 12,
            peaks: 1,
            mu: 0.20,         // Adjusted for stable movement
            sigma: 0.025,     // Tighter sigma for cohesive shape
            dt: 0.12,
            flowStrength: 1.0,
            diffusion: 0.08,
            isFlowSpecies: true,
            isSensorySpecies: true,  // Required for locomotion system
            kernelType: 'bump4',     // Standard kernel - locomotion comes from offset system
            // Sensory parameters
            sensory: {
                foodWeight: 0.5,
                pheromoneWeight: 0.2,
                socialWeight: 0.1,
                turnRate: 0.08,       // Slow, graceful turns
                isPredator: false
            },
            // Genome with locomotion parameters
            genome: {
                foodWeight: 0.5,
                pheromoneWeight: 0.2,
                socialWeight: 0.1,
                turnRate: 0.08,
                speedPreference: 1.0,
                metabolismRate: 0.015,
                reproductionThreshold: 60,
                reproductionCost: 0.6,
                sizePreference: 1.0,
                isPredator: false,
                // Morphology
                kernelRadius: 12,
                growthMu: 0.20,
                growthSigma: 0.025,
                // Directional bias for streamlined movement
                kernelBias: 0.15,
                kernelOrientation: 0,
                // Forward-focused sensing
                sensorAngle: 0,
                sensorFocus: 0.3,
                // Light memory
                memoryWeight: 0.2,
                memoryDecay: 0.99,
                // Phase 16: LOCOMOTION - the key parameter!
                locomotionSpeed: 1.5    // Moderate swimming speed
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
     * Uses Phase 16 locomotion system with slow, circular movement pattern.
     * IMPORTANT: Requires sensory mode to be enabled for locomotion to work.
     */
    vortex: {
        name: "Vortex",
        description: "Spinning structure that maintains rotation through flow.",
        params: {
            R: 14,
            peaks: 1,
            mu: 0.22,         // Adjusted for stable ring shape
            sigma: 0.028,     // Tighter sigma
            dt: 0.1,
            flowStrength: 1.2,
            diffusion: 0.06,
            isFlowSpecies: true,
            isSensorySpecies: true,  // Required for locomotion system
            kernelType: 'ring',      // Ring kernel for ring-shaped creature
            // Sensory parameters - slow, exploratory movement
            sensory: {
                foodWeight: 0.3,
                pheromoneWeight: 0.4,
                socialWeight: 0.2,
                turnRate: 0.15,       // Higher turn rate for spiral paths
                isPredator: false
            },
            // Genome with locomotion parameters
            genome: {
                foodWeight: 0.3,
                pheromoneWeight: 0.4,
                socialWeight: 0.2,
                turnRate: 0.15,       // Higher turn rate creates spiral/vortex paths
                speedPreference: 0.8,
                metabolismRate: 0.015,
                reproductionThreshold: 60,
                reproductionCost: 0.6,
                sizePreference: 1.1,
                isPredator: false,
                // Morphology - ring-shaped
                kernelRadius: 14,
                growthMu: 0.22,
                growthSigma: 0.028,
                // Moderate directional bias
                kernelBias: 0.1,
                kernelOrientation: 0,
                // Balanced sensing
                sensorAngle: 0,
                sensorFocus: 0.2,
                // Light memory
                memoryWeight: 0.2,
                memoryDecay: 0.99,
                // Phase 16: LOCOMOTION - moderate speed with high turn rate = vortex paths
                locomotionSpeed: 1.0
            }
        },
        // Ring/donut shape
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
            R: 12,            // Slightly larger radius for softer appearance
            peaks: 1,
            mu: 0.15,         // Orbium-like growth center
            sigma: 0.018,     // Tighter sigma for more stable shape (Orbium uses 0.014-0.016)
            dt: 0.12,
            flowStrength: 0.9,
            diffusion: 0.12,  // Higher diffusion for softer edges
            isFlowSpecies: true,
            isSensorySpecies: true,
            kernelType: 'filled',  // New filled kernel for blob-like shapes
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
                // Morphology: soft, filled shapes for peaceful appearance
                kernelRadius: 12,
                growthMu: 0.15,
                growthSigma: 0.018,    // Tight sigma for stable Orbium-like shape
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
