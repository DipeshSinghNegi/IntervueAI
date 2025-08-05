import { useEffect, useState } from "react";

type TypewriterProps = {
  text: string;
  speed?: number;
};

export const Typewriter = ({ text, speed = 30 }: TypewriterProps) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayedText}</span>;
};
