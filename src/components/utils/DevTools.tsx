"use client";

import Script from "next/script";
import { Fragment } from "react";

export const DevTools = () => {
  return (
    <Fragment>
      <Script
        src="//unpkg.com/react-scan/dist/auto.global.js"
        crossOrigin="anonymous"
        strategy="beforeInteractive"
        defer
      />
    </Fragment>
  );
};
