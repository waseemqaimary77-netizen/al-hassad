let audioCtx: AudioContext | null = null;

export function playTone(frequencies: number[], stepSeconds = 0.16): void {
  try {
    audioCtx ??= new AudioContext();
    void audioCtx.resume();
    frequencies.forEach((freq, index) => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const startTime = audioCtx.currentTime + index * stepSeconds;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + stepSeconds);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + stepSeconds);
    });
  } catch {
    // Ignore audio context restrictions
  }
}
