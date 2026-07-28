/** Build the serving URL for a stored venue photo object path (e.g. /objects/uploads/uuid). */
export function photoUrl(objectPath: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/api/storage${objectPath}`;
}
