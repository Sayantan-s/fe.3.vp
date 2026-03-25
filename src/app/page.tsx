'use client'

import dynamic from 'next/dynamic'

const PlayerDemo = dynamic(() => import('./player-demo'), { ssr: false })

export default function Home() {
  return <PlayerDemo />
}
