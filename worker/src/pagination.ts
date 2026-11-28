import { z } from "zod";
import type { PageInfo } from "../../shared/admin";

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).max(Number.MAX_SAFE_INTEGER).default(1),
  pageSize: z.enum(["20", "50", "100"]).default("50").transform(Number),
  sort: z.enum(["newest", "oldest"]).default("newest"),
});

export function pageInfo(
  total: number,
  requestedPage: number,
  pageSize: number,
): PageInfo {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    total,
    page: Math.min(requestedPage, totalPages),
    pageSize,
    totalPages,
  };
}
