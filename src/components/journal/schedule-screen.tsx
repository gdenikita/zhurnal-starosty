import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { WEEKDAYS, parityLabel, type Lesson, type Parity } from "@/lib/journal/model";
import { useJournal } from "@/lib/journal/store";
import { FieldLabel, PrimaryButton, QuietButton, Sheet, fieldClass } from "@/components/journal/ui";

const emptyForm = {
  day: 0,
  parity: "both" as Parity,
  start: "09:00",
  end: "10:30",
  subject: "",
  teacher: "",
  room: "",
  kind: "",
};

export function ScheduleScreen() {
  const lessons = useJournal((s) => s.lessons);
  const anchor = useJournal((s) => s.numeratorMonday);
  const addLesson = useJournal((s) => s.addLesson);
  const updateLesson = useJournal((s) => s.updateLesson);
  const removeLesson = useJournal((s) => s.removeLesson);
  const setAnchor = useJournal((s) => s.setAnchor);
  const [day, setDay] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);

  const visible = lessons
    .filter((lesson) => lesson.day === day)
    .slice()
    .sort((a, b) => a.start.localeCompare(b.start));

  function startCreate() {
    setEditing(null);
    setForm({ ...emptyForm, day });
    setOpen(true);
  }

  function startEdit(lesson: Lesson) {
    setEditing(lesson.id);
    setForm({
      day: lesson.day,
      parity: lesson.parity,
      start: lesson.start,
      end: lesson.end,
      subject: lesson.subject,
      teacher: lesson.teacher,
      room: lesson.room,
      kind: lesson.kind,
    });
    setOpen(true);
  }

  function save() {
    const subject = form.subject.trim();
    if (!subject || form.start >= form.end) return;
    const payload = {
      day: form.day,
      parity: form.parity,
      start: form.start,
      end: form.end,
      subject,
      teacher: form.teacher.trim(),
      room: form.room.trim(),
      kind: form.kind.trim(),
    };
    if (editing) updateLesson(editing, payload);
    else addLesson(payload);
    setOpen(false);
    setDay(form.day);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-6 gap-1">
        {WEEKDAYS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setDay(index)}
            className={`h-11 rounded-xl text-sm font-semibold ${day === index ? "bg-forest text-sheet" : "bg-sheet text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {visible.length === 0 && (
          <Sheet>
            <p className="text-sm text-muted">В {WEEKDAYS[day]} пар пока нет.</p>
          </Sheet>
        )}
        {visible.map((lesson) => (
          <Sheet key={lesson.id} className="flex items-start gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-forest">
                {lesson.start}–{lesson.end}
                <span className="ml-2 font-medium text-muted">{parityLabel(lesson.parity)}</span>
              </p>
              <p className="font-medium">{lesson.subject}</p>
              <p className="text-sm text-muted">
                {[lesson.kind, lesson.teacher, lesson.room && `ауд. ${lesson.room}`].filter(Boolean).join(" · ") || "Без деталей"}
              </p>
            </div>
            <button type="button" aria-label="Изменить пару" onClick={() => startEdit(lesson)} className="p-2 text-muted">
              <Pencil className="size-4" />
            </button>
            <button type="button" aria-label="Удалить пару" onClick={() => removeLesson(lesson.id)} className="p-2 text-muted">
              <Trash2 className="size-4" />
            </button>
          </Sheet>
        ))}
      </div>

      {!open && (
        <PrimaryButton type="button" onClick={startCreate} className="w-full">
          <Plus className="size-4" />
          Добавить пару
        </PrimaryButton>
      )}

      {open && (
        <Sheet>
          <h2 className="mb-3 font-display text-xl">{editing ? "Правка пары" : "Новая пара"}</h2>
          <div className="flex flex-col gap-3">
            <label>
              <FieldLabel>Предмет</FieldLabel>
              <input className={fieldClass} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label>
                <FieldLabel>Начало</FieldLabel>
                <input className={fieldClass} type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
              </label>
              <label>
                <FieldLabel>Конец</FieldLabel>
                <input className={fieldClass} type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
              </label>
            </div>
            <label>
              <FieldLabel>День</FieldLabel>
              <select
                className={fieldClass}
                value={form.day}
                onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}
              >
                {WEEKDAYS.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <FieldLabel>Неделя</FieldLabel>
              <select
                className={fieldClass}
                value={form.parity}
                onChange={(e) => setForm({ ...form, parity: e.target.value as Parity })}
              >
                <option value="both">обе недели</option>
                <option value="above">только над чертой</option>
                <option value="under">только под чертой</option>
              </select>
            </label>
            <label>
              <FieldLabel>Преподаватель</FieldLabel>
              <input className={fieldClass} value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} />
            </label>
            <label>
              <FieldLabel>Аудитория</FieldLabel>
              <input className={fieldClass} value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
            </label>
            <label>
              <FieldLabel>Вид</FieldLabel>
              <select className={fieldClass} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                <option value="">не указан</option>
                <option value="лекция">лекция</option>
                <option value="практика">практика</option>
              </select>
            </label>
            {form.start >= form.end && <p className="text-sm text-clay">Конец пары должен быть позже начала.</p>}
            <div className="grid grid-cols-2 gap-2">
              <QuietButton type="button" onClick={() => setOpen(false)}>
                Отмена
              </QuietButton>
              <PrimaryButton type="button" onClick={save} disabled={!form.subject.trim() || form.start >= form.end}>
                Сохранить
              </PrimaryButton>
            </div>
          </div>
        </Sheet>
      )}

      <Sheet>
        <label>
          <FieldLabel>Понедельник первой недели под чертой</FieldLabel>
          <input className={fieldClass} type="date" value={anchor} onChange={(e) => e.target.value && setAnchor(e.target.value)} />
        </label>
        <p className="mt-2 text-sm text-muted">
          Для Л-22 это 7 сентября 2026: та неделя идёт под чертой, следующая — над чертой. Так в расписании БТЭУ.
        </p>
      </Sheet>
    </div>
  );
}
