"use client";

import { createContext } from "react";
import type { PlaybackTimeStore } from "./store";

export const PlaybackTimeContext = createContext<PlaybackTimeStore | null>(null);
