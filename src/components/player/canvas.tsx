"use client";

import {
  useEffect,
  useRef,
  useState,
  Children,
  isValidElement,
  type CSSProperties,
} from "react";
import {
  WebGLRenderer,
  Scene,
  OrthographicCamera,
  Mesh,
  PlaneGeometry,
} from "three";
import {
  PlayerContext,
  PlayerInternalContext,
  PlaybackContext,
  AppearanceContext,
} from "./context";
import { createAppearanceStore } from "./appearance-store";
import type {
  PlayerCanvasProps,
  PlayerState,
  PlayerInternalContextValue,
  PlaybackSource,
  PlaybackState,
  VideoAppearanceStore,
  VideoAppearance,
} from "./types";

const SR_ONLY: CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  borderWidth: 0,
};

export function PlayerCanvas(props: PlayerCanvasProps) {
  const {
    "aria-label": ariaLabel,
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
  } = props;

  // Refs for Three.js
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<OrthographicCamera | null>(null);
  const animFrameRef = useRef<number>(0);
  const meshesRef = useRef<Map<string, { mesh: Mesh; zIndex: number }>>(
    new Map(),
  );

  // Playback source registered by Video child
  const [playbackSource, setPlaybackSource] = useState<PlaybackSource | null>(
    null,
  );

  // Appearance store
  const [appearanceStore] = useState(() =>
    createAppearanceStore({ defaultPadding, defaultRounding }),
  );

  // --- Validate children (pure render-time derivation) ---
  let hasVideo = false;
  Children.forEach(children, (child) => {
    if (
      isValidElement(child) &&
      (child.type as any)?.displayName === "CanvasVideo"
    ) {
      hasVideo = true;
    }
  });
  const missingVideo = !hasVideo;

  // Player state
  const [playerState, setPlayerState] = useState<PlayerState>(() => ({
    isReady: false,
    error: missingVideo
      ? new Error(
          "Player.Canvas requires at least one <Player.Canvas.Video> child",
        )
      : null,
  }));

  // Announcement for a11y
  const [announcement, setAnnouncement] = useState("");

  // Fire onError for validation failures (side effect → useEffect)
  useEffect(() => {
    if (missingVideo) {
      onError?.(
        new Error(
          "Player.Canvas requires at least one <Player.Canvas.Video> child",
        ),
      );
    }
  }, [missingVideo]);

  // --- Internal context (stable ref to avoid infinite re-render loops) ---
  // Children effects depend on the internal context value. If this object changes
  // identity every render, child effects cleanup/re-run, which call setState on
  // Canvas, causing another render → infinite loop. Using a ref-backed object
  // ensures stable identity while the closures inside always read latest state.

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  // Bridge between stable context methods and the Three.js effect.
  // The effect sets this to a function that resizes + renders.
  const requestResizeRef = useRef<(() => void) | null>(null);

  const internalRef = useRef<PlayerInternalContextValue>(null);
  if (internalRef.current === null) {
    internalRef.current = {
      registerMesh(id: string, mesh: Mesh, zIndex: number) {
        mesh.position.z = zIndex;
        meshesRef.current.set(id, { mesh, zIndex });
        sceneRef.current?.add(mesh);
        // Trigger resize so the new mesh gets properly sized and rendered
        requestResizeRef.current?.();
      },
      unregisterMesh(id: string) {
        const entry = meshesRef.current.get(id);
        if (entry) {
          sceneRef.current?.remove(entry.mesh);
          meshesRef.current.delete(id);
        }
      },
      registerPlayback(source: PlaybackSource) {
        setPlaybackSource(source);
        setPlayerState((prev) => ({ ...prev, isReady: true }));
        onReadyRef.current?.();
        setAnnouncement("Video ready");
      },
      unregisterPlayback() {
        setPlaybackSource(null);
        setPlayerState((prev) => ({ ...prev, isReady: false }));
      },
      registerAppearance(_store: VideoAppearanceStore) {},
      unregisterAppearance() {},
      reportError(error: Error) {
        setPlayerState((prev) => ({ ...prev, error }));
        onErrorRef.current?.(error);
        setAnnouncement(`Error: ${error.message}`);
      },
      clearError() {
        setPlayerState((prev) => ({ ...prev, error: null }));
      },
    };
  }
  const internalValue = internalRef.current;

  // --- Sync controlled playback props ---

  useEffect(() => {
    if (playbackSource) {
      playbackSource.syncControlled({
        playing,
        currentTime,
        volume,
        muted,
        playbackRate,
      });
    }
  }, [playbackSource, playing, currentTime, volume, muted, playbackRate]);

  // --- Sync controlled appearance props ---

  useEffect(() => {
    appearanceStore.syncControlled({
      padding: controlledPadding,
      rounding: controlledRounding,
    });
  }, [appearanceStore, controlledPadding, controlledRounding]);

  // --- Subscribe to playback events for callbacks ---

  useEffect(() => {
    if (!playbackSource) return;

    let prevState: PlaybackState = playbackSource.getState();

    const unsub = playbackSource.subscribe(() => {
      const next = playbackSource.getState();

      if (!prevState.isPlaying && next.isPlaying) {
        onPlay?.();
        setAnnouncement("Playing");
      }
      if (prevState.isPlaying && !next.isPlaying && !next.isEnded) {
        onPause?.();
        setAnnouncement(`Paused at ${formatTime(next.currentTime)}`);
      }
      if (!prevState.isEnded && next.isEnded) {
        onEnded?.();
        setAnnouncement("Video ended");
      }
      if (prevState.currentTime !== next.currentTime) {
        onTimeUpdate?.(next.currentTime);
      }
      if (prevState.duration !== next.duration) {
        onDurationChange?.(next.duration);
      }
      if (!prevState.isSeeking && next.isSeeking) {
        onSeeking?.();
      }
      if (prevState.isSeeking && !next.isSeeking) {
        onSeeked?.();
      }
      if (!prevState.isBuffering && next.isBuffering) {
        onBuffering?.();
        setAnnouncement("Buffering");
      }
      if (
        prevState.volume !== next.volume ||
        prevState.isMuted !== next.isMuted
      ) {
        onVolumeChange?.(next.volume, next.isMuted);
      }

      prevState = next;
    });

    return unsub;
  }, [playbackSource]);

  // --- Subscribe to appearance changes for callbacks ---

  useEffect(() => {
    let prev: VideoAppearance = appearanceStore.getAppearance();

    const unsub = appearanceStore.subscribe(() => {
      const next = appearanceStore.getAppearance();
      if (prev.padding !== next.padding) {
        onPaddingChange?.(next.padding);
      }
      if (prev.rounding !== next.rounding) {
        onRoundingChange?.(next.rounding);
      }
      prev = next;
    });

    return unsub;
  }, [appearanceStore]);

  // --- Three.js setup ---

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;

    const scene = new Scene();
    sceneRef.current = scene;

    // OrthographicCamera(left, right, top, bottom, near, far)
    // top > bottom for standard screen-space (Y=0 at bottom)
    const camera = new OrthographicCamera(0, 1, 1, 0, 0.1, 1000);
    camera.position.z = 10;
    cameraRef.current = camera;

    // Resize handler
    function resize() {
      const { clientWidth: w, clientHeight: h } = container!;
      if (w === 0 || h === 0) return;

      renderer.setSize(w, h);
      camera.left = 0;
      camera.right = w;
      camera.top = h;
      camera.bottom = 0;
      camera.updateProjectionMatrix();

      updateMeshSizes(w, h);
      renderer.render(scene, camera);
    }

    function updateMeshSizes(w: number, h: number) {
      const appearance = appearanceStore.getAppearance();

      for (const [id, { mesh }] of meshesRef.current) {
        if (id === "background") {
          mesh.geometry.dispose();
          mesh.geometry = new PlaneGeometry(w, h);
          mesh.position.set(w / 2, h / 2, 0);
        } else if (id === "video") {
          const pad = (appearance.padding / 100) * Math.min(w, h);
          const vw = w - pad * 2;
          const vh = h - pad * 2;
          mesh.geometry.dispose();
          mesh.geometry = new PlaneGeometry(vw, vh);
          mesh.position.set(w / 2, h / 2, 1);

          const mat = mesh.material as import("three").ShaderMaterial;
          if (mat.uniforms) {
            mat.uniforms.resolution.value.set(vw, vh);
            mat.uniforms.radius.value =
              (appearance.rounding / 100) * Math.min(vw, vh) * 0.5;
          }
        }
      }
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    // Allow registerMesh to trigger a resize + render for newly added meshes
    requestResizeRef.current = resize;

    // Appearance change → update meshes
    const unsubAppearance = appearanceStore.subscribe(() => {
      const { clientWidth: w, clientHeight: h } = container!;
      updateMeshSizes(w, h);
      renderer.render(scene, camera);
    });

    // Render loop — always runs. VideoTexture needs continuous rendering
    // to display new video frames. Cost is negligible (two quads on GPU).
    let running = true;

    function animate() {
      if (!running) return;
      animFrameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }

    animate();

    // WebGL context loss
    function onContextLost(e: Event) {
      e.preventDefault();
      running = false;
      cancelAnimationFrame(animFrameRef.current);
      internalValue.reportError(new Error("WebGL context lost"));
    }

    function onContextRestored() {
      // Recreate renderer after context restore
      renderer.dispose();
      const newRenderer = new WebGLRenderer({
        canvas: canvas!,
        alpha: true,
        antialias: true,
      });
      newRenderer.setPixelRatio(window.devicePixelRatio);
      rendererRef.current = newRenderer;

      running = true;
      resize();
      animate();
      internalValue.clearError();
    }

    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      unsubAppearance();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      renderer.dispose();
      requestResizeRef.current = null;
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [appearanceStore]);

  // --- Public context ---

  const contextValue = {
    state: playerState,
    meta: {
      canvasRef,
      rendererRef,
      sceneRef,
    },
  };

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
              style={{ position: "relative", ...style }}
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
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
