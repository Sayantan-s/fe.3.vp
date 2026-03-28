import { Children, isValidElement } from "react";

export function hasCanvasVideo(children: React.ReactNode) {
  let hasVideo = false;
  Children.forEach(children, (child) => {
    if (
      isValidElement(child) &&
      (child.type as any)?.displayName === "CanvasVideo"
    )
      hasVideo = true;
  });
  return hasVideo;
}
