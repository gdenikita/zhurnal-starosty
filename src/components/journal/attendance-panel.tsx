import { X } from "lucide-react";
import { MARK_SHORT, MARKS, formatShort, type Lesson, type Mark } from "@/lib/journal/model";
import { recordOf, useJournal } from "@/lib/journal/store";
import { useGate } from "@/lib/journal/owner";
import { PrimaryButton } from "@/components/journal/ui";

function tone(mark: Mark, active: boolean): string {
  if (!active) return "border-line bg-sheet text-muted";
  if (mark === "present") return "border-forest bg-forest text-sheet";
  if (mark === "unexcused") return "border-clay bg-clay text-sheet";
  return "border-ink bg-ink text-sheet";
}

export function AttendancePanel({
  date,
  lesson,
  onClose,
}: {
  date: string;
  lesson: Lesson;
  onClose: () => void;
}) {
  const students = useJournal((s) => s.students);
  const records = useJournal((s) => s.records);
  const setMark = useJournal((s) => s.setMark);
  const markAllPresent = useJournal((s) => s.markAllPresent);
  const ask = useGate((s) => s.ask);
  const record = recordOf(records, date, lesson.id);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/40 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendance-title"
        className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl bg-paper sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-4">
          <div>
            <p className="text-sm text-muted">
              {formatShort(date)} · {lesson.start}–{lesson.end}
              {lesson.kind ? ` · ${lesson.kind}` : ""}
            </p>
            <h2 id="attendance-title" className="font-display text-2xl leading-tight">
              {lesson.subject}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="rounded-xl p-2 text-muted">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex gap-2 px-4 py-3">
          <PrimaryButton type="button" className="flex-1" onClick={() => ask(() => markAllPresent(date, lesson.id))}>
            Все здесь
          </PrimaryButton>
        </div>
        <ul className="flex-1 overflow-y-auto px-4 pb-6">
          {students.length === 0 && <li className="text-sm text-muted">Сначала добавьте студентов во вкладке «Группа».</li>}
          {students.map((student) => {
            const mark = record?.marks[student.id] ?? null;
            return (
              <li key={student.id} className="border-b border-line py-3">
                <p className="mb-2 text-sm font-medium">{student.name}</p>
                <div className="grid grid-cols-3 gap-1">
                  {MARKS.map((option) => {
                    const active = mark === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          ask(() => setMark(date, lesson.id, student.id, active ? null : option))
                        }
                        className={`h-11 rounded-xl border px-2 text-sm font-semibold ${tone(option, active)}`}
                      >
                        {MARK_SHORT[option]}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
