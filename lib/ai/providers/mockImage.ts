/**
 * Mock 图像：用 sharp 生成带标签的渐变占位图，零成本、可离线。
 */
import sharp from "sharp";
import { env } from "@/lib/env";
import { ASPECT_SIZE, type ImageProvider } from "./image";

const PALETTES = [
  ["#f6d5b8", "#9cc5c9"],
  ["#e8c1c5", "#a7b8d9"],
  ["#d9e4c8", "#e9b872"],
  ["#c9d6e8", "#f2c6a0"],
];

const escapeXml = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function createMockImageProvider(): ImageProvider {
  return {
    supportsRefs: true,
    async generate({ prompt, aspect, label }) {
      await new Promise((r) => setTimeout(r, env.MOCK_LATENCY_MS * 2));
      const { w, h } = ASPECT_SIZE[aspect];
      const [a, b] = PALETTES[Math.abs(hash(prompt)) % PALETTES.length];
      const caption = escapeXml(prompt.slice(0, 60));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
        <text x="50%" y="48%" font-family="sans-serif" font-size="${Math.round(w / 14)}" fill="#ffffffcc" text-anchor="middle">MOCK · ${escapeXml(label)}</text>
        <text x="50%" y="56%" font-family="sans-serif" font-size="${Math.round(w / 48)}" fill="#ffffffaa" text-anchor="middle">${caption}</text>
      </svg>`;
      const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
      return { buffer, mime: "image/png" };
    },
  };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
