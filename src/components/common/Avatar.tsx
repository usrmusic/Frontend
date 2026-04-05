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

  if (src && !error) {
    return (
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
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
