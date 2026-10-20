"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { target: 2, suffix: "+", label: "Years of Experience" },
  { target: 50, suffix: "+", label: "Happy Customers" },
  { target: 100, suffix: "+", label: "Products & Accessories" },
  { target: 100, suffix: "%", label: "Genuine Brands" },
];

export function AnimatedStats() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState(() => stats.map(({ target }) => target));

  useEffect(() => {
    const container = containerRef.current;
    if (
      !container ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    let animationFrameId = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        observer.unobserve(container);
        const duration = 1400;
        const startTime = performance.now();
        setCounts(stats.map(() => 0));

        const animate = (time: number) => {
          const progress = Math.min((time - startTime) / duration, 1);
          const easedProgress = 1 - (1 - progress) ** 3;
          setCounts(
            stats.map(({ target }) => Math.floor(target * easedProgress))
          );

          if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate);
          }
        };

        animationFrameId = requestAnimationFrame(animate);
        observer.disconnect();
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="container-primezora grid grid-cols-2 gap-4 sm:grid-cols-4"
    >
      {stats.map((stat, index) => (
        <div key={stat.label} className="text-center">
          <p
            aria-label={`${stat.target}${stat.suffix} ${stat.label}`}
            className="font-display text-2xl font-bold text-orange-500 sm:text-3xl"
          >
            {counts[index]}
            {stat.suffix}
          </p>
          <p className="mt-1 text-[8px] text-white/65 sm:text-[9px]">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
