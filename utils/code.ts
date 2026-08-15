export function generateCode(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${slug}-${rand}`;
}
