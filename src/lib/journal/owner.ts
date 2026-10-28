import { create } from "zustand";
import { persist } from "zustand/middleware";

async function sha(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`starosta:${pin}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

type OwnerState = {
  pinHash: string | null;
  unlocked: boolean;
  setPin: (pin: string) => Promise<boolean>;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
};

export const useOwner = create<OwnerState>()(
  persist(
    (set, get) => ({
      pinHash: null,
      unlocked: false,
      setPin: async (pin) => {
        const trimmed = pin.trim();
        if (trimmed.length < 4) return false;
        set({ pinHash: await sha(trimmed), unlocked: true });
        return true;
      },
      unlock: async (pin) => {
        const hash = get().pinHash;
        if (!hash) return false;
        const ok = (await sha(pin.trim())) === hash;
        if (ok) set({ unlocked: true });
        return ok;
      },
      lock: () => set({ unlocked: false }),
    }),
    {
      name: "starosta-owner-v1",
      partialize: (state) => ({ pinHash: state.pinHash }),
    },
  ),
);

type GateState = {
  open: boolean;
  error: string;
  pending: (() => void) | null;
  ask: (run: () => void) => void;
  close: () => void;
  fail: (message: string) => void;
};

export const useGate = create<GateState>((set) => ({
  open: false,
  error: "",
  pending: null,
  ask: (run) => {
    if (useOwner.getState().unlocked) {
      run();
      return;
    }
    set({ open: true, error: "", pending: run });
  },
  close: () => set({ open: false, pending: null, error: "" }),
  fail: (message) => set({ error: message }),
}));
