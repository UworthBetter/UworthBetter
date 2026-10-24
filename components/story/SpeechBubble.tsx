export function SpeechBubble({ speaker, text, x, y }: { speaker: string; text: string; x: number; y: number }) {
  return (
    <div className="bubble" style={{ left: `${x * 100}%`, top: `${y * 100}%` }}>
      {speaker ? `${speaker}：` : ""}
      {text}
    </div>
  );
}
