import { z } from "zod";

export type Mark =
  | "present"
  | "unexcused"
  | "valid"
  | "certificate"
  | "application"
  | "exemption";
export type Parity = "both" | "above" | "under";

export const MARK_LABEL: Record<Mark, string> = {
  present: "тут",
  unexcused: "неуважительная",
  valid: "уважительная",
  certificate: "справка",
  application: "заявления",
  exemption: "освобождение",
};

export const MARK_SHORT: Record<Mark, string> = {
  present: "Тут",
  unexcused: "Неув.",
  valid: "Уваж.",
  certificate: "Справка",
  application: "Заявл.",
  exemption: "Освоб.",
};

export const MARKS: Mark[] = ["present", "unexcused", "valid", "certificate", "application", "exemption"];

export function isAbsence(mark: Mark | null | undefined): mark is Exclude<Mark, "present"> {
  return !!mark && mark !== "present";
}

export type Student = { id: string; name: string };
export type Lesson = {
  id: string;
  day: number;
  parity: Parity;
  start: string;
  end: string;
  subject: string;
  teacher: string;
  room: string;
  kind: string;
};
export type Attendance = {
  date: string;
  lessonId: string;
  marks: Record<string, Mark>;
};
export type Deadline = {
  id: string;
  title: string;
  subject: string;
  due: string;
  done: boolean;
};

export type JournalData = {
  groupName: string;
  numeratorMonday: string;
  students: Student[];
  lessons: Lesson[];
  records: Attendance[];
  deadlines: Deadline[];
};

export const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] as const;
export const WEEKDAY_LONG = [
  "понедельник",
  "вторник",
  "среда",
  "четверг",
  "пятница",
  "суббота",
  "воскресенье",
] as const;
const MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];
const MONTHS_NOM = [
  "январь",
  "февраль",
  "март",
  "апрель",
  "май",
  "июнь",
  "июль",
  "август",
  "сентябрь",
  "октябрь",
  "ноябрь",
  "декабрь",
];

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRe = /^\d{4}-\d{2}-\d{2}$/;

export const journalSchema = z.object({
  groupName: z.string().trim().min(1).max(80),
  numeratorMonday: z.string().regex(dateRe),
  students: z
    .array(z.object({ id: z.string().min(1).max(40), name: z.string().trim().min(1).max(80) }))
    .max(80),
  lessons: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        day: z.number().int().min(0).max(5),
        parity: z.enum(["both", "num", "den", "above", "under"]).transform((value): Parity => {
          if (value === "num") return "under";
          if (value === "den") return "above";
          return value;
        }),
        start: z.string().regex(timeRe),
        end: z.string().regex(timeRe),
        subject: z.string().trim().min(1).max(140),
        teacher: z.string().trim().max(140),
        room: z.string().trim().max(40),
        kind: z.string().trim().max(24).default(""),
      }),
    )
    .max(120),
  records: z
    .array(
      z.object({
        date: z.string().regex(dateRe),
        lessonId: z.string().min(1).max(40),
        marks: z.record(
          z.string(),
          z
            .enum(["present", "absent", "excused", "unexcused", "valid", "certificate", "application", "exemption"])
            .transform((value): Mark => {
              if (value === "absent") return "unexcused";
              if (value === "excused") return "valid";
              return value;
            }),
        ),
      }),
    )
    .max(4000),
  deadlines: z
    .array(
      z.object({
        id: z.string().min(1).max(40),
        title: z.string().trim().min(1).max(120),
        subject: z.string().trim().max(80),
        due: z.string().regex(dateRe),
        done: z.boolean(),
      }),
    )
    .max(200),
});

