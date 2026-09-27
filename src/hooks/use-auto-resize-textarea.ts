"use client";

import { useEffect, type RefObject } from "react";

export function useAutoResizeTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string,
  maxHeight = 160,
) {
  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, maxHeight)}px`;
  }, [maxHeight, ref, value]);
}
