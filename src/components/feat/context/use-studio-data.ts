"use client";

import { useEffect, useState } from "react";

interface VideoApiResponse {
  id: string;
  videoUrl: string;
  config: {
    bg: number;
    padding: number;
    rounding: number;
  };
}

interface TranscriptApiResponse {
  id: string;
  transcript: {
    text: string;
    words: Array<{
      text: string;
      start: number;
      end: number;
      type: "word" | "spacing";
      logprob?: number;
    }>;
  };
}

export interface StudioData {
  videoData: VideoApiResponse | null;
  transcriptData: TranscriptApiResponse | null;
  videoError: string | null;
  transcriptError: string | null;
  isLoading: boolean;
}

const INITIAL_STATE: StudioData = {
  videoData: null,
  transcriptData: null,
  videoError: null,
  transcriptError: null,
  isLoading: true,
};

export function useStudioData(videoId: string): StudioData {
  const [state, setState] = useState<StudioData>(INITIAL_STATE);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    setState(INITIAL_STATE);

    (async () => {
      const results = await Promise.allSettled([
        fetch(`/api/video/${videoId}`, { signal }),
        fetch(`/api/video/${videoId}/transcript`, { signal }),
      ]);

      if (signal.aborted) return;

      const [videoResult, transcriptResult] = results;

      let videoData: VideoApiResponse | null = null;
      let videoError: string | null = null;
      if (videoResult.status === "fulfilled") {
        if (videoResult.value.ok) {
          videoData = await videoResult.value.json();
        } else {
          videoError = `Video fetch failed: ${videoResult.value.status}`;
        }
      } else {
        videoError = videoResult.reason?.message ?? "Video fetch failed";
      }

      let transcriptData: TranscriptApiResponse | null = null;
      let transcriptError: string | null = null;
      if (transcriptResult.status === "fulfilled") {
        if (transcriptResult.value.ok) {
          transcriptData = await transcriptResult.value.json();
        } else {
          transcriptError = `Transcript fetch failed: ${transcriptResult.value.status}`;
        }
      } else {
        transcriptError =
          transcriptResult.reason?.message ?? "Transcript fetch failed";
      }

      if (signal.aborted) return;

      setState({
        videoData,
        transcriptData,
        videoError,
        transcriptError,
        isLoading: false,
      });
    })();

    return () => controller.abort();
  }, [videoId]);

  return state;
}
