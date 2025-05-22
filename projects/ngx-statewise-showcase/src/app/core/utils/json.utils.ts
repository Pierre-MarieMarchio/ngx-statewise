export function isSerializable(value: unknown): boolean {
  if (typeof value === 'string') return false;

  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}