export function isoDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function weekdayMon0(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function mondayOf(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() - weekdayMon0(copy));
  return copy;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function formatLong(iso: string): string {
  const d = parseIso(iso);
  const wd = WEEKDAY_LONG[weekdayMon0(d)] ?? "";
  const titled = wd ? wd.charAt(0).toUpperCase() + wd.slice(1) : "";
  return `${titled}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatShort(iso: string): string {
  const d = parseIso(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function formatMonth(iso: string): string {
  const d = parseIso(iso);
  return `${MONTHS_NOM[d.getMonth()]} ${d.getFullYear()}`;
}

export function parityOf(date: Date, underMonday: string): "above" | "under" {
  const effective = weekdayMon0(date) === 6 ? addDays(date, 1) : date;
  const startA = mondayOf(parseIso(underMonday));
  const startD = mondayOf(effective);
  const diff = Math.round((startD.getTime() - startA.getTime()) / 86400000 / 7);
  if (diff < 0) return "above";
  return ((diff % 2) + 2) % 2 === 0 ? "under" : "above";
}

export function parityLabel(p: "above" | "under" | Parity): string {
  if (p === "above") return "над чертой";
  if (p === "under") return "под чертой";
  return "обе недели";
}

export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function lessonsOn(lessons: Lesson[], date: Date, anchor: string): Lesson[] {
  const day = weekdayMon0(date);
  if (day > 5) return [];
  const parity = parityOf(date, anchor);
  return lessons
    .filter((l) => l.day === day && (l.parity === "both" || l.parity === parity))
    .slice()
    .sort((a, b) => minutesOf(a.start) - minutesOf(b.start) || a.subject.localeCompare(b.subject, "ru"));
}

export function plural(n: number, one: string, few: string, many: string): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

export function findRecord(records: Attendance[], date: string, lessonId: string): Attendance | undefined {
  return records.find((r) => r.date === date && r.lessonId === lessonId);
}

export function monthAbsences(students: Student[], records: Attendance[], month: string) {
  return students
    .map((student) => {
      const counts: Record<Exclude<Mark, "present">, number> = {
        unexcused: 0,
        valid: 0,
        certificate: 0,
        application: 0,
        exemption: 0,
      };
      let present = 0;
      for (const record of records) {
        if (!record.date.startsWith(month)) continue;
        const mark = record.marks[student.id];
        if (mark === "present") present += 1;
        else if (isAbsence(mark)) counts[mark] += 1;
      }
      const misses = counts.unexcused + counts.valid + counts.certificate + counts.application + counts.exemption;
      return { student, counts, misses, present };
    })
    .sort((a, b) => b.misses - a.misses || a.student.name.localeCompare(b.student.name, "ru"));
}

export type AbsenceDay = {
  date: string;
  start: string;
  end: string;
  subject: string;
  mark: Exclude<Mark, "present">;
};

export function studentAbsences(data: JournalData, studentId: string): AbsenceDay[] {
  const lessons = new Map(data.lessons.map((lesson) => [lesson.id, lesson]));
  const rows: AbsenceDay[] = [];
  for (const record of data.records) {
    const mark = record.marks[studentId];
    if (!isAbsence(mark)) continue;
    const lesson = lessons.get(record.lessonId);
    rows.push({
      date: record.date,
      start: lesson?.start ?? "",
      end: lesson?.end ?? "",
      subject: lesson?.subject ?? "Пара удалена",
      mark,
    });
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date) || b.start.localeCompare(a.start));
}

export function buildReport(data: JournalData, dateIso: string): string {
  const date = parseIso(dateIso);
  const dayLessons = lessonsOn(data.lessons, date, data.numeratorMonday);
  const lines: string[] = [
    `${data.groupName} · ${formatShort(dateIso)} · ${parityLabel(parityOf(date, data.numeratorMonday))}`,
  ];
  if (dayLessons.length === 0) {
    lines.push("Пар нет.");
    return lines.join("\n");
  }
  for (const lesson of dayLessons) {
    const record = findRecord(data.records, dateIso, lesson.id);
    const missed: string[] = [];
    let present = 0;
    for (const student of data.students) {
      const mark = record?.marks[student.id];
      if (isAbsence(mark)) missed.push(`${student.name} (${MARK_LABEL[mark]})`);
      else if (mark === "present") present += 1;
    }
    const marked = present + missed.length;
    lines.push("");
    lines.push(`${lesson.start}–${lesson.end} · ${lesson.subject}`);
    if (marked === 0) {
      lines.push("Посещаемость не отмечена.");
      continue;
    }
    lines.push(`Было ${present} из ${data.students.length}`);
    if (missed.length === 0) lines.push("Отсутствующих нет.");
    else lines.push(`Нет: ${missed.join(", ")}`);
  }
  return lines.join("\n");
}

function lesson(
  id: string,
  day: number,
  parity: Parity,
  start: string,
  end: string,
  subject: string,
  teacher: string,
  room: string,
  kind: string,
): Lesson {
  return { id, day, parity, start, end, subject, teacher, room, kind };
}

/** Расписание группы Л-22, 1 семестр 2026/2027. Якорь 07.09.2026 — первая полная неделя «под чертой». */
export function l22Journal(): JournalData {
  const lessons: Lesson[] = [
    lesson("m1", 0, "both", "09:50", "10:35", "Статистика", "доц. Козырева Н. Н.", "1-14", "лекция"),
    lesson("m2", 0, "above", "10:50", "12:25", "Товароведение прод. тов.", "доц. Бань М. Ф., доц. Рощина Е. В.", "1-38, 1-39a", "практика"),
    lesson("m3", 0, "under", "10:50", "12:25", "Статистика", "пр. Лавшук Т. Н.", "4-25", "практика"),
    lesson("m4", 0, "both", "12:55", "14:30", "Физра", "", "", "практика"),
    lesson("m5", 0, "under", "12:55", "14:30", "Противодействие коррупции", "доц. Аксеонов А. Н.", "1-22", "практика"),

    lesson("t1", 1, "both", "09:00", "10:35", "Теория вероятностей", "доц. Грибовская М. А.", "1-21", "практика"),
    lesson("t2", 1, "both", "10:50", "12:25", "Макроэкономика", "доц. Алексеенко Т. С., ст. практ. Нилова Е. Е.", "1-2", "лекция"),
    lesson("t3", 1, "above", "12:55", "14:30", "Организация и технология торговли", "ст.пр. Бурмистрова Н.А.", "1-14", "лекция"),
    lesson("t4", 1, "under", "14:40", "15:25", "Организация и правовое обеспечение предпринимательской деятельности", "пр. ст. Адасенко А. И.", "4-25", "практика"),

    lesson("w1", 2, "above", "09:00", "10:35", "Макроэкономика", "доц. Алексеенко Т. С., ст. практ. Нилова Е. Е.", "1-2", "лекция"),
    lesson("w2", 2, "under", "09:00", "10:35", "Организация и технология торговли", "ст. пр. Бурмистова Н. А.", "1-14", "лекция"),
    lesson("w3", 2, "both", "10:50", "12:25", "Высшая математика", "пр.-ст. Сиротин Р. Р.", "1-21", "практика"),
    lesson("w4", 2, "both", "12:55", "14:30", "Физическая культура", "", "", "практика"),
    lesson("w5", 2, "above", "14:40", "15:25", "Организация и правовое обеспечение предпринимательской деятельности", "ст.пр. Миненко Е.В.", "1-6", "лекция"),
    lesson("w6", 2, "under", "14:40", "15:25", "Товароведение продовольственных товаров", "доц. Бань М. Ф.", "1-6", "лекция"),

    lesson("h1", 3, "above", "10:50", "12:25", "Статистика", "пр. Лавшук Т.Н.", "4-26", "практика"),
    lesson("h2", 3, "under", "09:00", "10:35", "Макроэкономика", "доц. Алексеенко Т. С.", "1-13", "практика"),
    lesson("h3", 3, "under", "10:55", "12:25", "Товароведение продовольственных товаров", "доц. Бань М. Ф., доц. Рощина Е. В.", "1-33, 1-36", "практика"),
    lesson("h4", 3, "above", "12:55", "14:30", "Теория вероятностей", "доц. Грибовская М. А.", "1-14", "лекция"),
    lesson("h5", 3, "under", "12:55", "14:30", "Организация и правовое обеспечение предпринимательской деятельности", "ст.пр. Миненко Е.В.", "1-6", "лекция"),
    lesson("h6", 3, "above", "14:40", "16:15", "Макроэкономика", "доц. Алексеенко Т. С., ст. пр. Нилова С. С.", "1-13", "практика"),
    lesson("h7", 3, "under", "14:40", "16:15", "Теория вероятностей", "доц. Грибовская М. А.", "1-6", "лекция"),

    lesson("f1", 4, "under", "09:00", "10:35", "Статистика", "пр. Лавшук Т.Н.", "4-25", "практика"),
    lesson("f2", 4, "both", "10:50", "12:25", "Высшая математика", "пр. Грибовская В.А.", "1-6", "лекция"),
    lesson("f3", 4, "above", "12:55", "14:30", "Организация и технология торговли", "ст. пр. Бурмистова Н. А.", "4-7", "практика"),
    lesson("f4", 4, "under", "12:55", "14:30", "Макроэкономика", "доц. Алексеенко Т. С., ст. пр. Нилова С. С.", "1-13", "практика"),
    lesson("f5", 4, "above", "14:40", "16:15", "Товароведение прод. тов.", "доц. Бань М. Ф.", "1-30", "лекция"),
    lesson("f6", 4, "under", "14:40", "16:15", "Противодействие коррупции", "доц. Аксеонов А. Н.", "М.А.З", "лекция"),

    lesson("s1", 5, "both", "09:00", "10:35", "Управление цепями поставок", "доц. Соловьева Л.Л.", "1-22", "лекция"),
    lesson("s2", 5, "above", "10:50", "12:25", "Управление цепями поставок", "доц. Соловьева Л.Л.", "1-13", "практика"),
    lesson("s3", 5, "under", "10:55", "12:55", "Организация и технология торговли", "ст. пр. Бурмистова Н. А.", "4-18", "практика"),
    lesson("s4", 5, "above", "12:55", "14:30", "Организация и правовое обеспечение предпринимательской деятельности", "ст.пр. Миненко Е.В.", "1-22", "практика"),
    lesson("s5", 5, "under", "12:55", "14:30", "Управление цепями поставок", "доц. Соловьева Л.Л.", "1-22", "практика"),
  ];
  return {
    groupName: "Л-22",
    numeratorMonday: "2026-09-07",
    students: [],
    lessons,
    records: [],
    deadlines: [],
  };
}

export function demoJournal(): JournalData {
  return l22Journal();
}

export function blankJournal(): JournalData {
  return {
    groupName: "Л-22",
    numeratorMonday: "2026-09-07",
    students: [],
    lessons: [],
    records: [],
    deadlines: [],
  };
}
