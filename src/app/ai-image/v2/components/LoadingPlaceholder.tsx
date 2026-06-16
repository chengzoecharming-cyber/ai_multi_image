"use client";

import { useId } from "react";

interface LoadingPlaceholderProps {
  width?: number;
  height?: number;
  className?: string;
}

export function LoadingPlaceholder({
  width = 121,
  height = 121,
  className = "",
}: LoadingPlaceholderProps) {
  const id = useId();
  const baseId = id.replace(/:/g, "_");
  const clipId = `clip_${baseId}`;

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        viewBox="0 0 121 121"
        fill="none"
        className={className}
      >
        <g clipPath={`url(#${clipId})`}>
          <circle cx="37" cy="33" r="49" fill="#00FFC8" />
          <circle cx="34" cy="95" r="43" fill="#9D3BBE" />
          <circle cx="123" cy="51" r="63" fill="#E8F6A1" />
        </g>
        <defs>
          <clipPath id={clipId}>
            <rect width="121" height="121" fill="white" />
          </clipPath>
        </defs>
      </svg>
      {/* Overlay: white semi-transparent + background blur on top of the pattern */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(255, 255, 255, 0.70)",
          backdropFilter: "blur(24.65px)",
        }}
      />
    </div>
  );
}
