import { restoreSession } from "./study.js";

export const PROGRESS_KEY = "@learn-japanese/progress:v1";

export function createProgressStorage(storage) {
  let pending = Promise.resolve();
  return {
    async load() {
      const raw = await storage.getItem(PROGRESS_KEY);
      return raw === null ? null : restoreSession(raw);
    },
    async save(session) {
      const snapshot = JSON.stringify(session);
      const write = pending.catch(() => {}).then(() => storage.setItem(PROGRESS_KEY, snapshot));
      pending = write;
      return write;
    },
  };
}
