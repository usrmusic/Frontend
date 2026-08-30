"use client";
import { useEffect, useState } from "react";

// Real conditional mount (not a max-height collapse) still needs to actually
// unmount once its exit animation finishes, or it'd either snap away with no
// close animation or leave a residual gap while "closed" but still in the DOM.
export default function AnimatedMount({
  show,
  className = "",
  children,
}: {
  show: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(show);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      setClosing(false);
    } else if (mounted) {
      setClosing(true);
    }
  }, [show, mounted]);

  if (!mounted) return null;

  return (
    <div
      className={`${closing ? "animate-box-disappear" : "animate-box-appear"} ${className}`}
      onAnimationEnd={() => {
        if (closing) {
          setMounted(false);
          setClosing(false);
        }
      }}
    >
      {children}
    </div>
  );
}
