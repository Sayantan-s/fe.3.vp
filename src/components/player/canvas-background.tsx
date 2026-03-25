'use client'

import { useEffect, useRef, use } from 'react'
import {
  TextureLoader,
  PlaneGeometry,
  MeshBasicMaterial,
  Mesh,
  type Texture,
} from 'three'
import { PlayerInternalContext } from './context'
import type { CanvasBackgroundProps } from './types'

const LAYER_ID = 'background'
const Z_INDEX = 0

export function CanvasBackground({ backgroundSrc, 'aria-label': ariaLabel }: CanvasBackgroundProps) {
  const internal = use(PlayerInternalContext)

  if (!internal) {
    throw new Error('Player.Canvas.Background must be used inside <Player.Canvas>')
  }

  const meshRef = useRef<Mesh | null>(null)
  const textureRef = useRef<Texture | null>(null)

  useEffect(() => {
    const loader = new TextureLoader()
    let disposed = false

    loader.load(
      backgroundSrc,
      (texture) => {
        if (disposed) {
          texture.dispose()
          return
        }

        textureRef.current = texture

        const geometry = new PlaneGeometry(1, 1)
        const material = new MeshBasicMaterial({ map: texture })
        const mesh = new Mesh(geometry, material)

        meshRef.current = mesh
        internal.registerMesh(LAYER_ID, mesh, Z_INDEX)
      },
      undefined,
      () => {
        if (!disposed) {
          internal.reportError(new Error(`Failed to load background image: ${backgroundSrc}`))
        }
      },
    )

    return () => {
      disposed = true
      internal.unregisterMesh(LAYER_ID)

      if (meshRef.current) {
        meshRef.current.geometry.dispose()
        ;(meshRef.current.material as MeshBasicMaterial).dispose()
        meshRef.current = null
      }

      if (textureRef.current) {
        textureRef.current.dispose()
        textureRef.current = null
      }
    }
  }, [backgroundSrc, internal])

  // Render in sr-only region (not display:none — that hides from AT)
  return ariaLabel ? (
    <div role="img" aria-label={ariaLabel} />
  ) : null
}

CanvasBackground.displayName = 'CanvasBackground'
