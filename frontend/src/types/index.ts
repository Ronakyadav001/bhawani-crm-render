export type Role = "SUPER_ADMIN" | "SALES_ADMIN" | "YOGA_TRAINER" | "DIETICIAN" | "SUPPORT_ADMIN" | "CLIENT";

export type User = {
  id: string;
  fullName?: string;
  email: string;
  phone?: string;
  role: Role;
  status?: string;
  forcePasswordChange?: boolean;
  home?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type Paginated<T> = {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type RouteKind = "dashboard" | "resource" | "analytics" | "client-profile";

export type PageRoute = {
  path: string;
  label: string;
  icon: string;
  roles: Role[];
  kind: RouteKind;
  resource?: string;
  statusOptions?: string[];
  description?: string;
};
