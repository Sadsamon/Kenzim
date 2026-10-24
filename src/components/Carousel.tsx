"use client";
import { Children, useCallback, useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  aspect?: string; // Tailwind aspect class, e.g. "aspect-[16/10]"
  intervalMs?: number;
  className?: string;
};

// Swipeable photo carousel: native scroll-snap swiping, slow zoom on the active photo,
// auto-advance while on screen, and a pause after the viewer touches it.
export default function Carousel({ children, aspect = "aspect-[4/3]", intervalMs = 4500, className = "" }: Props) {
  const slides = Children.toArray(children);
  const n = slides.length;
  const ref = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const pausedUntil = useRef(0);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const goTo = useCallback((i: number) => {
    const el = ref.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (n < 2 || !visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      const el = ref.current;
      if (!el) return;
      goTo((Math.round(el.scrollLeft / el.clientWidth) + 1) % n);
    }, intervalMs);
    return () => clearInterval(t);
  }, [n, visible, intervalMs, goTo]);

  const pause = () => {
    pausedUntil.current = Date.now() + 8000;
  };

  if (n === 0) return null;

  return (
    <div ref={box} className={`relative ${className}`}>
      <div
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        onTouchStart={pause}
        onPointerDown={pause}
        onWheel={pause}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`${aspect} w-full shrink-0 snap-center overflow-hidden [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:transition-transform [&_img]:duration-[6000ms] [&_img]:ease-out ${
              i === index ? "[&_img]:scale-[1.07]" : "[&_img]:scale-100"
            }`}
          >
            {slide}
          </div>
        ))}
      </div>
      {n > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center">
          <div className="pointer-events-auto flex items-center rounded-full bg-ink/30 px-1 backdrop-blur-sm">
            {slides.map((_, i) => (
              <button key={i} onClick={() => { pause(); goTo(i); }} aria-label={`Photo ${i + 1} of ${n}`} className="p-2">
                <span className={`block h-2 rounded-full bg-white transition-all duration-300 ${i === index ? "w-6" : "w-2 opacity-60"}`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
