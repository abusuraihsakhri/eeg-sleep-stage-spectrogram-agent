const test = require("node:test");
const assert = require("node:assert/strict");
const {parseCSV, analyze, example, fftReal} = require("../web/spectrogram.js");

test("CSV with header and optional timestamps", () => {
  assert.deepEqual(parseCSV("time,amplitude\n0,1\n0.01,-2\n"), [1,-2]);
  assert.deepEqual(parseCSV("amplitude\n1\n3\n"), [1,3]);
  assert.throws(() => parseCSV("1\nNaN\n"), /Invalid EEG amplitude/);
  assert.throws(() => parseCSV("1,2,3\n"), /one amplitude column/);
});

test("FFT of sine peaks at the correct frequency", () => {
  const fs = 128, n=256;
  const samples=Array.from({length:n},(_,i)=>Math.sin(2*Math.PI*10*i/fs));
  const {real,imag}=fftReal(samples);
  const amplitudes=Array.from({length:n/2},(_,k)=>Math.hypot(real[k],imag[k]));
  const peak=amplitudes.indexOf(Math.max(...amplitudes));
  assert.equal(peak,20);
});

test("10 Hz signal dominates alpha band in Hann power estimate", () => {
  const fs=128;
  const samples=Array.from({length:fs*8},(_,i)=>30*Math.sin(2*Math.PI*10*i/fs));
  const result=analyze(samples,fs,{windowSeconds:2});
  assert.ok(result.frames.length>2);
  assert.equal(result.frequencies[1]-result.frequencies[0],0.5);
  const b=result.frames[0].bands;
  assert.ok(b.alpha > b.theta*50);
  assert.ok(b.alpha > b.delta*50);
  assert.ok(Math.abs(b.alpha-450)<40, "Expected sine variance approximately 450 µV²");
});

test("invalid sample rates, lengths and nonfinite inputs fail", () => {
  assert.throws(()=>analyze([1,2,3],128),/Recording must contain/);
  assert.throws(()=>analyze(example(),0),/Sample rate/);
  assert.throws(()=>analyze([NaN,...example()],128),/finite/);
});
