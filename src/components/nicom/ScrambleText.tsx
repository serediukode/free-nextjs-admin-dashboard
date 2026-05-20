"use client";
import { useState, useEffect, useRef } from "react";

const CHARS = "АБВГДЕЖЗабвгдежз░▒▓0123456789#$%&*";

interface Props {
  text: string;
  className?: string;
  duration?: number;
}

export default function ScrambleText({ text, className, duration = 320 }: Props) {
  const [display, setDisplay] = useState(text);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function scramble() {
    if (timerRef.current) clearInterval(timerRef.current);
    let frame = 0;
    const total = Math.ceil(duration / 30);
    const len = text.length;
    timerRef.current = setInterval(() => {
      frame++;
      const settled = Math.floor(len * (frame / total));
      let out = "";
      for (let i = 0; i < len; i++) {
        if (i < settled || text[i] === " ") out += text[i];
        else out += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      setDisplay(out);
      if (frame >= total) {
        clearInterval(timerRef.current!);
        setDisplay(text);
      }
    }, 30);
  }

  function reset() {
    if (timerRef.current) clearInterval(timerRef.current);
    setDisplay(text);
  }

  useEffect(() => {
    setDisplay(text);
  }, [text]);

  return (
    <span
      className={className}
      onMouseEnter={() => scramble()}
      onMouseLeave={() => reset()}
    >
      {display}
    </span>
  );
}
