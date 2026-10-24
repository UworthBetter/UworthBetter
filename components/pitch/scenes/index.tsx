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
  def("title", "标题", 1, true, "开场停 3 秒，等全场安静。", Scene00Title),
  def("question", "一个问题", 2, true, `先问台下：你第 1 天写下的目标，到第 90 天还是你想要的吗？
点出：目标是静态的，人是动态的。`, Scene01Question),
  def("three", "三种人", 4, true, `三张卡逐一讲团队成员的真实经历：忘了 / 懒了 / 超额完成。
落点：三种都是真实人生，打卡 App 只认「照做」这一种。`, Scene02Three),
  def("stranger", "陌生人", 3, true, `Hershfield 2009：大脑看未来的自己像看陌生人。
→ 所以要让未来的你被看见。`, Scene03Stranger),
  def("see", "看见与对话", 3, true, `老化照片 → 存更多钱；写信给 20 年后 → 运动更多。
→ 未来画像 + 来自未来的信。`, Scene04See),
  def("borrowed", "借来的动机", 3, true, `Finch 为宠物坚持，次日留存近 60%；Zombies, Run! 用剧情拉人跑步。
→ 借来的动机：为了看下一章。`, Scene05Borrowed),
  def("rewrite", "故事可以重写", 3, true, `叙事疗法：问题外化，故事可以重写。
→ 偏离也是剧情。`, Scene06Rewrite),
  def("converge", "汇合", 3, true, `四块拼图合起来，就是 UworthBetter。
一句话：把 90 天改编成 13 章连载，真实行动变成下一章剧情。`, Scene07Converge),
  def("linxia", "认识林夏", 3, false, "林夏想成为插画师。上传照片、写下理想 → 这是 90 天后的她。读第一封信。", Scene08Linxia),
  def("shelf", "她的连载", 3, false, `她的 90 天变成了连载。翻到第 3 章低谷章：
别的 App 提醒她断签了，在这里这是最动人的一章。`, Scene09Shelf),
  def("live", "现场演示", 5, false, `先悬停左下角点「重置演示」。
勾任务 → 迷雾散开 → 结束本章 → 请评委代答一个采访问题 → 正文流式出现。
出问题：按 V 切备用视频。`, () => null), // 内容由 PitchDeck 常驻挂载的 LiveDemo 渲染
  def("evolution", "画像演化", 8, true, `快进到第 90 天。
命运树：每个节点她都可以有别的选择；光沿她真实走过的路。
拉远成满墙 → 熄灭 → 只剩她自己选出来的那一个。
画像只拟合，不评判。`, Scene11Evolution),
  def("compare", "差异化", 3, true, `逐列讲，最后一列「随人拟合」只有我们。
金句：别的产品让你追赶固定目标，我们让未来的你跟着你一起长大。`, Scene12Compare),
  def("tech", "技术实现", 3, true, "多模态管线、跨章记忆、角色一致性、流式体验、画像拟合环。", Scene13Tech),
  def("rigor", "严谨与安全", 1, true, "主动说：我们不宣称疗效，是动机与自我反思工具；有危机检测。", Scene14Rigor),
  def("business", "商业化", 1, false, "免费 / 会员 ¥18 / 实体书 ¥99 / B 端：学期 = 一季。", Scene15Business),
  def("roadmap", "Roadmap", 1, false, "好友客串、季终合集、更多文风。", Scene16Roadmap),
  def("end", "谢谢", 2, false, "回到林夏：看着自己，变成未来的你。介绍团队，致谢。", Scene17End),
];

export const BEATS = SCENES.map((s) => s.beats);
