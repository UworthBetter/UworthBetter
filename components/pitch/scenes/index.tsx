"use client";

import type { ComponentType } from "react";
import type { PitchData } from "@/components/pitch/model/types";

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
  def("title", "标题", 1, true),
  def("question", "一个问题", 2, true),
  def("three", "三种人", 4, true),
  def("stranger", "陌生人", 3, true),
  def("see", "看见与对话", 3, true),
  def("borrowed", "借来的动机", 3, true),
  def("rewrite", "故事可以重写", 3, true),
  def("converge", "汇合", 3, true),
  def("linxia", "认识林夏", 3, false),
  def("shelf", "她的连载", 3, false),
  def("live", "现场演示", 5, false),
  def("evolution", "画像演化", 8, true),
  def("compare", "差异化", 3, true),
  def("tech", "技术实现", 3, true),
  def("rigor", "严谨与安全", 1, true),
  def("business", "商业化", 1, false),
  def("roadmap", "Roadmap", 1, false),
  def("end", "谢谢", 2, false),
];

export const BEATS = SCENES.map((s) => s.beats);
