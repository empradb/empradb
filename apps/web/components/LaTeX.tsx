"use client";

import { useEffect, useRef } from "react";

interface LaTeXProps {
  children: string;
  displayMode?: boolean;
  className?: string;
}

export default function LaTeX({ children, displayMode = false, className = "" }: LaTeXProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && containerRef.current) {
      import("katex").then((katex) => {
        try {
          katex.default.render(children, containerRef.current!, {
            displayMode,
            throwOnError: false,
            trust: true,
            macros: {
              "\\R": "\\mathbb{R}",
              "\\N": "\\mathbb{N}",
              "\\Z": "\\mathbb{Z}",
              "\\Q": "\\mathbb{Q}",
              "\\C": "\\mathbb{C}",
            },
          });
        } catch (error) {
          console.error("LaTeX rendering error:", error);
          if (containerRef.current) {
            containerRef.current.textContent = children;
          }
        }
      });
    }
  }, [children, displayMode]);

  return (
    <span
      ref={containerRef}
      className={`${displayMode ? "block my-4" : "inline"} ${className}`}
    />
  );
}

export function LaTeXBlock({ children, className = "" }: { children: string; className?: string }) {
  return <LaTeX displayMode={true} className={className}>{children}</LaTeX>;
}

export function LaTeXInline({ children, className = "" }: { children: string; className?: string }) {
  return <LaTeX displayMode={false} className={className}>{children}</LaTeX>;
}
