import { evaluateNotices } from "@/config/notices";
import type { SimConfig } from "@/lib/schema";
import { Panel } from "../ui";

export function Notices({ config }: { config: SimConfig }) {
  const notices = evaluateNotices(config);
  return (
    <Panel
      id="notices"
      title="Things to know"
      intro="Facts from the rules that apply to these settings. They describe what happens, not whether it is a good idea."
    >
      <ul className="divide-y divide-line">
        {notices.map((notice) => (
          <li key={notice.id} className="py-2.5" data-notice={notice.id}>
            <p className="font-mono text-[13px] font-medium text-text">{notice.title}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-body">{notice.body}</p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
