import { useState, type FormEvent } from "react";
import { useGate, useOwner } from "@/lib/journal/owner";
import { FieldLabel, PrimaryButton, QuietButton, fieldClass } from "@/components/journal/ui";

export function OwnerGate() {
  const open = useGate((s) => s.open);
  const error = useGate((s) => s.error);
  const close = useGate((s) => s.close);
  const fail = useGate((s) => s.fail);
  const pending = useGate((s) => s.pending);
  const hasPin = useOwner((s) => Boolean(s.pinHash));
  const setPin = useOwner((s) => s.setPin);
  const unlock = useOwner((s) => s.unlock);
  const [pin, setValue] = useState("");

  if (!open) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const ok = hasPin ? await unlock(pin) : await setPin(pin);
    if (!ok) {
      fail(hasPin ? "Код не подошёл." : "Нужно хотя бы 4 символа.");
      return;
    }
    const run = pending;
    setValue("");
    close();
    run?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center">
      <form onSubmit={(event) => void submit(event)} className="w-full max-w-lg rounded-t-3xl bg-paper px-4 py-5 sm:rounded-3xl">
        <h2 className="font-display text-2xl">{hasPin ? "Код старосты" : "Задайте код"}</h2>
        <p className="mt-2 text-sm text-muted">
          {hasPin
            ? "Отмечать людей и менять список может только тот, кто знает этот код."
            : "Этот код будете знать только вы. Без него список группы и отметки не меняются."}
        </p>
        <label className="mt-4 block">
          <FieldLabel>Код</FieldLabel>
          <input
            className={fieldClass}
            type="password"
            autoComplete="off"
            value={pin}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />
        </label>
        {error && <p className="mt-2 text-sm text-ink">{error}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <QuietButton
            type="button"
            onClick={() => {
              setValue("");
              close();
            }}
          >
            Отмена
          </QuietButton>
          <PrimaryButton type="submit">Открыть</PrimaryButton>
        </div>
      </form>
    </div>
  );
}
