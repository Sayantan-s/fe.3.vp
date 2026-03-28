import { use } from "react";
import { PlayerInternalContext } from "./context";

export function usePlayerInternalCtx() {
  const internal = use(PlayerInternalContext);

  if (!internal) {
    throw new Error("usePlayerInternal must be used inside <Player.Canvas>");
  }

  return internal;
}
