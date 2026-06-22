import axios from "axios";
import type { ApiResponse, Paginated } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20_000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bf_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("bf_refresh_token");
      if (refreshToken) {
        const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(`${API_URL}/auth/refresh`, { refreshToken });
        localStorage.setItem("bf_access_token", response.data.data.accessToken);
        localStorage.setItem("bf_refresh_token", response.data.data.refreshToken);
        original.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export const unwrap = <T>(response: { data: ApiResponse<T> }) => response.data.data;

export const crmList = async <T>(resource: string, params: Record<string, unknown>) =>
  unwrap<Paginated<T>>(await api.get(`/crm/${resource}`, { params }));

export const crmCreate = async <T>(resource: string, payload: unknown) =>
  unwrap<T>(await api.post(`/crm/${resource}`, payload));

export const crmUpdate = async <T>(resource: string, id: string, payload: unknown) =>
  unwrap<T>(await api.patch(`/crm/${resource}/${id}`, payload));

export const crmDelete = async (resource: string, id: string) =>
  unwrap<{ deleted: boolean }>(await api.delete(`/crm/${resource}/${id}`));

export const crmDetail = async <T>(resource: string, id: string) =>
  unwrap<T>(await api.get(`/crm/${resource}/${id}`));
