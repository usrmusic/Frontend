"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src?: string | null;
  alt?: string;
  size?: number;
  initials?: string;
  className?: string;
};

export default function Avatar({
  src,
  alt = "avatar",
  size = 40,
  initials = "UM",
  className = "",
}: Props) {
  const [error, setError] = useState(false);

  // Normalize bare filenames (e.g. "human.jpg") to "/human.jpg"
  const resolvedSrc =
    src && !src.match(/^(data:|https?:\/\/|\/\/)/i) && !src.startsWith("/")
      ? `/${src}`
      : src;

  if (resolvedSrc && !error) {
    return (
      <Image
        src={resolvedSrc}
        alt={alt}
        width={size}
        height={size}
        // Tailwind's preflight sets `img { height: auto }` globally, which
        // overrides next/image's own height and let the box stretch to the
        // source photo's natural aspect ratio (a tall portrait photo
        // rendered as an oval/rectangle, not a circle). Explicit inline
        // dimensions win regardless of that rule; object-cover crops
        // non-square source photos instead of squashing them.
        style={{ width: size, height: size, objectFit: "cover" }}
        className={`rounded-full ${className}`}
        onError={() => setError(true)}
      />
    );
  }

  const fontSize = Math.max(12, Math.floor(size / 2.5));

  return (
    <div
      style={{ width: size, height: size }}
      className={`flex items-center justify-center rounded-full bg-black text-white ${className}`}
    >
      <span style={{ fontSize }}>{initials}</span>
    </div>
  );
}
