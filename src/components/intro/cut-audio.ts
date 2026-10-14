/** Recorded one-shots only. Empty manifest deliberately means silent, never synthesized audio. */
export type CutAudioFiles = Partial<
  Record<"hinge" | "close" | "cut" | "rustle", string>
>;
export class CutAudio {
  private context?: AudioContext;
  private buffers = new Map<string, AudioBuffer>();
  private sources = new Set<AudioBufferSourceNode>();
  private previous = 0;
  private enabled = false;
  private epoch = 0;
  private abort = new AbortController();
  constructor(private files: CutAudioFiles) {}
  async enable() {
    const epoch = ++this.epoch;
    this.context ??= new AudioContext();
    await this.context.resume(); // Called only from an explicit user gesture.
    const context = this.context;
    await Promise.all(
      Object.entries(this.files).map(async ([key, url]) => {
        if (!url || this.buffers.has(key)) return;
        const response = await fetch(url, { signal: this.abort.signal });
        if (!response.ok) throw new Error("Recorded audio unavailable");
        this.buffers.set(
          key,
          await context.decodeAudioData(await response.arrayBuffer()),
        );
      }),
    );
    if (epoch !== this.epoch) throw new Error("Audio cancelled");
    this.enabled = true;
  }
  private play(key: string, volume: number) {
    const buffer = this.buffers.get(key),
      context = this.context;
    if (!this.enabled || !buffer || !context || context.state !== "running")
      return;
    const source = context.createBufferSource(),
      gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(context.destination);
    this.sources.add(source);
    source.onended = () => {
      this.sources.delete(source);
      source.disconnect();
      gain.disconnect();
    };
    source.start();
  }
  update(seconds: number) {
    const from = this.previous;
    this.previous = seconds;
    if (seconds < from) return;
    const cue = (time: number, key: string, volume: number) => {
      if (from < time && seconds >= time && seconds - time < 0.18)
        this.play(key, volume);
    };
    cue(0.85, "hinge", 0.14);
    for (let i = 0; i < 4; i++) {
      const start = 1.3 + i * (1.7 / 4);
      cue(start + 0.025, "cut", 0.22);
      cue(start + (1.7 / 4) * 0.64, "close", 0.17);
      if (i < 3) cue(start + (1.7 / 4) * 0.7, "hinge", 0.12);
    }
    cue(3.08, "rustle", 0.18);
  }
  stop() {
    this.epoch++;
    this.enabled = false;
    this.sources.forEach((source) => source.stop());
    this.sources.clear();
  }
  reset() {
    this.previous = 0;
    this.sources.forEach((source) => source.stop());
    this.sources.clear();
  }
  suspend() {
    this.sources.forEach((source) => source.stop());
    this.sources.clear();
    void this.context?.suspend();
  }
  resume() {
    if (this.enabled) void this.context?.resume();
  }
  dispose() {
    this.abort.abort();
    this.stop();
    void this.context?.close();
    this.buffers.clear();
  }
}
