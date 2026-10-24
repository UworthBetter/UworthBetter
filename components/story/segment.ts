export type BodySegment = { kind: "text"; text: string } | { kind: "panel"; idx: number };

const MARK = /<!--panel:(\d)-->/g;

export function segmentBody(markdown: string): BodySegment[] {
  const out: BodySegment[] = [];
  let last = 0;
  for (const match of markdown.matchAll(MARK)) {
    const text = markdown.slice(last, match.index);
    if (text.trim()) out.push({ kind: "text", text });
    out.push({ kind: "panel", idx: Number(match[1]) });
    last = (match.index ?? 0) + match[0].length;
  }
  const rest = markdown.slice(last);
  if (rest.trim()) out.push({ kind: "text", text: rest });
  return out;
}

export function firstParagraph(markdown: string): string {
  const chunk = markdown.split(/\n\s*\n/).map((part) => part.trim()).find(Boolean) ?? "";
  return chunk.replace(/^小夏：\s*/, "");
}
