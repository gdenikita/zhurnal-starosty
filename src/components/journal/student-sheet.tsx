import { X } from "lucide-react";
import { MARK_LABEL, formatLong, plural, studentAbsences } from "@/lib/journal/model";
import { useJournal } from "@/lib/journal/store";

export function StudentSheet({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const data = useJournal();
  const student = data.students.find((item) => item.id === studentId);
  const rows = student ? studentAbsences(data, studentId) : [];
  if (!student) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-absences-title"
        className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl bg-paper sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-4">
          <div>
            <p className="text-sm text-muted">
              {rows.length === 0
                ? "Пропусков нет"
                : `${rows.length} ${plural(rows.length, "пропуск", "пропуска", "пропусков")}`}
            </p>
            <h2 id="student-absences-title" className="font-display text-2xl leading-tight">
              {student.name}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Закрыть" className="rounded-xl p-2 text-muted">
            <X className="size-5" />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto px-4 py-3">
          {rows.length === 0 && (
            <li className="text-sm text-muted">Когда отметите отсутствие на паре, день и причина появятся здесь.</li>
          )}
          {rows.map((row) => (
            <li key={`${row.date}-${row.start}-${row.subject}`} className="border-b border-line py-3">
              <p className="text-sm font-semibold text-forest">{formatLong(row.date)}</p>
              <p className="font-medium">
                {row.start && row.end ? `${row.start}–${row.end} · ` : ""}
                {row.subject}
              </p>
              <p className="text-sm text-clay">{MARK_LABEL[row.mark]}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
