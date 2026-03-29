"use client";

import styles from "../feat.module.css";
import { useStudioData } from "./use-studio-data";
import { VideoDataProvider } from "./video-data/provider";
import { TranscriptProvider } from "./transcript/provider";

interface StudioProviderProps {
  videoId: string;
  children: React.ReactNode;
}

export function StudioProvider({ videoId, children }: StudioProviderProps) {
  const { videoData, transcriptData, videoError, transcriptError, isLoading } =
    useStudioData(videoId);

  return (
    <VideoDataProvider
      initialData={
        videoData
          ? {
              videoUrl: videoData.videoUrl,
              bg: "/sample-bg.jpg",
              padding: videoData.config.padding,
              rounding: videoData.config.rounding,
            }
          : null
      }
      error={videoError}
      isLoading={isLoading}
    >
      <TranscriptProvider
        initialData={transcriptData}
        error={transcriptError}
        isLoading={isLoading}
      >
        <main className={styles.root}>{children}</main>
      </TranscriptProvider>
    </VideoDataProvider>
  );
}
