"use client";

import { useState } from "react";
import Image from "next/image";
import type { PanelView } from "@/lib/contracts";
import { SpeechBubble } from "@/components/story/SpeechBubble";

export function ComicPanel({ panel, pending = false }: { panel: PanelView; pending?: boolean }) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(panel.imageUrl) && !broken;
  return (
    <figure className={`panel p${panel.idx % 4}${pending && !showImage ? " skeleton" : ""}`}>
      <div className="pimg">
        {showImage && panel.imageUrl ? (
          <Image src={panel.imageUrl} alt="" fill sizes="390px" style={{ objectFit: "cover" }} onError={() => setBroken(true)} />
        ) : null}
      </div>
      {panel.narration ? <figcaption className="narr">{panel.narration}</figcaption> : null}
      {panel.dialogues.map((line, index) => (
        <SpeechBubble key={`${line.speaker}-${index}`} speaker={line.speaker} text={line.text} x={line.x} y={line.y} />
      ))}
    </figure>
  );
}
