/**
 * Kernel generation for Lenia
 *
 * The kernel defines the "neighborhood" influence pattern.
 * Classic Lenia uses a ring/donut shaped kernel, but we can experiment
 * with multiple rings, asymmetric shapes, and more.
 */

const Kernels = {
    // List of available kernel types for UI
    types: ['bump4', 'quad4', 'ring', 'gaussian', 'filled', 'mexicanHat', 'asymmetric', 'spiral', 'star', 'multiScale', 'anisotropic'],

    /**
     * Official Lenia bump4 kernel - the authentic Chakazul implementation
     * This is the kernel that creates stable, moving Orbium creatures
     *
     * Formula: exp(4 - 1/(r*(1-r))) for 0 < r < 1, else 0
     * This creates a smooth bell curve that peaks at r=0.5
     *
     * @param {number} radius - Kernel radius in cells
     * @returns {Object} - Kernel object with data array
     */
    bump4(radius) {
        const size = radius * 2 + 1;
        const kernel = new Float32Array(size * size);
        const center = radius;
        let sum = 0;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const dist = Math.sqrt(dx * dx + dy * dy) / radius;

                if (dist > 0 && dist < 1) {
                    // Official Lenia bump4 formula: exp(4 - 1/(r*(1-r)))
                    const r = dist;
                    const value = Math.exp(4 - 1 / (r * (1 - r)));
                    kernel[y * size + x] = value;
                    sum += value;
                }
            }
        }

        // Normalize kernel to sum to 1
        if (sum > 0) {
            for (let i = 0; i < kernel.length; i++) {
                kernel[i] /= sum;
            }
        }

        return { data: kernel, size: size, radius: radius, type: 'bump4' };
    },

    /**
     * Official Lenia quad4 kernel - multi-peak kernel for Geminidae family
     * Used by Geminium, Hydrogeminium, and other self-replicating creatures
     *
     * The quad4 kernel divides the radius [0,1] into B shells (where B = number of betas).
     * Each shell uses the bump4 formula with its beta value as amplitude.
     *
     * Example usage:
     * - quad4([1, 11/12]) = bimodal kernel (Aerogeminium) - 2 shells
     * - quad4([1/2, 1, 2/3]) = trimodal (Hydrogeminium) - 3 shells
     *
     * The betas define shell amplitudes, NOT positions. Positions are evenly spaced.
     *
     * @param {number} radius - Kernel radius in cells
     * @param {Array<number>} betas - Array of shell amplitudes (weights for each ring)
     * @returns {Object} - Kernel object with data array
     */
    quad4(radius, betas = [1, 1, 1]) {
        const size = radius * 2 + 1;
        const kernel = new Float32Array(size * size);
        const center = radius;
        let sum = 0;

        const B = betas.length; // Number of shells

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const r = Math.sqrt(dx * dx + dy * dy) / radius; // Normalized radius [0,1]

                if (r > 0 && r < 1) {
                    // Scale radius into shell space: Br ranges from 0 to B
                    const Br = B * r;

                    // Determine which shell we're in (0 to B-1)
                    const shellIndex = Math.min(Math.floor(Br), B - 1);

                    // Get the fractional position within this shell [0,1]
                    const shellPos = Br - shellIndex;

                    // Get the beta (amplitude) for this shell
                    const beta = betas[shellIndex];

                    // Apply bump4 formula to position within shell
                    // The bump4 peaks at shellPos = 0.5 (middle of shell)
                    let value = 0;
                    if (shellPos > 0 && shellPos < 1) {
                        value = beta * Math.exp(4 - 1 / (shellPos * (1 - shellPos)));
                    }

                    kernel[y * size + x] = value;
                    sum += value;
                }
            }
        }

        // Normalize kernel to sum to 1
        if (sum > 0) {
            for (let i = 0; i < kernel.length; i++) {
                kernel[i] /= sum;
            }
        }

        return { data: kernel, size: size, radius: radius, type: 'quad4', betas };
    },

    /**
     * Generate a ring-shaped kernel (the classic Lenia kernel)
     * Uses a polynomial bump function for smooth falloff
     *
     * @param {number} radius - Kernel radius in cells
     * @param {number} peaks - Number of concentric rings (1 = single ring)
     * @returns {Float32Array} - 2D kernel as flat array
     */
    ring(radius, peaks = 1) {
        const size = radius * 2 + 1;
        const kernel = new Float32Array(size * size);
        const center = radius;
        let sum = 0;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const dist = Math.sqrt(dx * dx + dy * dy) / radius;

                if (dist <= 1) {
                    // Multi-peak kernel using a sum of bumps
                    let value = 0;
                    for (let p = 1; p <= peaks; p++) {
                        const peakCenter = p / (peaks + 1);
                        const peakWidth = 0.5 / (peaks + 1);
                        value += this.bump(dist, peakCenter, peakWidth);
                    }
                    kernel[y * size + x] = value;
                    sum += value;
                }
            }
        }

        // Normalize kernel to sum to 1
        if (sum > 0) {
            for (let i = 0; i < kernel.length; i++) {
                kernel[i] /= sum;
            }
        }

        return { data: kernel, size: size, radius: radius, type: 'ring', peaks };
    },

    /**
     * Polynomial bump function - smooth curve that's 0 at edges, 1 at center
     * bell(x, m, s) = exp(-((x-m)/s)^2 / 2)
     */
    bump(x, center, width) {
        const d = (x - center) / width;
        return Math.exp(-d * d / 2);
    },

    /**
     * Generate a Gaussian kernel (for comparison with classic CA)
     */
    gaussian(radius) {
        const size = radius * 2 + 1;
        const kernel = new Float32Array(size * size);
        const center = radius;
        const sigma = radius / 3;
        let sum = 0;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const dist2 = dx * dx + dy * dy;
                const value = Math.exp(-dist2 / (2 * sigma * sigma));
                kernel[y * size + x] = value;
                sum += value;
            }
        }

        // Normalize
        for (let i = 0; i < kernel.length; i++) {
            kernel[i] /= sum;
        }

        return { data: kernel, size: size, radius: radius, type: 'gaussian' };
    },

    /**
     * Generate a filled/blob kernel for soft, blob-like creatures
     * Unlike the ring kernel which peaks at mid-radius, this peaks at center
     * and has smooth falloff. Creates creatures that appear filled rather than hollow.
     * Based on research from Chakazul's Lenia: unimodal kernels create filled shapes.
     *
     * @param {number} radius - Kernel radius in cells
     * @param {number} falloff - How quickly it falls off (0.5 = wide, 2 = tight)
     */
    filled(radius, falloff = 1.0) {
        const size = radius * 2 + 1;
        const kernel = new Float32Array(size * size);
        const center = radius;
        let sum = 0;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const dist = Math.sqrt(dx * dx + dy * dy) / radius;

                if (dist <= 1) {
                    // Smooth bump from center (dist=0) to edge (dist=1)
                    // Uses polynomial bump: (1 - dist^2)^2 for smooth falloff
                    // This creates a filled disc shape that tapers at edges
                    const d = dist * falloff;
                    const value = Math.max(0, (1 - d * d) * (1 - d * d));
                    kernel[y * size + x] = value;
                    sum += value;
                }
            }
        }

        // Normalize kernel to sum to 1
        if (sum > 0) {
            for (let i = 0; i < kernel.length; i++) {
                kernel[i] /= sum;
            }
        }

        return { data: kernel, size: size, radius: radius, type: 'filled', falloff };
    },

    /**
     * Generate a Mexican hat (Laplacian of Gaussian) kernel
     * Center is positive, surrounded by negative ring
     */
    mexicanHat(radius) {
        const size = radius * 2 + 1;
        const kernel = new Float32Array(size * size);
        const center = radius;
        const sigma = radius / 3;
        let sum = 0;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const dist2 = dx * dx + dy * dy;
                const norm = dist2 / (sigma * sigma);
                const value = (1 - norm / 2) * Math.exp(-norm / 2);
                kernel[y * size + x] = value;
                sum += Math.abs(value);
            }
        }

        // Normalize by absolute sum
        for (let i = 0; i < kernel.length; i++) {
            kernel[i] /= sum;
        }

        return { data: kernel, size: size, radius: radius, type: 'mexicanHat' };
    },

    /**
     * Generate an asymmetric kernel (experimental)
     * Could lead to directional movement
     */
    asymmetric(radius, bias = 0.3) {
        const size = radius * 2 + 1;
        const kernel = new Float32Array(size * size);
        const center = radius;
        let sum = 0;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const dist = Math.sqrt(dx * dx + dy * dy) / radius;

                if (dist <= 1) {
                    // Standard ring
                    let value = this.bump(dist, 0.5, 0.15);
                    // Add directional bias
                    const angle = Math.atan2(dy, dx);
                    value *= (1 + bias * Math.cos(angle));
                    kernel[y * size + x] = Math.max(0, value);
                    sum += kernel[y * size + x];
                }
            }
        }

        // Normalize
        if (sum > 0) {
            for (let i = 0; i < kernel.length; i++) {
                kernel[i] /= sum;
            }
        }

        return { data: kernel, size: size, radius: radius, type: 'asymmetric' };
    },

    /**
     * Generate a spiral kernel for rotating, vortex-like creatures
     * Creates a pattern that induces rotational motion
     *
     * @param {number} radius - Kernel radius in cells
     * @param {number} arms - Number of spiral arms (1-6)
     * @param {number} tightness - How tightly wound the spiral is (0.5-3)
     */
    spiral(radius, arms = 3, tightness = 1.5) {
        const size = radius * 2 + 1;
        const kernel = new Float32Array(size * size);
        const center = radius;
        let sum = 0;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const dist = Math.sqrt(dx * dx + dy * dy) / radius;
                const angle = Math.atan2(dy, dx);

                if (dist <= 1 && dist > 0.1) {
                    // Spiral pattern: value depends on angle offset by distance
                    const spiralAngle = angle + dist * tightness * Math.PI * 2;
                    const spiralValue = (Math.cos(spiralAngle * arms) + 1) / 2;

                    // Ring modulation to keep it bounded
                    const ringValue = this.bump(dist, 0.5, 0.25);

                    const value = spiralValue * ringValue;
                    kernel[y * size + x] = value;
                    sum += value;
                }
            }
        }

        // Normalize
        if (sum > 0) {
            for (let i = 0; i < kernel.length; i++) {
                kernel[i] /= sum;
            }
        }

        return { data: kernel, size: size, radius: radius, type: 'spiral', arms, tightness };
    },

    /**
     * Generate a star-shaped kernel for n-fold symmetric creatures
     *
     * @param {number} radius - Kernel radius in cells
     * @param {number} points - Number of star points (3-8)
     * @param {number} sharpness - How pointy the star is (0.1-0.9)
     */
    star(radius, points = 5, sharpness = 0.5) {
        const size = radius * 2 + 1;
        const kernel = new Float32Array(size * size);
        const center = radius;
        let sum = 0;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const dist = Math.sqrt(dx * dx + dy * dy) / radius;
                const angle = Math.atan2(dy, dx);

                if (dist <= 1) {
                    // Star pattern: modulate radius by angle
                    const starMod = 1 - sharpness + sharpness * Math.abs(Math.cos(angle * points / 2));
                    const effectiveDist = dist / starMod;

                    if (effectiveDist <= 1) {
                        // Ring at the star boundary
                        const value = this.bump(effectiveDist, 0.6, 0.2);
                        kernel[y * size + x] = value;
                        sum += value;
                    }
                }
            }
        }

        // Normalize
        if (sum > 0) {
            for (let i = 0; i < kernel.length; i++) {
                kernel[i] /= sum;
            }
        }

        return { data: kernel, size: size, radius: radius, type: 'star', points, sharpness };
    },

    /**
     * Generate a multi-scale kernel that detects patterns at multiple distances
     * Creates hierarchical structures
     *
     * @param {number} radius - Overall kernel radius
     * @param {Array<number>} scales - Array of relative radii [0.3, 0.6, 0.9]
     * @param {Array<number>} weights - Weight for each scale [1, 0.5, 0.25]
     */
    multiScale(radius, scales = [0.3, 0.6, 0.9], weights = [1, 0.5, 0.25]) {
        const size = radius * 2 + 1;
        const kernel = new Float32Array(size * size);
        const center = radius;
        let sum = 0;

        // Normalize weights
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        const normWeights = weights.map(w => w / totalWeight);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;
                const dist = Math.sqrt(dx * dx + dy * dy) / radius;

                if (dist <= 1) {
                    let value = 0;
                    // Sum contributions from each scale
                    for (let i = 0; i < scales.length; i++) {
                        const scaleCenter = scales[i];
                        const scaleWidth = 0.1;
                        value += normWeights[i] * this.bump(dist, scaleCenter, scaleWidth);
                    }
                    kernel[y * size + x] = value;
                    sum += value;
                }
            }
        }

        // Normalize
        if (sum > 0) {
            for (let i = 0; i < kernel.length; i++) {
                kernel[i] /= sum;
            }
        }

        return { data: kernel, size: size, radius: radius, type: 'multiScale', scales, weights };
    },

    /**
     * Generate an anisotropic (directional) kernel for elongated, directional movement
     *
     * @param {number} radius - Kernel radius
     * @param {number} angle - Direction in radians
     * @param {number} eccentricity - How elongated (0 = circular, 0.9 = very elongated)
     */
    anisotropic(radius, angle = 0, eccentricity = 0.6) {
        const size = radius * 2 + 1;
        const kernel = new Float32Array(size * size);
        const center = radius;
        let sum = 0;

        const cos_a = Math.cos(angle);
        const sin_a = Math.sin(angle);
        const scaleX = 1;
        const scaleY = 1 - eccentricity;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const dx = x - center;
                const dy = y - center;

                // Rotate coordinates
                const rx = dx * cos_a + dy * sin_a;
                const ry = -dx * sin_a + dy * cos_a;

                // Scale (stretch along one axis)
                const sx = rx / scaleX;
                const sy = ry / scaleY;

                const dist = Math.sqrt(sx * sx + sy * sy) / radius;

                if (dist <= 1) {
                    const value = this.bump(dist, 0.5, 0.2);
                    kernel[y * size + x] = value;
                    sum += value;
                }
            }
        }

        // Normalize
        if (sum > 0) {
            for (let i = 0; i < kernel.length; i++) {
                kernel[i] /= sum;
            }
        }

        return { data: kernel, size: size, radius: radius, type: 'anisotropic', angle, eccentricity };
    },

    /**
     * Create kernel visualization as a p5.js image
     */
    visualize(kernel, p5Instance, displaySize = 100) {
        const img = p5Instance.createImage(kernel.size, kernel.size);
        img.loadPixels();

        // Find max value for normalization
        let maxVal = 0;
        for (let i = 0; i < kernel.data.length; i++) {
            maxVal = Math.max(maxVal, Math.abs(kernel.data[i]));
        }

        for (let y = 0; y < kernel.size; y++) {
            for (let x = 0; x < kernel.size; x++) {
                const idx = (y * kernel.size + x) * 4;
                const val = kernel.data[y * kernel.size + x] / maxVal;

                // Blue for positive, red for negative
                if (val >= 0) {
                    img.pixels[idx] = 0;
                    img.pixels[idx + 1] = val * 200;
                    img.pixels[idx + 2] = val * 255;
                } else {
                    img.pixels[idx] = -val * 255;
                    img.pixels[idx + 1] = 0;
                    img.pixels[idx + 2] = 0;
                }
                img.pixels[idx + 3] = 255;
            }
        }

        img.updatePixels();
        return img;
    }
};
