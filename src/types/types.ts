export type Meta = {
  total: number;
  perPage: number;
  page: number;
  totalPages: number;
};

export type ApiResponse<T> = {
  data: T[];
  meta: Meta;
};
