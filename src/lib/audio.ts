import { createAudioPlayer, type AudioPlayer, type AudioSource } from 'expo-audio';

type PlayOptions = {
  rate?: number;
  volume?: number;
  /** Keep the player after playback ends, so it can be replayed via `toggle()`. */
  keep?: boolean;
  onFinish?: () => void;
};

/**
 * Single-player playback slot on top of expo-audio.
 *
 * Starting a new sound stops and releases the previous one, so rapid taps
 * never stack audio. Without `keep`, the player is released when it finishes.
 */
export class SoundSlot {
  private player: AudioPlayer | null = null;
  private subscription: { remove(): void } | null = null;

  play(source: AudioSource, opts: PlayOptions = {}) {
    this.stop();
    const player = createAudioPlayer(source);
    this.player = player;
    if (opts.volume != null) player.volume = opts.volume;
    if (opts.rate != null && opts.rate !== 1) player.setPlaybackRate(opts.rate, 'high');
    this.subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (!status.didJustFinish) return;
      opts.onFinish?.();
      if (!opts.keep && this.player === player) this.stop();
    });
    player.play();
  }

  stop() {
    this.subscription?.remove();
    this.subscription = null;
    this.player?.remove();
    this.player = null;
  }

  /** Plays or pauses the current player. Returns true when it is now playing. */
  async toggle(): Promise<boolean> {
    const player = this.player;
    if (!player) return false;
    if (player.playing) {
      player.pause();
      return false;
    }
    const { currentTime, duration } = player;
    if (duration > 0 && currentTime >= duration - 0.05) await player.seekTo(0);
    player.play();
    return true;
  }

  get isPlaying() {
    return this.player?.playing ?? false;
  }

  get isActive() {
    return this.player != null;
  }
}

/** Plays a one-off sound on a throwaway player. Releases it once it finishes. */
export function playOnce(source: AudioSource, opts: Omit<PlayOptions, 'keep'> = {}) {
  const slot = new SoundSlot();
  slot.play(source, { ...opts, keep: false });
  return slot;
}
