import { use } from "react";
import { PlayerContext } from "./context";

export function usePlayerCtx() {
  const internal = use(PlayerContext);

  if (!internal) {
    throw new Error("usePlayerCtx must be used inside <Player.Canvas>");
  }

  return internal;
}
