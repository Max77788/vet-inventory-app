export function catalogSearchFilter(value: string): string | null {
  const term = value.trim().replace(/[(),]/g, "");
  if (!term) return null;
  return `name.ilike.*${term}*,category.ilike.*${term}*`;
}
