"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";

function DrawnPortrait() {
  return (
    <div className="portrait" aria-hidden>
      <div className="face"><div className="hair" /><div className="glasses" /></div>
      <div className="scarf" />
    </div>
  );
}

export function CharacterReveal({ imageUrl }: { imageUrl: string | null }) {
  const [flipped, setFlipped] = useState(false);
  const [ratio, setRatio] = useState("2 / 3");
  const reduce = useReducedMotion();
  return (
    <button type="button" className="flip-card" style={{ aspectRatio: ratio }} onClick={() => setFlipped((v) => !v)} aria-label={flipped ? "翻回封面" : "翻开未来的自己"}>
      <motion.div
        className="flip-inner"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduce ? { duration: 0 } : { duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="flip-face flip-front">
          <Icon name="diamond" className="diamond-mark" />
          <div>轻触，翻开未来的自己</div>
        </div>
        <div className="flip-face flip-back">
          {imageUrl ? (
            <Image
              key={imageUrl}
              src={imageUrl}
              alt="未来的你"
              fill
              sizes="360px"
              style={{ objectFit: "contain" }}
              onLoad={(event) => {
                const img = event.currentTarget;
                if (img.naturalWidth > 0 && img.naturalHeight > 0) setRatio(`${img.naturalWidth} / ${img.naturalHeight}`);
              }}
            />
          ) : <DrawnPortrait />}
        </div>
      </motion.div>
    </button>
  );
}
