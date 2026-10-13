/* Dependency-free, client-side EEG spectral analysis (not clinical sleep staging). */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.EEGSpectrogram = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";
  const MAX_SAMPLES = 250000;
  const BANDS = { delta: [0.5, 4], theta: [4, 8], alpha: [8, 13], sigma: [12, 16], beta: [16, 30] };

  function parseCSV(text) {
    if (typeof text !== "string") throw new TypeError("CSV must be text");
    const rows = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(row => row.trim());
    const values = [];
    let skippedHeader = false;
    for (let i = 0; i < rows.length; i++) {
      const fields = rows[i].trim().split(/[,;\t]/);
      if (fields.length < 1 || fields.length > 2) throw new Error("CSV must have one amplitude column or time,amplitude columns");
      const raw = fields[fields.length - 1].trim();
      const number = raw === "" ? NaN : Number(raw);
      if (!Number.isFinite(number)) {
        if (i === 0 && !skippedHeader) { skippedHeader = true; continue; }
        throw new Error("Invalid EEG amplitude on CSV line " + (i + 1));
      }
      values.push(number);
      if (values.length > MAX_SAMPLES) throw new Error("Maximum " + MAX_SAMPLES + " samples per file");
    }
    if (values.length < 2) throw new Error("CSV has insufficient numeric EEG samples");
    return values;
  }

  function fftReal(values) {
    const n = values.length;
    if (n < 2 || (n & (n - 1)) !== 0) throw new Error("FFT input size must be a power of two");
    const real = Float64Array.from(values);
    const imag = new Float64Array(n);
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      while (j & bit) { j ^= bit; bit >>= 1; }
      j ^= bit;
      if (i < j) {
        const temp = real[i]; real[i] = real[j]; real[j] = temp;
      }
    }
    for (let len = 2; len <= n; len *= 2) {
      const angle = -2 * Math.PI / len;
      for (let start = 0; start < n; start += len) {
        for (let j = 0; j < len / 2; j++) {
          const k = start + j, l = k + len / 2;
          const c = Math.cos(angle * j), s = Math.sin(angle * j);
          const tr = real[l] * c - imag[l] * s;
          const ti = real[l] * s + imag[l] * c;
          real[l] = real[k] - tr; imag[l] = imag[k] - ti;
          real[k] += tr; imag[k] += ti;
        }
      }
    }
    return { real, imag };
  }

  function analyze(samples, sampleRate, options) {
    options = options || {};
    const fs = Number(sampleRate);
    const seconds = options.windowSeconds === undefined ? 2 : Number(options.windowSeconds);
    if (!Number.isFinite(fs) || fs < 32 || fs > 1024) throw new Error("Sample rate must be between 32 and 1024 Hz");
    if (!Number.isFinite(seconds) || seconds <= 0.25 || seconds > 10) throw new Error("Window must be >0.25 and <=10 seconds");
    if (!samples || !Number.isInteger(samples.length) || samples.length > MAX_SAMPLES) throw new Error("Invalid sample array or sample limit exceeded");
    let n = 1;
    while (n < fs * seconds) n *= 2;
    if (n > 4096) n = 4096;
    if (samples.length < n) throw new Error("Recording must contain at least " + n + " samples for this window");
    for (const sample of samples) if (!Number.isFinite(sample)) throw new Error("EEG amplitudes must be finite");
    const step = n / 2;
    const window = Float64Array.from({ length: n }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)));
    const scale = 1 / (fs * window.reduce((sum, value) => sum + value * value, 0));
    const bins = Math.floor(Math.min(30, fs / 2) * n / fs);
    const frequencies = Array.from({ length: bins + 1 }, (_, k) => k * fs / n);
    const frames = [];
    for (let offset = 0; offset + n <= samples.length; offset += step) {
      const mean = samples.slice(offset, offset + n).reduce((a, b) => a + b, 0) / n;
      const segment = window.map((w, i) => (samples[offset + i] - mean) * w);
      const transformed = fftReal(segment);
      const powers = frequencies.map((_, k) => {
        const factor = (k === 0 || k === n / 2) ? 1 : 2;
        return factor * scale * (transformed.real[k] ** 2 + transformed.imag[k] ** 2);
      });
      const bands = {};
      for (const [name, [low, high]] of Object.entries(BANDS)) {
        bands[name] = powers.reduce((total, p, k) => total + (frequencies[k] >= low && frequencies[k] < high ? p * fs / n : 0), 0);
      }
      frames.push({ time: (offset + n / 2) / fs, powers, bands });
    }
    return { frequencies, frames, sampleRate: fs, samples: samples.length, windowSamples: n };
  }

  function example(sampleRate = 128, duration = 45) {
    return Array.from({ length: sampleRate * duration }, (_, i) => {
      const t = i / sampleRate;
      return 24 * Math.sin(2 * Math.PI * 2 * t) + (t > duration / 2 ? 32 : 9) * Math.sin(2 * Math.PI * 10 * t);
    });
  }
  return { parseCSV, analyze, example, fftReal, MAX_SAMPLES, BANDS };
});
