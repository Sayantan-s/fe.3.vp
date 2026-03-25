'use client'

import { useEffect, useRef, useState, Children, isValidElement, type CSSProperties } from 'react'
import { WebGLRenderer, Scene, OrthographicCamera, Mesh, PlaneGeometry } from 'three'
import {
  PlayerContext,
  PlayerInternalContext,
  PlaybackContext,
  AppearanceContext,
} from './context'
import { createAppearanceStore } from './appearance-store'
import type {
  PlayerCanvasProps,
  PlayerState,
  PlayerInternalContextValue,
  PlaybackSource,
  PlaybackState,
  VideoAppearanceStore,
  VideoAppearance,
} from './types'

const SR_ONLY: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
}

export function PlayerCanvas(props: PlayerCanvasProps) {
  const {
    'aria-label': ariaLabel,
    children,
    className,
    style,
    // Controlled playback
    playing,
    currentTime,
    volume,
    muted,
    playbackRate,
    // Controlled appearance
    padding: controlledPadding,
    rounding: controlledRounding,
    defaultPadding,
    defaultRounding,
    // Event callbacks
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
    onDurationChange,
    onSeeking,
    onSeeked,
    onReady,
    onBuffering,
    onVolumeChange,
    onPaddingChange,
    onRoundingChange,
    onError,
  } = props

  // Refs for Three.js
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<WebGLRenderer | null>(null)
  const sceneRef = useRef<Scene | null>(null)
  const cameraRef = useRef<OrthographicCamera | null>(null)
  const animFrameRef = useRef<number>(0)
  const meshesRef = useRef<Map<string, { mesh: Mesh; zIndex: number }>>(new Map())

  // Playback source registered by Video child
  const [playbackSource, setPlaybackSource] = useState<PlaybackSource | null>(null)

  // Appearance store
  const [appearanceStore] = useState(() =>
    createAppearanceStore({ defaultPadding, defaultRounding }),
  )

  // Player state
  const [playerState, setPlayerState] = useState<PlayerState>({
    isReady: false,
    error: null,
  })

  // Announcement for a11y
  const [announcement, setAnnouncement] = useState('')

  // --- Validate children ---
  // Ensure at least one Video child exists

  useEffect(() => {
    let hasVideo = false
    Children.forEach(children, (child) => {
      if (isValidElement(child) && (child.type as any)?.displayName === 'CanvasVideo') {
        hasVideo = true
      }
    })
    if (!hasVideo) {
      const err = new Error('Player.Canvas requires at least one <Player.Canvas.Video> child')
      setPlayerState((prev) => ({ ...prev, error: err }))
      onError?.(err)
    }
  }, [children, onError])

  // --- Internal context functions ---
  // React Compiler handles memoization — no useCallback needed

  function reportError(error: Error) {
    setPlayerState((prev) => ({ ...prev, error }))
    onError?.(error)
    setAnnouncement(`Error: ${error.message}`)
  }

  function clearError() {
    setPlayerState((prev) => ({ ...prev, error: null }))
  }

  function registerMesh(id: string, mesh: Mesh, zIndex: number) {
    mesh.position.z = zIndex
    meshesRef.current.set(id, { mesh, zIndex })
    sceneRef.current?.add(mesh)
  }

  function unregisterMesh(id: string) {
    const entry = meshesRef.current.get(id)
    if (entry) {
      sceneRef.current?.remove(entry.mesh)
      meshesRef.current.delete(id)
    }
  }

  function registerPlayback(source: PlaybackSource) {
    setPlaybackSource(source)
    setPlayerState((prev) => ({ ...prev, isReady: true }))
    onReady?.()
    setAnnouncement('Video ready')
  }

  function unregisterPlayback() {
    setPlaybackSource(null)
    setPlayerState((prev) => ({ ...prev, isReady: false }))
  }

  function registerAppearance(_store: VideoAppearanceStore) {
    // No-op — appearance store is created by Canvas.
    // Kept for future extensibility.
  }

  function unregisterAppearance() {}

  const internalValue: PlayerInternalContextValue = {
    registerMesh,
    unregisterMesh,
    registerPlayback,
    unregisterPlayback,
    registerAppearance,
    unregisterAppearance,
    reportError,
    clearError,
  }

  // --- Sync controlled playback props ---

  useEffect(() => {
    if (playbackSource) {
      playbackSource.syncControlled({ playing, currentTime, volume, muted, playbackRate })
    }
  }, [playbackSource, playing, currentTime, volume, muted, playbackRate])

  // --- Sync controlled appearance props ---

  useEffect(() => {
    appearanceStore.syncControlled({
      padding: controlledPadding,
      rounding: controlledRounding,
    })
  }, [appearanceStore, controlledPadding, controlledRounding])

  // --- Subscribe to playback events for callbacks ---

  useEffect(() => {
    if (!playbackSource) return

    let prevState: PlaybackState = playbackSource.getState()

    const unsub = playbackSource.subscribe(() => {
      const next = playbackSource.getState()

      if (!prevState.isPlaying && next.isPlaying) {
        onPlay?.()
        setAnnouncement('Playing')
      }
      if (prevState.isPlaying && !next.isPlaying && !next.isEnded) {
        onPause?.()
        setAnnouncement(`Paused at ${formatTime(next.currentTime)}`)
      }
      if (!prevState.isEnded && next.isEnded) {
        onEnded?.()
        setAnnouncement('Video ended')
      }
      if (prevState.currentTime !== next.currentTime) {
        onTimeUpdate?.(next.currentTime)
      }
      if (prevState.duration !== next.duration) {
        onDurationChange?.(next.duration)
      }
      if (!prevState.isSeeking && next.isSeeking) {
        onSeeking?.()
      }
      if (prevState.isSeeking && !next.isSeeking) {
        onSeeked?.()
      }
      if (!prevState.isBuffering && next.isBuffering) {
        onBuffering?.()
        setAnnouncement('Buffering')
      }
      if (prevState.volume !== next.volume || prevState.isMuted !== next.isMuted) {
        onVolumeChange?.(next.volume, next.isMuted)
      }

      prevState = next
    })

    return unsub
  }, [playbackSource])

  // --- Subscribe to appearance changes for callbacks ---

  useEffect(() => {
    let prev: VideoAppearance = appearanceStore.getAppearance()

    const unsub = appearanceStore.subscribe(() => {
      const next = appearanceStore.getAppearance()
      if (prev.padding !== next.padding) {
        onPaddingChange?.(next.padding)
      }
      if (prev.rounding !== next.rounding) {
        onRoundingChange?.(next.rounding)
      }
      prev = next
    })

    return unsub
  }, [appearanceStore])

  // --- Three.js setup ---

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    rendererRef.current = renderer

    const scene = new Scene()
    sceneRef.current = scene

    // OrthographicCamera(left, right, top, bottom, near, far)
    // top > bottom for standard screen-space (Y=0 at bottom)
    const camera = new OrthographicCamera(0, 1, 1, 0, 0.1, 1000)
    camera.position.z = 10
    cameraRef.current = camera

    // Resize handler
    function resize() {
      const { clientWidth: w, clientHeight: h } = container!
      if (w === 0 || h === 0) return

      renderer.setSize(w, h)
      camera.left = 0
      camera.right = w
      camera.top = h
      camera.bottom = 0
      camera.updateProjectionMatrix()

      updateMeshSizes(w, h)
      renderer.render(scene, camera)
    }

    function updateMeshSizes(w: number, h: number) {
      const appearance = appearanceStore.getAppearance()

      for (const [id, { mesh }] of meshesRef.current) {
        if (id === 'background') {
          mesh.geometry.dispose()
          mesh.geometry = new PlaneGeometry(w, h)
          mesh.position.set(w / 2, h / 2, 0)
        } else if (id === 'video') {
          const pad = (appearance.padding / 100) * Math.min(w, h)
          const vw = w - pad * 2
          const vh = h - pad * 2
          mesh.geometry.dispose()
          mesh.geometry = new PlaneGeometry(vw, vh)
          mesh.position.set(w / 2, h / 2, 1)

          const mat = mesh.material as import('three').ShaderMaterial
          if (mat.uniforms) {
            mat.uniforms.resolution.value.set(vw, vh)
            mat.uniforms.radius.value = (appearance.rounding / 100) * Math.min(vw, vh) * 0.5
          }
        }
      }
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()

    // Appearance change → update meshes
    const unsubAppearance = appearanceStore.subscribe(() => {
      const { clientWidth: w, clientHeight: h } = container!
      updateMeshSizes(w, h)
      renderer.render(scene, camera)
    })

    // Render loop with optimization: stop when video paused + no changes
    let running = true
    let needsRender = true

    function requestRender() {
      needsRender = true
    }

    function animate() {
      if (!running) return
      animFrameRef.current = requestAnimationFrame(animate)

      // Only render when needed
      if (needsRender) {
        renderer.render(scene, camera)
        needsRender = false
      }
    }

    // Subscribe to playback to know when video is playing (needs continuous render)
    // This subscription is set up once and stays for the lifetime of the Three.js setup
    let playbackUnsub: (() => void) | null = null
    function watchPlayback() {
      // Check if there's a registered playback source via the meshes (proxy)
      // The actual continuous render decision is: if video is playing, always render
      needsRender = true
    }

    animate()

    // WebGL context loss
    function onContextLost(e: Event) {
      e.preventDefault()
      running = false
      cancelAnimationFrame(animFrameRef.current)
      reportError(new Error('WebGL context lost'))
    }

    function onContextRestored() {
      // Recreate renderer after context restore
      renderer.dispose()
      const newRenderer = new WebGLRenderer({ canvas: canvas!, alpha: true, antialias: true })
      newRenderer.setPixelRatio(window.devicePixelRatio)
      rendererRef.current = newRenderer

      running = true
      needsRender = true
      resize()
      animate()
      clearError()
    }

    canvas.addEventListener('webglcontextlost', onContextLost)
    canvas.addEventListener('webglcontextrestored', onContextRestored)

    return () => {
      running = false
      cancelAnimationFrame(animFrameRef.current)
      resizeObserver.disconnect()
      unsubAppearance()
      canvas.removeEventListener('webglcontextlost', onContextLost)
      canvas.removeEventListener('webglcontextrestored', onContextRestored)
      renderer.dispose()
      rendererRef.current = null
      sceneRef.current = null
      cameraRef.current = null
    }
  }, [appearanceStore])

  // --- Public context ---

  const contextValue = {
    state: playerState,
    meta: {
      canvasRef,
      rendererRef,
      sceneRef,
    },
  }

  return (
    <PlayerContext value={contextValue}>
      <PlayerInternalContext value={internalValue}>
        <PlaybackContext value={playbackSource}>
          <AppearanceContext value={appearanceStore}>
            <div
              ref={containerRef}
              role="group"
              aria-label={ariaLabel}
              className={className}
              style={{ position: 'relative', ...style }}
            >
              <canvas ref={canvasRef} aria-hidden="true" />
              <div style={SR_ONLY}>
                {/* Children (Background, Video) render a11y content here:
                    - Video renders <video> element with aria-label + tabIndex={-1}
                    - Background renders <div role="img" aria-label="..."> */}
                {children}
                <div role="status" aria-live="polite" aria-atomic="true">
                  {announcement}
                </div>
              </div>
            </div>
          </AppearanceContext>
        </PlaybackContext>
      </PlayerInternalContext>
    </PlayerContext>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
