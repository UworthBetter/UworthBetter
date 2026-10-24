/** 生成过程中的逐字文本。半截 markdown 不解析，避免标记闪一下。 */
export function StreamingText({ text, streaming = false }: { text: string; streaming?: boolean }) {
  return (
    <div className="letter-card">
      <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>
        {text || (streaming ? "…" : "")}
        {streaming && text ? <span className="caret" aria-hidden /> : null}
      </p>
    </div>
  );
}
