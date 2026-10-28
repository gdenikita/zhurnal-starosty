import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Plus, Trash2 } from "lucide-react";
import {
  buildReport,
  formatLong,
  formatShort,
  isoDate,
  isAbsence,
  lessonsOn,
  parityLabel,
  parityOf,
  plural,
  type Lesson,
} from "@/lib/journal/model";
import { recordOf, useJournal } from "@/lib/journal/store";
import { AttendancePanel } from "@/components/journal/attendance-panel";
import { FieldLabel, PrimaryButton, QuietButton, Sheet, fieldClass } from "@/components/journal/ui";

export function TodayScreen({ date }: { date: string }) {
  const data = useJournal();
  const [now, setNow] = useState(() => new Date());
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [due, setDue] = useState(date);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);

  const day = useMemo(() => parseDay(date), [date]);
  const lessons = useMemo(
    () => lessonsOn(data.lessons, day, data.numeratorMonday),
    [data.lessons, data.numeratorMonday, day],
  );
  const parity = parityOf(day, data.numeratorMonday);
  const banner = useMemo(() => describeNow(lessons, now), [lessons, now]);
  const open = lessons.find((lesson) => lesson.id === openLesson) ?? null;

  const upcoming = data.deadlines
    .filter((item) => !item.done)
    .slice()
    .sort((a, b) => a.due.localeCompare(b.due));

  async function copyReport() {
    const text = buildReport(data, date);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-muted">{formatLong(date)}</p>
        <p className="text-sm font-semibold text-forest">{parityLabel(parity)}</p>
      </div>

      <Sheet className="bg-sheet text-ink">
        <p className="text-sm font-medium text-muted">{banner.kicker}</p>
        <h2 className="mt-1 font-display text-2xl leading-tight text-ink">{banner.title}</h2>
        {banner.detail && <p className="mt-1 text-sm text-muted">{banner.detail}</p>}
      </Sheet>

      <div className="flex flex-col gap-2">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-xl">Пары</h2>
          <span className="text-sm text-muted">
            {lessons.length} {plural(lessons.length, "пара", "пары", "пар")}
          </span>
        </div>
        {lessons.length === 0 && (
          <Sheet>
            <p className="text-sm text-muted">
              На неделе «{parityLabel(parity)}» в этот день пар нет. Добавьте их во вкладке «Пары».
            </p>
          </Sheet>
        )}
        {lessons.map((lesson, index) => {
          const record = recordOf(data.records, date, lesson.id);
          const absent = data.students.filter((s) => isAbsence(record?.marks[s.id]));
          const marked = data.students.filter((s) => record?.marks[s.id]).length;
          return (
            <button
              key={lesson.id}
              type="button"
              onClick={() => setOpenLesson(lesson.id)}
              className="rounded-2xl border border-line bg-sheet px-4 py-3 text-left"
            >
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-forest">
                  {index + 1} · {lesson.start}–{lesson.end}
                </p>
                <span className="text-xs font-medium text-muted">
                  {marked === 0 ? "не отмечено" : `${marked}/${data.students.length}`}
                </span>
              </div>
              <p className="mt-1 font-medium">{lesson.subject}</p>
              <p className="text-sm text-muted">
                {[lesson.kind, lesson.room && `ауд. ${lesson.room}`, lesson.teacher].filter(Boolean).join(" · ")}
              </p>
              {absent.length > 0 && (
                <p className="mt-2 text-sm text-clay">Нет: {absent.map((s) => s.name).join(", ")}</p>
              )}
            </button>
          );
        })}
      </div>

      <PrimaryButton type="button" onClick={copyReport} className="w-full">
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? "Сводка скопирована" : "Сводка в чат группы"}
      </PrimaryButton>
      <p className="-mt-2 text-sm text-muted">
        Собирает, кто был и кого не было, и копирует этот текст. Его вставляете в чат группы сами — бот никому не пишет.
      </p>

      <div className="flex flex-col gap-2">
        <h2 className="font-display text-xl">Сроки</h2>
        {upcoming.length === 0 && <p className="text-sm text-muted">Открытых сроков нет.</p>}
        {upcoming.map((item) => (
          <Sheet key={item.id} className="flex items-start gap-3 py-3">
            <button
              type="button"
              aria-label="Отметить выполненным"
              onClick={() => data.toggleDeadline(item.id)}
              className="mt-0.5 size-6 shrink-0 rounded-md border border-line"
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-muted">
                {item.subject ? `${item.subject} · ` : ""}
                {formatShort(item.due)}
              </p>
            </div>
            <button type="button" aria-label="Удалить срок" onClick={() => data.removeDeadline(item.id)} className="text-muted">
              <Trash2 className="size-4" />
            </button>
          </Sheet>
        ))}
        <Sheet>
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              data.addDeadline({ title, subject, due });
              setTitle("");
              setSubject("");
            }}
          >
            <label>
              <FieldLabel>Новый срок</FieldLabel>
              <input className={fieldClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Что сдать" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input className={fieldClass} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Предмет" />
              <input className={fieldClass} type="date" value={due} onChange={(e) => setDue(e.target.value)} required />
            </div>
            <QuietButton type="submit" className="w-full">
              <Plus className="size-4" />
              Добавить
            </QuietButton>
          </form>
        </Sheet>
      </div>

      {open && (
        <AttendancePanel
          date={date}
          lesson={open}
          onClose={() => setOpenLesson(null)}
        />
      )}
    </div>
  );
}

function parseDay(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function describeNow(lessons: Lesson[], now: Date): { kicker: string; title: string; detail: string } {
  const mins = now.getHours() * 60 + now.getMinutes();
  const current = lessons.find((lesson) => {
    const start = toMin(lesson.start);
    const end = toMin(lesson.end);
    return mins >= start && mins < end;
  });
  if (current) {
    return {
      kicker: `Сейчас · до ${current.end}`,
      title: current.subject,
      detail: [current.room && `ауд. ${current.room}`, current.teacher].filter(Boolean).join(" · "),
    };
  }
  const next = lessons.find((lesson) => toMin(lesson.start) > mins);
  if (next) {
    const delta = toMin(next.start) - mins;
    return {
      kicker: delta < 90 ? `Через ${delta} мин` : "Дальше",
      title: next.subject,
      detail: `${next.start}–${next.end}${next.room ? ` · ауд. ${next.room}` : ""}`,
    };
  }
  if (lessons.length === 0) {
    return { kicker: "Сегодня", title: "Свободный день", detail: "Можно закрыть хвосты по срокам." };
  }
  return { kicker: "Сегодня", title: "Пары закончились", detail: "Сводку можно отправить в чат группы." };
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function todayIso(): string {
  return isoDate();
}
