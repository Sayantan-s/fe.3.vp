"/video/";

import { createContext, useState } from "react";
import styles from "../feat.module.css";

// api -> /video/{id}
const MOCK = {
  id: "test-d-123",
  videoUrl: "/video.mp4",
  config: {
    bg: 10,
    padding: 10,
    rounding: 10,
  },
};

// api -> /video/{id}/transcript
// return the transcript from .data/transcript.json

export const PlayerStudioContext = createContext(null);

export const PlayerStudioProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [videoData, setVideoData] = useState(MOCK);
  return (
    <PlayerStudioContext.Provider value={null}>
      <main className={styles.root}>{children}</main>
    </PlayerStudioContext.Provider>
  );
};
