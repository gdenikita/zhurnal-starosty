import { useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import {
  WEEKDAYS,
  addDays,
  buildReport,
  formatMonth,
  formatShort,
  isAbsence,
  isoDate,
  lessonsOn,
  mondayOf,
  monthAbsences,
  parseIso,
  plural,
  weekdayMon0,
} from "@/lib/journal/model";
import { recordOf, useJournal } from "@/lib/journal/store";
import { AttendancePanel } from "@/components/journal/attendance-panel";
import { StudentSheet } from "@/components/journal/student-sheet";
import { PrimaryButton, Sheet } from "@/components/journal/ui";

export function JournalScreen({ date, onDate }: { date: string; onDate: (iso: string) => void }) {
  const data = useJournal();
  const [copied, setCopied] = useState(false);
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [person, setPerson] = useState<string | null>(null);
  const selected = parseIso(date);
  const weekStart = mondayOf(selected);
  const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i));
  const month = date.slice(0, 7);
  const stats = useMemo(() => monthAbsences(data.students, data.records, month), [data.students, data.records, month]);
  const maxMiss = Math.max(1, ...stats.map((row) => row.misses));
  const lessons = lessonsOn(data.lessons, selected, data.numeratorMonday);
  const open = lessons.find((lesson) => lesson.id === openLesson) ?? null;
  const dayIndex = Math.min(weekdayMon0(selected), 5);

  function shiftWeek(delta: number) {
    onDate(isoDate(addDays(weekStart, delta * 7 + dayIndex)));
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(buildReport(data, date));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Прошлая неделя" onClick={() => shiftWeek(-1)} className="rounded-xl p-2 text-ink">
          <ChevronLeft className="size-5" />
        </button>
        <p className="text-sm font-semibold">{formatShort(isoDate(weekStart))} — {formatShort(isoDate(addDays(weekStart, 5)))}</p>
        <button type="button" aria-label="Следующая неделя" onClick={() => shiftWeek(1)} className="rounded-xl p-2 text-ink">
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="grid grid-cols-6 gap-1">
        {days.map((day, index) => {
          const iso = isoDate(day);
          const active = iso === date;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onDate(iso)}
              className={`flex h-14 flex-col items-center justify-center rounded-xl text-sm ${
                active ? "bg-forest text-sheet" : "bg-sheet text-ink"
              }`}
            >
              <span className={active ? "text-forest-soft" : "text-muted"}>{WEEKDAYS[index]}</span>
              <span className="font-semibold">{day.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        {lessons.length === 0 && (
          <Sheet>
            <p className="text-sm text-muted">В этот день пар по расписанию нет.</p>
          </Sheet>
        )}
        {lessons.map((lesson) => {
          const record = recordOf(data.records, date, lesson.id);
          const missing = data.students.filter((s) => isAbsence(record?.marks[s.id]));
          return (
            <button
              key={lesson.id}
              type="button"
              onClick={() => setOpenLesson(lesson.id)}
              className="rounded-2xl border border-line bg-sheet px-4 py-3 text-left"
            >
              <p className="text-sm font-semibold text-forest">
                {lesson.start}–{lesson.end}
              </p>
              <p className="font-medium">{lesson.subject}</p>
              <p className="text-sm text-muted">
                {missing.length === 0
                  ? "Все отмеченные были"
                  : `Нет: ${missing.map((s) => s.name).join(", ")}`}
              </p>
            </button>
          );
        })}
      </div>

      <PrimaryButton type="button" onClick={copyReport} className="w-full">
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Скопировано" : "Сводка за этот день"}
      </PrimaryButton>

      <div>
        <h2 className="font-display text-xl">Пропуски · {formatMonth(date)}</h2>
        <p className="mb-3 text-sm text-muted">Нажмите на фамилию — дни пропусков и причина.</p>
        <ul className="flex flex-col gap-2">
          {stats.length === 0 && <li className="text-sm text-muted">Список группы пуст. Добавьте его во вкладке «Группа».</li>}
          {stats.map((row) => {
            const width = Math.round((row.misses / maxMiss) * 100);
            return (
              <li key={row.student.id}>
                <button
                  type="button"
                  onClick={() => setPerson(row.student.id)}
                  className="w-full rounded-2xl border border-line bg-sheet px-3 py-3 text-left"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium">{row.student.name}</p>
                    <p className="shrink-0 text-sm text-muted">
                      {row.misses === 0
                        ? "без пропусков"
                        : `${row.misses} ${plural(row.misses, "пропуск", "пропуска", "пропусков")}`}
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper">
                    <div className="h-full rounded-full bg-clay" style={{ width: `${row.misses === 0 ? 0 : Math.max(width, 8)}%` }} />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {open && <AttendancePanel date={date} lesson={open} onClose={() => setOpenLesson(null)} />}
      {person && <StudentSheet studentId={person} onClose={() => setPerson(null)} />}
    </div>
  );
}
