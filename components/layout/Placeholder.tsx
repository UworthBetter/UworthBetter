/** Phase 0 页面占位。C 轨道实现页面时删除对它的引用。 */
export function Placeholder({ card, title, apis }: { card: string; title: string; apis: string[] }) {
  return (
    <div className="p-6 space-y-3">
      <p className="text-xs opacity-60">任务卡 {card}</p>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm">使用接口：</p>
      <ul className="list-disc pl-5 text-sm font-mono">
        {apis.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </div>
  );
}
