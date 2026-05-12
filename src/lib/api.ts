import { PromptCategory, PromptGroup, ImageTask, GenerateRequest } from "./types";

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

// 分类 API
export async function getCategories(): Promise<{ data: PromptCategory[] }> {
  return fetchJson(`${API_BASE}/ai-image/prompt-categories`);
}

export async function createCategory(name: string): Promise<{ data: PromptCategory }> {
  return fetchJson(`${API_BASE}/ai-image/prompt-categories`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updateCategory(id: string, data: Partial<PromptCategory>): Promise<{ data: PromptCategory }> {
  return fetchJson(`${API_BASE}/ai-image/prompt-categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await fetchJson(`${API_BASE}/ai-image/prompt-categories/${id}`, { method: "DELETE" });
}

// 提示词组 API
export async function getPromptGroups(params?: { categoryId?: string; search?: string }): Promise<{ data: PromptGroup[] }> {
  const query = new URLSearchParams();
  if (params?.categoryId) query.set("categoryId", params.categoryId);
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

// 生成 API
export async function generateImage(data: GenerateRequest): Promise<{ data: ImageTask }> {
  return fetchJson(`${API_BASE}/ai-image/generate`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getTasks(): Promise<{ data: ImageTask[]; total: number }> {
  return fetchJson(`${API_BASE}/ai-image/tasks`);
}

export async function retryTask(id: string): Promise<{ data: ImageTask }> {
  return fetchJson(`${API_BASE}/ai-image/tasks/${id}/retry`, { method: "POST" });
}

// 上传 API
export async function uploadFile(file: File): Promise<{ data: { url: string; name: string; size: number; type: string } }> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "上传失败");
  }
  return data;
}
