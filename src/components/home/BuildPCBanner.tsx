"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRef, type PointerEvent } from "react";
import {
  ArrowRight,
  CircuitBoard,
  Cpu,
  MemoryStick,
  Microchip,
} from "lucide-react";

function BuildPCShowcase() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (
      !scene ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    scene.dataset.motionReady = "true";
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          scene.dataset.visible = "true";
          observer.unobserve(scene);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px 60px 0px" }
    );

    observer.observe(scene);
    return () => observer.disconnect();
  }, []);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const scene = sceneRef.current;
    if (
      !scene ||
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;

    scene.style.setProperty("--buildpc-tilt-x", `${pointerY * -3}deg`);
    scene.style.setProperty("--buildpc-tilt-y", `${pointerX * 5}deg`);
    scene.style.setProperty("--buildpc-shift-x", `${pointerX * 10}px`);
    scene.style.setProperty("--buildpc-shift-y", `${pointerY * 8}px`);
  };

  const resetPointer = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    scene.style.setProperty("--buildpc-tilt-x", "0deg");
    scene.style.setProperty("--buildpc-tilt-y", "0deg");
    scene.style.setProperty("--buildpc-shift-x", "0px");
    scene.style.setProperty("--buildpc-shift-y", "0px");
  };

  return (
    <div
      ref={sceneRef}
      className="buildpc-stage"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <figure className="buildpc-stage__artwork">
        <Image
          src="/banners/build%20your%20pc.png"
          alt="Exploded custom PC build with a graphics card, motherboard, processor, memory, and cooling system"
          fill
          sizes="(max-width: 767px) 65vw, 620px"
          className="buildpc-stage__image"
        />
        <ul className="buildpc-stage__labels" aria-label="PC parts in the build">
          <li className="buildpc-stage__callout buildpc-stage__callout--gpu">
            <span className="buildpc-stage__marker"><Microchip size={13} /></span>
            <span className="buildpc-stage__label">
              <strong>GPU</strong>
              <small>Graphics card</small>
            </span>
          </li>
          <li className="buildpc-stage__callout buildpc-stage__callout--cpu">
            <span className="buildpc-stage__marker"><Cpu size={13} /></span>
            <span className="buildpc-stage__label">
              <strong>CPU</strong>
              <small>Processor</small>
            </span>
          </li>
          <li className="buildpc-stage__callout buildpc-stage__callout--ram">
            <span className="buildpc-stage__marker"><MemoryStick size={13} /></span>
            <span className="buildpc-stage__label">
              <strong>RAM</strong>
              <small>Memory</small>
            </span>
          </li>
          <li className="buildpc-stage__callout buildpc-stage__callout--motherboard">
            <span className="buildpc-stage__marker"><CircuitBoard size={13} /></span>
            <span className="buildpc-stage__label">
              <strong>Motherboard</strong>
              <small>System board</small>
            </span>
          </li>
        </ul>
      </figure>
      <div className="buildpc-stage__atmosphere" aria-hidden="true" />
      <div className="buildpc-stage__content">
        <p>Custom PC builder</p>
        <h2>
          Build your
          <br />
          <span>dream PC.</span>
        </h2>
        <p className="buildpc-stage__description">
          Choose your components and create a setup that is truly yours.
        </p>
        <Link href="/shop" className="buildpc-stage__action">
          Explore PC parts <ArrowRight size={14} />
        </Link>
      </div>
      <aside className="buildpc-stage__panel">
        <p className="buildpc-stage__panel-eyebrow">Your next setup</p>
        <h3>Built around you.</h3>
        <ol>
          <li><span>01</span> Choose your components</li>
          <li><span>02</span> Find your perfect upgrade</li>
          <li><span>03</span> Shop trusted PC parts</li>
        </ol>
        <Link href="/shop" className="buildpc-stage__panel-link">
          Browse components <ArrowRight size={13} />
        </Link>
      </aside>
      <div className="buildpc-stage__frame" aria-hidden="true">
        <span>PRIMEZORA / PERFORMANCE SYSTEMS</span>
        <span>BUILD / UPGRADE / PLAY</span>
      </div>
    </div>
  );
}

export default function BuildPCBanner() {
  return (
    <section
      aria-label="Build your dream PC"
      className="scroll-reveal relative overflow-hidden border-y border-white/10 bg-[#030505] py-6 sm:py-8"
    >
      <div className="container-primezora">
        <BuildPCShowcase />
      </div>
    </section>
  );
}
