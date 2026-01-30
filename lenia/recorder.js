/**
 * Recording and export functionality for Lenia
 *
 * Supports:
 * - WebM video recording using MediaRecorder API
 * - GIF export using gif.js library
 */

class VideoRecorder {
    constructor(canvas) {
        this.canvas = canvas;
        this.mediaRecorder = null;
        this.chunks = [];
        this.isRecording = false;
        this.startTime = null;
        this.duration = 0;

        this.onStart = null;
        this.onStop = null;
        this.onProgress = null;
    }

    /**
     * Check if browser supports recording
     */
    static isSupported() {
        return !!(window.MediaRecorder && MediaRecorder.isTypeSupported('video/webm'));
    }

    /**
     * Start recording
     * @param {number} maxDuration - Max duration in seconds (0 = unlimited)
     */
    start(maxDuration = 0) {
        if (this.isRecording) return;

        try {
            const stream = this.canvas.captureStream(30); // 30 fps
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 5000000 // 5 Mbps
            });

            this.chunks = [];
            this.startTime = Date.now();

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.chunks.push(e.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.isRecording = false;
                this.duration = (Date.now() - this.startTime) / 1000;

                const blob = new Blob(this.chunks, { type: 'video/webm' });
                if (this.onStop) {
                    this.onStop(blob, this.duration);
                }
            };

            this.mediaRecorder.start(100); // Collect data every 100ms
            this.isRecording = true;

            if (this.onStart) {
                this.onStart();
            }

            // Auto-stop if max duration set
            if (maxDuration > 0) {
                setTimeout(() => {
                    if (this.isRecording) {
                        this.stop();
                    }
                }, maxDuration * 1000);
            }

            // Progress updates
            this._progressInterval = setInterval(() => {
                if (this.isRecording && this.onProgress) {
                    const elapsed = (Date.now() - this.startTime) / 1000;
                    this.onProgress(elapsed, maxDuration);
                }
            }, 100);

        } catch (e) {
            console.error('Failed to start recording:', e);
            this.isRecording = false;
        }
    }

    /**
     * Stop recording
     */
    stop() {
        if (!this.isRecording) return;

        clearInterval(this._progressInterval);

        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
    }

    /**
     * Download the recorded video
     */
    static download(blob, filename = null) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `lenia-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

/**
 * GIF Recorder using canvas frames
 * Uses gif.js library (loaded from CDN)
 */
class GifRecorder {
    constructor(canvas) {
        this.canvas = canvas;
        this.frames = [];
        this.isRecording = false;
        this.isProcessing = false;
        this.startTime = null;
        this.frameInterval = null;

        this.onStart = null;
        this.onStop = null;
        this.onProgress = null;
        this.onComplete = null;

        // GIF settings
        this.fps = 15;
        this.quality = 10; // 1-30, lower = better quality
        this.width = 256;
        this.height = 256;
    }

    /**
     * Check if gif.js is loaded
     */
    static isSupported() {
        return typeof GIF !== 'undefined';
    }

    /**
     * Load gif.js from CDN if not already loaded
     */
    static async loadLibrary() {
        if (typeof GIF !== 'undefined') return true;

        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.head.appendChild(script);
        });
    }

    /**
     * Start capturing frames
     * @param {number} duration - Duration in seconds
     */
    start(duration = 5) {
        if (this.isRecording) return;

        this.frames = [];
        this.startTime = Date.now();
        this.isRecording = true;

        const frameDelay = 1000 / this.fps;
        const maxFrames = Math.floor(duration * this.fps);

        if (this.onStart) {
            this.onStart();
        }

        let frameCount = 0;

        this.frameInterval = setInterval(() => {
            if (!this.isRecording) return;

            // Capture frame
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.width;
            tempCanvas.height = this.height;
            const ctx = tempCanvas.getContext('2d');
            ctx.drawImage(this.canvas, 0, 0, this.width, this.height);
            this.frames.push(tempCanvas);

            frameCount++;

            if (this.onProgress) {
                this.onProgress(frameCount / maxFrames, frameCount, maxFrames);
            }

            if (frameCount >= maxFrames) {
                this.stop();
            }
        }, frameDelay);
    }

    /**
     * Stop capturing
     */
    stop() {
        if (!this.isRecording) return;

        clearInterval(this.frameInterval);
        this.isRecording = false;

        if (this.onStop) {
            this.onStop(this.frames.length);
        }
    }

    /**
     * Process frames into GIF
     */
    async processGif() {
        if (this.frames.length === 0) return null;
        if (!GifRecorder.isSupported()) {
            await GifRecorder.loadLibrary();
            if (!GifRecorder.isSupported()) {
                console.error('gif.js library not available');
                return null;
            }
        }

        this.isProcessing = true;

        return new Promise((resolve) => {
            const gif = new GIF({
                workers: 2,
                quality: this.quality,
                width: this.width,
                height: this.height,
                workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
            });

            const frameDelay = 1000 / this.fps;

            for (const frame of this.frames) {
                gif.addFrame(frame, { delay: frameDelay });
            }

            gif.on('progress', (p) => {
                if (this.onProgress) {
                    this.onProgress(p, Math.floor(p * this.frames.length), this.frames.length);
                }
            });

            gif.on('finished', (blob) => {
                this.isProcessing = false;
                if (this.onComplete) {
                    this.onComplete(blob);
                }
                resolve(blob);
            });

            gif.render();
        });
    }

    /**
     * Record and immediately process
     */
    async record(duration = 5) {
        await GifRecorder.loadLibrary();

        return new Promise((resolve) => {
            const originalOnStop = this.onStop;
            this.onStop = async (frameCount) => {
                if (originalOnStop) originalOnStop(frameCount);
                const blob = await this.processGif();
                resolve(blob);
            };
            this.start(duration);
        });
    }

    /**
     * Download the GIF
     */
    static download(blob, filename = null) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `lenia-${Date.now()}.gif`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

/**
 * Simple screenshot functionality with Living Aquarium enhancements
 */
class ScreenshotCapture {
    /**
     * Capture current canvas as image
     */
    static capture(canvas, format = 'png') {
        return canvas.toDataURL(`image/${format}`);
    }

    /**
     * Capture with vignette effect for polished look
     */
    static captureWithVignette(canvas, vignetteStrength = 0.3) {
        // Create temp canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const ctx = tempCanvas.getContext('2d');

        // Draw original
        ctx.drawImage(canvas, 0, 0);

        // Add vignette
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.max(centerX, centerY) * 1.2;

        const gradient = ctx.createRadialGradient(
            centerX, centerY, radius * 0.5,
            centerX, centerY, radius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteStrength})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        return tempCanvas.toDataURL('image/png');
    }

    /**
     * Download screenshot with optional vignette
     */
    static download(canvas, filename = null, format = 'png', addVignette = true) {
        let dataUrl;

        if (addVignette) {
            dataUrl = this.captureWithVignette(canvas, 0.25);
        } else {
            dataUrl = this.capture(canvas, format);
        }

        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = filename || `lenia-${Date.now()}.${format}`;
        a.click();
    }
}

// Global recorder instances
let videoRecorder = null;
let gifRecorder = null;

function initRecorders(canvas) {
    videoRecorder = new VideoRecorder(canvas);
    gifRecorder = new GifRecorder(canvas);

    // Load gif.js in background
    GifRecorder.loadLibrary();
}
