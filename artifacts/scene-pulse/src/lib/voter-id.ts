const STORAGE_KEY = "scenepulse.voterId";

export function getVoterId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return "anonymous";
  }
}
