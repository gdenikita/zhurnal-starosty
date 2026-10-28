import { useMemo, useState } from "react";
import { BookOpen, CalendarDays, ClipboardList, Users } from "lucide-react";
import { isoDate } from "@/lib/journal/model";
import { useJournal } from "@/lib/journal/store";
import { GroupScreen } from "@/components/journal/group-screen";
import { JournalScreen } from "@/components/journal/journal-screen";
import { ScheduleScreen } from "@/components/journal/schedule-screen";
import { TodayScreen } from "@/components/journal/today-screen";
import { OwnerGate } from "@/components/journal/owner-gate";

const TABS = [
  { id: "today", label: "Сегодня", icon: BookOpen },
  { id: "journal", label: "Журнал", icon: ClipboardList },
  { id: "schedule", label: "Пары", icon: CalendarDays },
  { id: "group", label: "Группа", icon: Users },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function JournalApp() {
  const groupName = useJournal((s) => s.groupName);
  const [tab, setTab] = useState<TabId>("today");
  const [date, setDate] = useState(() => isoDate());
  const today = useMemo(() => isoDate(), []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col border-x border-line">
        <header className="sticky top-0 z-10 border-b border-line bg-paper/95 px-4 pb-3 pt-4 backdrop-blur-sm">
          <p className="text-sm font-medium text-forest">Журнал старосты</p>
          <h1 className="font-display text-3xl leading-tight text-ink">{groupName}</h1>
        </header>
        <main className="flex-1 px-4 pb-28 pt-4">
          {tab === "today" && <TodayScreen date={today} />}
          {tab === "journal" && <JournalScreen date={date} onDate={setDate} />}
          {tab === "schedule" && <ScheduleScreen />}
          {tab === "group" && <GroupScreen />}
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-lg border-t border-line bg-sheet safe-bottom">
          <ul className="grid grid-cols-4">
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`flex h-16 w-full flex-col items-center justify-center gap-1 text-xs font-semibold ${
                      active ? "text-forest" : "text-muted"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <OwnerGate />
      </div>
    </div>
  );
}
