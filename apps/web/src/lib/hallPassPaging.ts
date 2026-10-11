export const HALL_PASS_PAGE_SIZES = [25, 50, 100, 200] as const;
export type HallPassPageSize = (typeof HALL_PASS_PAGE_SIZES)[number];
export type HallPassListTab = "active" | "invalidated";
export type HallPassStatusFilter = "all" | "unused" | "used";

export type HallPassListParams = {
  page?: number;
  limit?: number;
  tab?: HallPassListTab;
  status?: HallPassStatusFilter;
  search?: string;
};

export function normalizeHallPassPageSize(limit?: number): HallPassPageSize {
  return (HALL_PASS_PAGE_SIZES as readonly number[]).includes(limit ?? 50)
    ? ((limit ?? 50) as HallPassPageSize)
    : 50;
}
