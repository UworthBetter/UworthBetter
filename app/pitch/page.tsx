import type { Metadata } from "next";
import seed from "@/seed/demo-season.json";
import branches from "@/seed/pitch-branches.json";
import { PitchDeck } from "@/components/pitch/PitchDeck";
import { toPitchData } from "@/components/pitch/model/adapter";
import "@/components/pitch/pitch.css";

export const metadata: Metadata = { title: "UworthBetter · 路演" };

// 演示数据（含 E7 画像快照）与 E8 分支画像在服务端裁剪成 PitchData，只把用到的字段下发给客户端。
export default function PitchPage() {
  return <PitchDeck data={toPitchData(seed, branches)} />;
}
