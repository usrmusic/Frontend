"use client";
import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";

const PHONE = "(max-width: 639px)";

/* A <textarea> that, on a phone, grows to show all of its text — no inner
   scrolling and no dragging the resize handle to read a long entry. An
   empty or short box keeps its CSS min-height. Re-fits when the value
   changes (typing, or data arriving) and when the width changes (rotation),
   since that rewraps the text. From `sm` up it is an ordinary textarea. */
export default function AutoGrowTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia(PHONE);
    const fit = () => {
      if (!mq.matches) {
        el.style.height = "";
        return;
      }
      el.style.height = "auto";
      // border-box sizing: scrollHeight excludes the borders, so add them back.
      el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
    };
    fit();
    mq.addEventListener("change", fit);
    window.addEventListener("resize", fit);
    return () => {
      mq.removeEventListener("change", fit);
      window.removeEventListener("resize", fit);
    };
  }, [props.value]);

  return <textarea ref={ref} {...props} />;
}
