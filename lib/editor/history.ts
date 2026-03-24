import { HISTORY_LIMIT } from "@/lib/constants";

export function cloneCells(cells: string[]) {
  return [...cells];
}

export function pushPastSnapshot(
  past: string[][],
  snapshot: string[],
  limit = HISTORY_LIMIT,
) {
  const nextPast = [...past, cloneCells(snapshot)];

  if (nextPast.length <= limit) {
    return nextPast;
  }

  return nextPast.slice(nextPast.length - limit);
}
