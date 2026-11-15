import type {
  ApiError,
  Branch,
  BranchInput,
  Category,
  CategoryInput,
  LoginResponse,
  MenuItem,
  MenuItemInput,
  UploadResponse,
} from "./types";

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080/api").replace(
  /\/$/,
  "",
);

const TOKEN_KEY = "bergeerd_admin_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Custom error carrying the parsed body so callers can show field errors.
export class HttpError extends Error {
  status: number;
  body: ApiError | null;
  constructor(status: number, body: ApiError | null, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // 204 or empty body -> return null cast.
  if (res.status === 204) {
    return null as T;
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (res.status === 401 && auth) {
    // Expired session: AuthProvider listens for "storage" and shows the login page.
    clearToken();
    window.dispatchEvent(new Event("storage"));
  }
  if (!res.ok) {
    const message = data?.error || `Request failed with status ${res.status}`;
    throw new HttpError(res.status, data ?? null, message);
  }

  // The backend wraps payloads in { "data": ... }.
  return (data?.data ?? data) as T;
}

// ----- Auth -----
const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});

export function login(username: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/auth/login", json("POST", { username, password }), false);
}

// ----- Branches -----
export function listBranches(): Promise<Branch[]> {
  return request<Branch[]>("/admin/branches");
}

export function createBranch(input: BranchInput): Promise<Branch> {
  return request<Branch>("/admin/branches", json("POST", input));
}

export function updateBranch(id: string, input: BranchInput): Promise<Branch> {
  return request<Branch>(`/admin/branches/${id}`, json("PUT", input));
}

export function deleteBranch(id: string): Promise<void> {
  return request<void>(`/admin/branches/${id}`, { method: "DELETE" });
}

// ----- Menu items (scoped to a branch) -----
export function listMenuItems(branchId: string): Promise<MenuItem[]> {
  return request<MenuItem[]>(`/admin/menu?branch_id=${branchId}`);
}

export function createMenuItem(branchId: string, input: MenuItemInput): Promise<MenuItem> {
  return request<MenuItem>("/admin/menu", json("POST", { ...input, branch_id: branchId }));
}

export function updateMenuItem(id: string, input: MenuItemInput): Promise<MenuItem> {
  return request<MenuItem>(`/admin/menu/${id}`, json("PUT", input));
}

export function deleteMenuItem(id: string): Promise<void> {
  return request<void>(`/admin/menu/${id}`, { method: "DELETE" });
}

// ----- Categories (scoped to a branch) -----
export function listCategories(branchId: string): Promise<Category[]> {
  return request<Category[]>(`/admin/categories?branch_id=${branchId}`);
}

export function createCategory(branchId: string, input: CategoryInput): Promise<Category> {
  return request<Category>("/admin/categories", json("POST", { ...input, branch_id: branchId }));
}

export function updateCategory(id: string, input: CategoryInput): Promise<Category> {
  return request<Category>(`/admin/categories/${id}`, json("PUT", input));
}

export function deleteCategory(id: string): Promise<void> {
  return request<void>(`/admin/categories/${id}`, { method: "DELETE" });
}

// ----- Image upload -----
export function uploadImage(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("image", file);
  return request<UploadResponse>("/admin/upload", {
    method: "POST",
    body: form,
  });
}
