"use client";

import { useState } from "react";

type PlayerImageProps = {
  src?: string;
  alt: string;
};

export default function PlayerImage({ src, alt }: PlayerImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: 280,
          backgroundImage: 'url("/images/backgrounds/orangeball-hero-bg.png")',
          backgroundSize: "cover",
          backgroundPosition: "right bottom",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#f8f8f6",
        }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        objectPosition: "center top",
        display: "block",
      }}
      onError={() => setHasError(true)}
    />
  );
}
