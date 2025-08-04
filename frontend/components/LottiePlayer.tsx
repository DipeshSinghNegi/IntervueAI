"use client";

import { useEffect, useRef } from "react";
import lottie from "lottie-web";
import animationData from "@/data/confetti.json";

const LottiePlayer = ({ loop = false }: { loop?: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const instance = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop,
        autoplay: true,
        animationData,
      });

      return () => instance.destroy();
    }
  }, [loop]);

  return <div style={{ width: 400, height: 200 }} ref={containerRef} />;
};

export default LottiePlayer;
