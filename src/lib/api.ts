import { PromptGroup, ImageTask, GenerateRequest } from "./types";
import { uploadImageFile } from "./image-upload";

const API_BASE = "/api";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `请求失败: ${res.status}`);
  }
  return data;
}

// ==================== 我的模板 API (原提示词组) ====================
export async function getPromptGroups(params?: { search?: string }): Promise<{ data: PromptGroup[] }> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  return fetchJson(`${API_BASE}/ai-image/prompt-groups?${query.toString()}`);
}

export async function getPromptGroup(id: string): Promise<{ data: PromptGroup }> {
  return fetchJson(`${API_BASE}/ai-image/prompt-groups/${id}`);
}

export async function createPromptGroup(data: Partial<PromptGroup>): Promise<{ data: PromptGroup }> {
  return fetchJson(`${API_BASE}/ai-image/prompt-groups`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePromptGroup(id: string, data: Partial<PromptGroup>): Promise<{ data: PromptGroup }> {
  return fetchJson(`${API_BASE}/ai-image/prompt-groups/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePromptGroup(id: string): Promise<void> {
  await fetchJson(`${API_BASE}/ai-image/prompt-groups/${id}`, { method: "DELETE" });
}

export async function duplicatePromptGroup(id: string): Promise<{ data: PromptGroup }> {
  return fetchJson(`${API_BASE}/ai-image/prompt-groups/${id}/duplicate`, { method: "POST" });
}

// ==================== 生成 API ====================
export async function generateImage(data: GenerateRequest): Promise<{ data: ImageTask }> {
  return fetchJson(`${API_BASE}/ai-image/generate`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ==================== 生成历史 API ====================
export async function getTasks(): Promise<{ data: ImageTask[]; total: number }> {
  return fetchJson(`${API_BASE}/ai-image/tasks`);
}

export async function retryTask(id: string): Promise<{ data: ImageTask }> {
  return fetchJson(`${API_BASE}/ai-image/tasks/${id}/retry`, { method: "POST" });
}

export async function deleteTask(id: string): Promise<void> {
  await fetchJson(`${API_BASE}/ai-image/tasks/${id}`, { method: "DELETE" });
}

// ==================== 上传 API ====================
export async function uploadFile(file: File): Promise<{ data: { url: string; name: string; size: number; type: string } }> {
  return uploadImageFile(file, { endpoint: `${API_BASE}/upload` });
}
