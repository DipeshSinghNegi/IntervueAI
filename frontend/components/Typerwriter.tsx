import { useEffect, useState, useRef } from "react";

type TypewriterProps = {
  text: string;
  speed?: number;
};

export const Typewriter = ({ text, speed = 30 }: TypewriterProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    // If text shrinks, reset
    if (text.length < displayedText.length) {
      setDisplayedText(text);
      indexRef.current = text.length;
      return;
    }

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText(text.slice(0, indexRef.current + 1)); // slice instead of +=
        indexRef.current++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayedText}</span>;
};
