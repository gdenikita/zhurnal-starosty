import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  demoJournal,
  findRecord,
  journalSchema,
  type Deadline,
  type JournalData,
  type Lesson,
  type Mark,
} from "@/lib/journal/model";

type Actions = {
  renameGroup: (name: string) => void;
  setAnchor: (iso: string) => void;
  addStudent: (name: string) => void;
  removeStudent: (id: string) => void;
  addLesson: (lesson: Omit<Lesson, "id">) => void;
  updateLesson: (id: string, patch: Partial<Omit<Lesson, "id">>) => void;
  removeLesson: (id: string) => void;
  setMark: (date: string, lessonId: string, studentId: string, mark: Mark | null) => void;
  markAllPresent: (date: string, lessonId: string) => void;
  addDeadline: (input: Pick<Deadline, "title" | "subject" | "due">) => void;
  toggleDeadline: (id: string) => void;
  removeDeadline: (id: string) => void;
  replaceAll: (data: JournalData) => void;
  loadDemo: () => void;
  clearAll: () => void;
};

export type JournalState = JournalData & Actions;

function uid(prefix: string): string {
  return `${prefix}${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

export const useJournal = create<JournalState>()(
  persist(
    (set, get) => ({
      ...demoJournal(),
      renameGroup: (name) => {
        const trimmed = name.trim().slice(0, 80);
        if (!trimmed) return;
        set({ groupName: trimmed });
      },
      setAnchor: (iso) => set({ numeratorMonday: iso }),
      addStudent: (name) => {
        const trimmed = name.trim().slice(0, 80);
        if (!trimmed) return;
        set({ students: [...get().students, { id: uid("s"), name: trimmed }] });
      },
      removeStudent: (id) => set({ students: get().students.filter((s) => s.id !== id) }),
      addLesson: (lesson) => set({ lessons: [...get().lessons, { ...lesson, id: uid("l") }] }),
      updateLesson: (id, patch) =>
        set({
          lessons: get().lessons.map((lesson) => (lesson.id === id ? { ...lesson, ...patch } : lesson)),
        }),
      removeLesson: (id) => set({ lessons: get().lessons.filter((lesson) => lesson.id !== id) }),
      setMark: (date, lessonId, studentId, mark) => {
        const records = get().records.slice();
        const index = records.findIndex((r) => r.date === date && r.lessonId === lessonId);
        const current = index >= 0 ? { ...records[index], marks: { ...records[index].marks } } : { date, lessonId, marks: {} };
        if (mark == null) delete current.marks[studentId];
        else current.marks[studentId] = mark;
        if (index >= 0) records[index] = current;
        else records.push(current);
        set({ records });
      },
      markAllPresent: (date, lessonId) => {
        const marks: Record<string, Mark> = {};
        for (const student of get().students) marks[student.id] = "present";
        const records = get().records.filter((r) => !(r.date === date && r.lessonId === lessonId));
        records.push({ date, lessonId, marks });
        set({ records });
      },
      addDeadline: (input) => {
        const title = input.title.trim().slice(0, 120);
        if (!title || !input.due) return;
        set({
          deadlines: [
            ...get().deadlines,
            { id: uid("d"), title, subject: input.subject.trim().slice(0, 80), due: input.due, done: false },
          ],
        });
      },
      toggleDeadline: (id) =>
        set({
          deadlines: get().deadlines.map((d) => (d.id === id ? { ...d, done: !d.done } : d)),
        }),
      removeDeadline: (id) => set({ deadlines: get().deadlines.filter((d) => d.id !== id) }),
      replaceAll: (data) => set({ ...data }),
      loadDemo: () => {
        const fresh = demoJournal();
        set({
          groupName: fresh.groupName,
          numeratorMonday: fresh.numeratorMonday,
          lessons: fresh.lessons,
          records: [],
        });
      },
      clearAll: () => set({ students: [], records: [], deadlines: [] }),
    }),
    { name: "starosta-journal-v2" },
  ),
);

export function parseJournalImport(raw: string): JournalData {
  const parsed = journalSchema.parse(JSON.parse(raw));
  return parsed;
}

export function recordOf(records: JournalData["records"], date: string, lessonId: string) {
  return findRecord(records, date, lessonId);
}
