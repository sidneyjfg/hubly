export type PaginationInput = {
  limit?: string | number;
  page?: string | number;
};

export type Pagination = {
  limit: number;
  page: number;
};

export type PaginatedResult<T> = {
  items: T[];
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

const defaultPage = 1;
const defaultLimit = 20;
const maxLimit = 100;

function parsePositiveInteger(value: string | number | undefined, fallback: number): number {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return fallback;
  }

  return parsedValue;
}

export function parsePagination(input: PaginationInput = {}): Pagination {
  return {
    page: parsePositiveInteger(input.page, defaultPage),
    limit: Math.min(parsePositiveInteger(input.limit, defaultLimit), maxLimit),
  };
}

export function buildPaginatedResult<T>(items: T[], total: number, pagination: Pagination): PaginatedResult<T> {
  return {
    items,
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / pagination.limit)),
  };
}

export function getPaginationOffset(pagination: Pagination): number {
  return (pagination.page - 1) * pagination.limit;
}
