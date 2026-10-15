"use client";
import { useRouter } from "next/navigation";
import { BackButton } from "@/src/components/Icons";

/* Every page's ← does exactly what the browser / phone back button does: one
   page back. Only a page opened in a brand-new tab (no history at all) has
   nothing to go back to, so it goes to the Dashboard instead of doing
   nothing. */
export default function BackLink({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label="Go back"
      className={`shrink-0 ${className}`}
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/dashboard");
      }}
    >
      <BackButton />
    </button>
  );
}
