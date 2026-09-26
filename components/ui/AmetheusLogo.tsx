import React from "react";

interface AmetheusLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export default function AmetheusLogo({
  className = "h-8 w-auto",
  width = 172,
  height = 36,
}: AmetheusLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 172 36"
      role="img"
      aria-labelledby="ametheus-logo-title"
      width={width}
      height={height}
      className={className}
    >
      <title id="ametheus-logo-title">Ametheus</title>

      {/* Mark: 28×28 coordinate space, offset (2, 7.5) to center in 36px tall lockup */}
      <g transform="translate(2, 7.5)">
        <polygon points="3,8 25,8 27,3 5,3" fill="#FF4E3A" />
        <polygon points="7,16 21,16 23,11 9,11" fill="#FF4E3A" />
        <polygon points="11,24 17,24 19,19 13,19" fill="#FF4E3A" />
      </g>

      {/* Wordmark — white for primary dark-background use */}
      <text
        x="42"
        y="26"
        fill="#FFFFFF"
        fontFamily="Unbounded, Arial, sans-serif"
        fontSize="21"
        fontWeight="700"
        letterSpacing="-1.5"
      >
        AMETHEUS
      </text>
    </svg>
  );
}
