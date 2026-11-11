// ─── API Response Types ────────────────────────────────────────────────
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  status: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};
