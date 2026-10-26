"use client";

import { useEffect } from "react";

export function ScrollMotion() {
  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          const element = entry.target as HTMLElement;
          element.dataset.motionVisible = "true";
          observer.unobserve(element);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -7% 0px" }
    );

    const observeElement = (element: HTMLElement) => {
      const staggerGroup = element.parentElement;
      if (staggerGroup?.hasAttribute("data-motion-stagger")) {
        const index = Array.from(staggerGroup.children).indexOf(element);
        element.style.setProperty(
          "--motion-delay",
          `${Math.min(index * 75, 420)}ms`
        );
      }
      observer.observe(element);
    };

    const revealSelector = "[data-motion-reveal], main > section";
    const observeRevealElements = (node: ParentNode) => {
      if (node instanceof HTMLElement && node.matches(revealSelector)) {
        node.dataset.motionReveal = "";
        observeElement(node);
      }

      node.querySelectorAll<HTMLElement>(revealSelector).forEach((element) => {
        element.dataset.motionReveal = "";
        observeElement(element);
      });
    };

    observeRevealElements(document);
    root.dataset.motionReady = "true";

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) observeRevealElements(node);
        });
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
      delete root.dataset.motionReady;
    };
  }, []);

  return null;
}

export function PointerTilt() {
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(hover: none)").matches
    ) {
      return;
    }

    let activeCard: HTMLElement | null = null;
    const resetCard = (card: HTMLElement) => {
      card.style.setProperty("--card-tilt-x", "0deg");
      card.style.setProperty("--card-tilt-y", "0deg");
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target;
      const card =
        target instanceof Element
          ? target.closest<HTMLElement>("[data-tilt-card]")
          : null;

      if (activeCard && activeCard !== card) resetCard(activeCard);
      activeCard = card;
      if (!card) return;

      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.setProperty("--card-tilt-x", `${y * -5}deg`);
      card.style.setProperty("--card-tilt-y", `${x * 6}deg`);
    };

    const resetActiveCard = () => {
      if (activeCard) resetCard(activeCard);
      activeCard = null;
    };

    document.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("blur", resetActiveCard);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetActiveCard);
      resetActiveCard();
    };
  }, []);

  return null;
}

export function PointerSpotlight() {
  useEffect(() => {
    const element = document.querySelector<HTMLElement>(".home-pointer-spotlight");
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frame = 0;
    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;

      const bounds = element.parentElement?.getBoundingClientRect();
      if (
        !bounds ||
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) {
        cancelAnimationFrame(frame);
        element.dataset.active = "false";
        return;
      }

      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        element.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
        element.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
        element.dataset.active = "true";
      });
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return <div aria-hidden="true" className="home-pointer-spotlight" />;
}
