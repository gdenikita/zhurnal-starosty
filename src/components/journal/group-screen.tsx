import { useRef, useState } from "react";
import { Download, Plus, Trash2, Upload } from "lucide-react";
import { plural } from "@/lib/journal/model";
import { parseJournalImport, useJournal } from "@/lib/journal/store";
import { useGate, useOwner } from "@/lib/journal/owner";
import { StudentSheet } from "@/components/journal/student-sheet";
import { FieldLabel, PrimaryButton, QuietButton, Sheet, fieldClass } from "@/components/journal/ui";

export function GroupScreen() {
  const data = useJournal();
  const [name, setName] = useState("");
  const [bulk, setBulk] = useState("");
  const [groupDraft, setGroupDraft] = useState(data.groupName);
  const [confirmClear, setConfirmClear] = useState(false);
  const [message, setMessage] = useState("");
  const [person, setPerson] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const ask = useGate((s) => s.ask);
  const unlocked = useOwner((s) => s.unlocked);
  const hasPin = useOwner((s) => Boolean(s.pinHash));
  const lock = useOwner((s) => s.lock);

  function exportFile() {
    const payload = {
      groupName: data.groupName,
      numeratorMonday: data.numeratorMonday,
      students: data.students,
      lessons: data.lessons,
      records: data.records,
      deadlines: data.deadlines,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "zhurnal-starosty.json";
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Файл скачан. Храните его как запасную копию.");
  }

  async function onFile(file: File) {
    try {
      const text = await file.text();
      data.replaceAll(parseJournalImport(text));
      setGroupDraft(parseJournalImport(text).groupName);
      setMessage("Журнал загружен с этого устройства.");
      setConfirmClear(false);
    } catch {
      setMessage("Файл не похож на журнал. Нужен json, который выгрузили отсюда.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Sheet>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            data.renameGroup(groupDraft);
            setMessage("Название сохранено.");
          }}
        >
          <label>
            <FieldLabel>Группа</FieldLabel>
            <input className={fieldClass} value={groupDraft} onChange={(e) => setGroupDraft(e.target.value)} />
          </label>
          <QuietButton type="submit">Сохранить название</QuietButton>
        </form>
      </Sheet>

      <Sheet>
        <h2 className="font-display text-xl">Только вы</h2>
        <p className="mt-2 text-sm text-muted">
          {hasPin
            ? unlocked
              ? "Код введён. Можно отмечать людей и менять список. После закрытия страницы код спросят снова."
              : "Список и отметки закрыты кодом. Его знаете только вы."
            : "Код ещё не задан. Его спросят, когда вы впервые добавите человека или поставите отметку."}
        </p>
        {unlocked && (
          <QuietButton type="button" className="mt-3" onClick={lock}>
            Закрыть доступ
          </QuietButton>
        )}
      </Sheet>

      <div>
        <h2 className="font-display text-xl">
          Студенты · {data.students.length} {plural(data.students.length, "человек", "человека", "человек")}
        </h2>
      </div>
      <Sheet>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            ask(() => {
              data.addStudent(name);
              setName("");
            });
          }}
        >
          <input
            className={fieldClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Фамилия и имя"
            aria-label="Фамилия и имя"
          />
          <PrimaryButton type="submit" aria-label="Добавить студента" className="shrink-0 px-3">
            <Plus className="size-4" />
          </PrimaryButton>
        </form>
      </Sheet>
      <Sheet>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const names = bulk
              .split(/\n+/)
              .map((line) => line.replace(/^\d+[\).]\s*/, "").trim())
              .filter(Boolean);
            ask(() => {
              for (const student of names) data.addStudent(student);
              setBulk("");
            });
          }}
        >
          <label>
            <FieldLabel>Сразу списком</FieldLabel>
            <textarea
              className="h-28 w-full resize-none rounded-xl border border-line bg-paper px-3 py-2 text-base text-ink outline-none focus:border-forest"
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              placeholder={"Белова Анна\nГромов Илья"}
            />
          </label>
          <QuietButton type="submit" disabled={!bulk.trim()}>
            Добавить всех из списка
          </QuietButton>
        </form>
      </Sheet>
      <ul className="flex flex-col gap-2">
        {data.students.length === 0 && (
          <li className="text-sm text-muted">Пока никого нет — добавьте список группы. По фамилии потом откроются пропуски.</li>
        )}
        {data.students.map((student, index) => (
          <li key={student.id} className="flex items-center gap-3 rounded-2xl border border-line bg-sheet px-4 py-2">
            <span className="w-6 text-sm text-muted">{index + 1}</span>
            <button
              type="button"
              onClick={() => setPerson(student.id)}
              className="min-w-0 flex-1 truncate text-left font-medium"
            >
              {student.name}
            </button>
            <button type="button" aria-label={`Удалить ${student.name}`} onClick={() => ask(() => data.removeStudent(student.id))} className="p-2 text-muted">
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      {person && <StudentSheet studentId={person} onClose={() => setPerson(null)} />}

      <Sheet>
        <h2 className="font-display text-xl">Данные только у вас</h2>
        <p className="mt-2 text-sm text-muted">
          Журнал хранится в этом браузере. Сервер, подписка и включённый компьютер не нужны: откройте страницу
          с телефона и отмечайте пары на паре. Чтобы перенести группу на другое устройство, выгрузите файл и
          загрузите его там.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <QuietButton type="button" onClick={exportFile}>
            <Download className="size-4" />
            Скачать
          </QuietButton>
          <QuietButton type="button" onClick={() => ask(() => fileRef.current?.click())}>
            <Upload className="size-4" />
            Загрузить
          </QuietButton>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) ask(() => void onFile(file));
            event.target.value = "";
          }}
        />
        {message && <p className="mt-3 text-sm text-forest">{message}</p>}
      </Sheet>

      <Sheet>
        <h2 className="font-display text-xl">Почему это не Telegram-бот</h2>
        <p className="mt-2 text-sm text-muted">
          Бот в Telegram отвечает, только пока где-то постоянно работает программа. Без своего сервера и без
          компьютера, который не выключается, бот молчит. Здесь та же работа старосты — список, расписание,
          посещаемость и текст сводки, который вставляется в чат группы, — но всё считается на вашем устройстве.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <QuietButton
            type="button"
            onClick={() => {
              data.loadDemo();
              setGroupDraft("Л-22");
              setMessage("Расписание Л-22 снова из вашего файла. Список студентов остался.");
            }}
          >
            Вернуть расписание Л-22
          </QuietButton>
          {!confirmClear ? (
            <button type="button" onClick={() => setConfirmClear(true)} className="h-11 text-sm font-semibold text-clay">
              Очистить журнал
            </button>
          ) : (
            <PrimaryButton
              type="button"
              className="bg-clay"
              onClick={() => {
                ask(() => {
                  data.clearAll();
                  setConfirmClear(false);
                  setMessage("Список и отметки стёрты. Расписание на месте.");
                });
              }}
            >
              Да, удалить всё на этом устройстве
            </PrimaryButton>
          )}
        </div>
      </Sheet>
    </div>
  );
}
