export const PALETTE = [
  "#4A5B33", // ink / olive
  "#C1653F", // terracotta
  "#5B7FA6",
  "#B08A3E",
  "#7A5C99",
  "#3E8E7E",
  "#B4544A",
  "#5C6BC0",
] as const;

export function colorAt(index: number): string {
  return PALETTE[index % PALETTE.length];
}
