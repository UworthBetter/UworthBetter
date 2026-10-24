"use client";

import type { ComponentType } from "react";
import type { PitchData } from "@/components/pitch/model/types";
import { Scene12Compare, Scene13Tech, Scene14Rigor, Scene15Business, Scene16Roadmap, Scene17End } from "@/components/pitch/scenes/Closing";
import { Scene07Converge } from "@/components/pitch/scenes/Converge";
import { Scene00Title, Scene01Question, Scene02Three } from "@/components/pitch/scenes/Opening";
import { Scene11Evolution } from "@/components/pitch/scenes/Evolution";
import { Scene08Linxia, Scene09Shelf } from "@/components/pitch/scenes/Story";
import { Scene03Stranger, Scene04See, Scene05Borrowed, Scene06Rewrite } from "@/components/pitch/scenes/Research";

export type SceneProps = { data: PitchData; beat: number; active: boolean };
export type SceneDef = {
  id: string;
  title: string;
  beats: number;
  dark: boolean;
  notes: string;
  Component: ComponentType<SceneProps>;
};

function placeholder(title: string): ComponentType<SceneProps> {
  function PlaceholderScene({ beat }: SceneProps) {
    return (
      <div className="pitch-center">
        <div className="pitch-claim">{title}</div>
        <div className="pitch-foot">拍 {beat + 1}</div>
      </div>
    );
  }
  return PlaceholderScene;
}

const def = (id: string, title: string, beats: number, dark: boolean, notes = "", Component?: ComponentType<SceneProps>): SceneDef =>
  ({ id, title, beats, dark, notes, Component: Component ?? placeholder(title) });

export const SCENES: SceneDef[] = [
  def("title", "标题", 1, true, "", Scene00Title),
  def("question", "一个问题", 2, true, "", Scene01Question),
  def("three", "三种人", 4, true, "", Scene02Three),
  def("stranger", "陌生人", 3, true, "", Scene03Stranger),
  def("see", "看见与对话", 3, true, "", Scene04See),
  def("borrowed", "借来的动机", 3, true, "", Scene05Borrowed),
  def("rewrite", "故事可以重写", 3, true, "", Scene06Rewrite),
  def("converge", "汇合", 3, true, "", Scene07Converge),
  def("linxia", "认识林夏", 3, false, "", Scene08Linxia),
  def("shelf", "她的连载", 3, false, "", Scene09Shelf),
  def("live", "现场演示", 5, false, "", () => null), // 内容由 PitchDeck 常驻挂载的 LiveDemo 渲染
  def("evolution", "画像演化", 8, true, "", Scene11Evolution),
  def("compare", "差异化", 3, true, "", Scene12Compare),
  def("tech", "技术实现", 3, true, "", Scene13Tech),
  def("rigor", "严谨与安全", 1, true, "", Scene14Rigor),
  def("business", "商业化", 1, false, "", Scene15Business),
  def("roadmap", "Roadmap", 1, false, "", Scene16Roadmap),
  def("end", "谢谢", 2, false, "", Scene17End),
];

export const BEATS = SCENES.map((s) => s.beats);
