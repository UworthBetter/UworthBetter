import { LetterCard } from "@/components/story/LetterCard";
import { TypeBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";

export default function Page() {
  return (
    <div className="screen-pad sink-grid">
      <div className="kicker">设计系统</div>
      <h1 className="display" style={{ fontSize: 32, margin: 0 }}>编辑室的纸、字和按钮</h1>
      <p className="muted">这一页只给开发看样式，不进产品导航。</p>
      <div className="card">
        <div className="display" style={{ fontSize: 22 }}>卡片标题</div>
        <p>米白纸上的正文。金色只留给正在发生的事。</p>
        <div className="row">
          <TypeBadge type="highlight" />
          <TypeBadge type="struggle" />
          <TypeBadge type="low" />
          <TypeBadge type="rest" />
        </div>
      </div>
      <div className="row">
        <Button>主按钮</Button>
        <Button variant="secondary">次按钮</Button>
        <Button variant="ghost">文字按钮</Button>
      </div>
      <div className="chip-row">
        <Chip active>已选</Chip>
        <Chip>未选</Chip>
      </div>
      <LetterCard
        markdown={"小夏：\n\n先画，再说。灯塔会等你，但窗要你自己擦。"}
        from="2027年的林夏"
        defaultOpen
      />
    </div>
  );
}
