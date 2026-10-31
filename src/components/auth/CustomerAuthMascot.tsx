"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Sparkles, Zap } from "lucide-react";
import styles from "./CustomerAuthMascot.module.css";

export type CustomerAuthMascotState =
  | "welcome"
  | "name"
  | "email"
  | "email-entered"
  | "password"
  | "confirm-password"
  | "success"
  | "error";

type CustomerAuthMascotProps = {
  flow: "login" | "register";
  state: CustomerAuthMascotState;
  loading?: boolean;
};

const mascotBasePath = "/mascot/";

const mascotAssets = {
  welcome: {
    src: `${mascotBasePath}Friendly_Mascot_with_Email_Bubble-removebg-preview (1).png`,
    alt: "PrimeZora mascot pointing to an email speech bubble",
    hasSpeechBubble: true,
  },
  email: {
    src: `${mascotBasePath}Friendly_Mascot_with_Email_Bubble-removebg-preview (1).png`,
    alt: "PrimeZora mascot ready to help with your email",
    hasSpeechBubble: true,
  },
  password: {
    src: "/mascot/Playful_Secret_Keeper_Mascot-removebg-preview.png",
    alt: "PrimeZora mascot covering his eyes",
  },
  success: {
    src: "/mascot/Cheerful_PrimeZora_Victory_Mascot-removebg-preview.png",
    alt: "PrimeZora mascot celebrating",
    hasSpeechBubble: true,
  },
  error: {
    src: "/mascot/Oops__Incorrect_Login_Mascot-removebg-preview.png",
    alt: "PrimeZora mascot making a friendly oops expression",
  },
} as const;

const messages = {
  login: {
    welcome: "Hey there! Ready to power up? ⚡",
    name: "Nice to meet you!",
    email: "What's your email, friend? 📩",
    "email-entered": "Looking good! Let's keep going.",
    password: "Psst... your secret is safe with me! 🙈",
    "confirm-password": "Your secret is safe with me! 🙈",
    success: "You're in! Let's go! 🚀",
    error: "Email or password incorrect. Let's try again!",
  },
  register: {
    welcome: "Hey there! Ready to power up? ⚡",
    name: "Nice to meet you!",
    email: "What's your email, friend? 📩",
    "email-entered": "Looking good! Let's keep going.",
    password: "Psst... your secret is safe with me! 🙈",
    "confirm-password": "Psst... your secret is safe with me! 🙈",
    success: "You're in! Let's go! 🚀",
    error: "Something went wrong. Let's try again!",
  },
} as const satisfies {
  [key in "login" | "register"]: Record<CustomerAuthMascotState, string>;
};

function getAssetState(state: CustomerAuthMascotState) {
  if (state === "email" || state === "email-entered") return "email";
  if (state === "password" || state === "confirm-password") return "password";
  if (state === "name") return "welcome";
  return state;
}

export default function CustomerAuthMascot({
  flow,
  state,
  loading = false,
}: CustomerAuthMascotProps) {
  const asset = mascotAssets[getAssetState(state)];
  const [unavailableImage, setUnavailableImage] = useState<string | null>(null);
  const message = loading ? "Let's power up! ⚡" : messages[flow][state];

  useEffect(() => {
    Object.values(mascotAssets).forEach(({ src }) => {
      const image = new window.Image();
      image.src = src;
    });
  }, []);

  return (
    <div className={styles.wrapper} aria-label="PrimeZora mascot assistant">
      <div className={styles.mascotWrap}>
        <div className={styles.characterStage}>
          <div className={styles.glow} aria-hidden="true" />
          {unavailableImage === asset.src ? (
            <div className={styles.fallback} aria-hidden="true">
              <Zap size={52} fill="currentColor" />
            </div>
          ) : (
            <Image
              key={asset.src}
              src={asset.src}
              alt={asset.alt}
              fill
              sizes="(max-width: 767px) 70vw, 360px"
              className={styles.character}
              priority={state === "welcome" || state === "error"}
              onError={() => setUnavailableImage(asset.src)}
            />
          )}
        </div>

        {"hasSpeechBubble" in asset && asset.hasSpeechBubble ? (
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {message}
          </p>
        ) : (
          <div className={styles.speechBubble} aria-live="polite" aria-atomic="true">
            <span className={styles.bubbleMarker} aria-hidden="true">
              {loading ? <Sparkles size={18} /> : "✦"}
            </span>
            <p key={`${flow}-${state}-${loading ? "loading" : "idle"}`} className={styles.message}>
              {message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
