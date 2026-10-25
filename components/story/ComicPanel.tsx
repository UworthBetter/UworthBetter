"use client";

import { useState } from "react";
import type { PanelView } from "@/lib/contracts";
import { SpeechBubble } from "@/components/story/SpeechBubble";
import { FitImage } from "@/components/ui/FitImage";

export function ComicPanel({ panel, pending = false }: { panel: PanelView; pending?: boolean }) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(panel.imageUrl) && !broken;
  return (
    <figure className={`panel p${panel.idx % 4}${pending && !showImage ? " skeleton" : ""}`}>
      {showImage && panel.imageUrl ? (
        <FitImage className="pimg" src={panel.imageUrl} alt="" sizes="390px" ratio="3 / 2" onError={() => setBroken(true)} />
      ) : (
        <div className="pimg" />
      )}
      {panel.narration ? <figcaption className="narr">{panel.narration}</figcaption> : null}
      {panel.dialogues.map((line, index) => (
        <SpeechBubble key={`${line.speaker}-${index}`} speaker={line.speaker} text={line.text} x={line.x} y={line.y} />
      ))}
    </figure>
  );
}
