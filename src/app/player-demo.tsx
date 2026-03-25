'use client'

import { Player, usePlayback, useAppearance } from '@/components/player'

function Controls() {
  const playback = usePlayback()
  const appearance = useAppearance()

  return (
    <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 10 }}>
      <button
        aria-label={playback.isPlaying ? 'Pause' : 'Play'}
        onClick={() => (playback.isPlaying ? playback.pause() : playback.play())}
      >
        {playback.isPlaying ? 'Pause' : 'Play'}
      </button>
      <input
        type="range"
        aria-label="Seek"
        min={0}
        max={playback.duration || 100}
        step={0.1}
        value={playback.currentTime}
        onChange={(e) => playback.seek(Number(e.target.value))}
      />
      <input
        type="range"
        aria-label="Padding"
        min={0}
        max={100}
        value={appearance.padding}
        onChange={(e) => appearance.setPadding(Number(e.target.value))}
      />
      <input
        type="range"
        aria-label="Rounding"
        min={0}
        max={100}
        value={appearance.rounding}
        onChange={(e) => appearance.setRounding(Number(e.target.value))}
      />
    </div>
  )
}

export default function PlayerDemo() {
  return (
    <main style={{ width: '100vw', height: '100vh' }}>
      <Player.Canvas
        aria-label="Demo video player"
        style={{ width: '100%', height: '100%' }}
        onError={(e) => console.error('Player error:', e)}
      >
        <Player.Canvas.Background backgroundSrc="/sample-bg.jpg" />
        <Player.Canvas.Video videoSrc="/sample-video.mp4" />
        <Controls />
      </Player.Canvas>
    </main>
  )
}
