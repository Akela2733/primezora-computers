"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRef, type PointerEvent } from "react";
import {
  ArrowRight,
  Bolt,
  Cpu,
  Gamepad2,
  Headphones,
  Monitor,
  ShieldCheck,
  Wallet,
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
    <>
      <div
        ref={sceneRef}
        className="buildpc-stage"
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
      >
        <figure className="buildpc-stage__artwork">
          <Image
            src="/banners/build%20your%20pc.png"
            alt="Custom gaming PC with glowing orange fans and components"
            fill
            sizes="(max-width: 767px) 100vw, (max-width: 1023px) 70vw, 58vw"
            className="buildpc-stage__image"
          />
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
            Choose your parts, make it your own, and get ready to play.
          </p>
          <div className="buildpc-stage__actions">
            <Link href="/shop" className="primezora-button buildpc-stage__action">
              <span>Start building</span>
              <span className="primezora-button__icon">
                <ArrowRight size={13} />
              </span>
            </Link>
            <Link href="/shop" className="buildpc-stage__secondary-action">
              Explore parts <ArrowRight size={14} />
            </Link>
          </div>
          <ul className="buildpc-stage__benefits" aria-label="Why shop with Primezora">
            <li><Bolt size={16} /><span>Great performance<small>Parts for every setup</small></span></li>
            <li><ShieldCheck size={16} /><span>Genuine parts<small>Shop with confidence</small></span></li>
            <li><Headphones size={16} /><span>Need a hand?<small>We’re here to help</small></span></li>
          </ul>
        </div>
        <figure className="buildpc-stage__hanging">
          <Image
            src="/banners/wall%20hanging.png"
            alt="Build Your PC hanging sign showing the three steps to start a build"
            width={517}
            height={425}
            sizes="(max-width: 767px) 75vw, (max-width: 1023px) 36vw, 30vw"
            className="buildpc-stage__hanging-image"
          />
        </figure>
      </div>
      <section className="buildpc-popular" aria-label="Popular PC builds">
        <div className="buildpc-popular__heading">
          <h3>Popular builds</h3>
          <span aria-hidden="true" />
        </div>
        <div className="buildpc-popular__grid">
          <Link href="/shop" className="buildpc-popular__card">
            <Gamepad2 size={26} />
            <span><strong>Gaming</strong><small>High FPS. No limits.</small></span>
            <ArrowRight size={17} />
          </Link>
          <Link href="/shop" className="buildpc-popular__card">
            <Monitor size={26} />
            <span><strong>Creator</strong><small>Edit. Design. Create.</small></span>
            <ArrowRight size={17} />
          </Link>
          <Link href="/shop" className="buildpc-popular__card">
            <Cpu size={26} />
            <span><strong>Workstation</strong><small>Power through work.</small></span>
            <ArrowRight size={17} />
          </Link>
          <Link href="/shop" className="buildpc-popular__card">
            <Wallet size={26} />
            <span><strong>Budget</strong><small>Good parts. Great value.</small></span>
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </>
  );
}

export default function BuildPCBanner() {
  return (
    <section
      aria-label="Build your dream PC"
      data-motion-reveal
      className="relative overflow-hidden border-y border-white/10 bg-[#030505] py-6 sm:py-8"
    >
      <div className="container-primezora">
        <BuildPCShowcase />
      </div>
    </section>
  );
}
