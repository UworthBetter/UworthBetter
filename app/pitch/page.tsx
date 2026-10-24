import type { Metadata } from "next";
import seed from "@/seed/demo-season.json";
import { PitchDeck } from "@/components/pitch/PitchDeck";
import { toPitchData } from "@/components/pitch/model/adapter";
import "@/components/pitch/pitch.css";

export const metadata: Metadata = { title: "UworthBetter · 路演" };

// 演示数据在服务端裁剪成 PitchData，只把用到的字段下发给客户端。
// E8 分支画像就绪后：import branches from "@/seed/pitch-branches.json" 并作为第二个参数传入（唯一改动点）。
export default function PitchPage() {
  return <PitchDeck data={toPitchData(seed)} />;
}
