const BASE_URL = process.env.NEXT_PUBLIC_CHATGPT2API_URL || "http://localhost:3000/v1";
const AUTH_KEY = process.env.NEXT_PUBLIC_CHATGPT2API_KEY || "chatgpt2api";
const ADMIN_KEY = process.env.CHATGPT2API_ADMIN_KEY || AUTH_KEY;
const MANAGEMENT_BASE = BASE_URL.replace(/\/v1$/, "");
const DEFAULT_IMAGE_MODEL = process.env.CHATGPT2API_IMAGE_MODEL || process.env.IMAGE_MODEL || "gpt-image-1";

function authHeaders() { return { "Content-Type": "application/json", Authorization: `Bearer ${AUTH_KEY}` }; }
function adminHeaders() { return { "Content-Type": "application/json", Authorization: `Bearer ${ADMIN_KEY}` }; }
function stringifyErrorPayload(payload: unknown): string {
  if (typeof payload === "string") return payload;
  if (!payload || typeof payload !== "object") return String(payload);

  const record = payload as Record<string, unknown>;
  const nestedError = record.error;
  if (typeof nestedError === "string") return nestedError;
  if (nestedError && typeof nestedError === "object") {
    const nested = nestedError as Record<string, unknown>;
    if (typeof nested.message === "string") return nested.message;
    if (typeof nested.code === "string") return `${nested.code}: ${JSON.stringify(nested)}`;
    return JSON.stringify(nested);
  }
  if (typeof record.message === "string") return record.message;
  return JSON.stringify(record);
}

export interface GenerateImageParams { prompt: string; model?: string; n?: number; size?: string; response_format?: "b64_json" | "url"; }
export interface GenerateImageResponse { data: Array<{ url?: string; b64_json?: string }>; }
export async function generateImage(params: GenerateImageParams): Promise<GenerateImageResponse> {
  const res = await fetch(`${BASE_URL}/images/generations`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ model: params.model || DEFAULT_IMAGE_MODEL, prompt: params.prompt, n: params.n || 1, size: params.size, response_format: params.response_format || "url" }) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(stringifyErrorPayload(err) || `生成失败: ${res.status}`);
  }
  return res.json();
}
export async function editImage(params: { prompt: string; images: File[]; model?: string; n?: number; size?: string }): Promise<GenerateImageResponse> {
  const fd = new FormData(); fd.append("model", params.model || DEFAULT_IMAGE_MODEL); fd.append("prompt", params.prompt); fd.append("n", String(params.n || 1));
  for (const image of params.images) {
    fd.append("image", image);
  }
  if (params.size) fd.append("size", params.size);
  const res = await fetch(`${BASE_URL}/images/edits`, { method: "POST", headers: { Authorization: `Bearer ${AUTH_KEY}` }, body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(stringifyErrorPayload(err) || `编辑失败: ${res.status}`);
  }
  return res.json();
}
export async function listModels(): Promise<{ data: Array<{ id: string }> }> { const res = await fetch(`${BASE_URL}/models`, { headers: authHeaders() }); if (!res.ok) throw new Error(`获取模型列表失败: ${res.status}`); return res.json(); }
export interface ChatMessage { role: string; content: string; }
export interface ChatCompletionParams { model?: string; messages: ChatMessage[]; temperature?: number; max_tokens?: number; response_format?: { type: "json_object" }; }
export interface ChatCompletionResponse { id: string; choices: Array<{ message: { role: string; content: string }; finish_reason: string }>; }
export async function chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResponse> { const res = await fetch(`${BASE_URL}/chat/completions`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ model: params.model || "auto", messages: params.messages, temperature: params.temperature ?? 0.7, max_tokens: params.max_tokens ?? 4096, response_format: params.response_format }) }); if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(stringifyErrorPayload(err) || `Chat completion 失败: ${res.status}`); } return res.json(); }
export interface ImageTaskItem { id: string; status: string; mode: string; model: string; size: string; created_at: string; updated_at: string; data?: Array<{ url?: string }>; error?: string; }
export async function submitGenerationTask(params: Record<string, unknown>): Promise<ImageTaskItem> { const res = await fetch(`${MANAGEMENT_BASE}/api/image-tasks/generations`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ client_task_id: params.client_task_id, prompt: params.prompt, model: params.model || DEFAULT_IMAGE_MODEL, size: params.size }) }); if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(stringifyErrorPayload(err) || `提交任务失败: ${res.status}`); } return res.json(); }
export async function listImageTasks(taskIds?: string[]): Promise<unknown> { const qs = taskIds && taskIds.length > 0 ? `?ids=${taskIds.join(",")}` : ""; const res = await fetch(`${MANAGEMENT_BASE}/api/image-tasks${qs}`, { headers: authHeaders() }); if (!res.ok) throw new Error(`查询任务失败: ${res.status}`); return res.json(); }
export interface AccountItem { access_token: string; type?: string; status?: string; quota?: number; image_quota_unknown?: boolean; email?: string | null; user_id?: string | null; success?: number; fail?: number; last_used_at?: string | null; limits_progress?: Array<{ title?: string; value?: string }>; default_model_slug?: string | null; restore_at?: string | null; }
export async function listAccounts(): Promise<unknown> { const res = await fetch(`${MANAGEMENT_BASE}/api/accounts`, { headers: adminHeaders() }); if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(stringifyErrorPayload(err) || `获取账号列表失败: ${res.status}`); } return res.json(); }
export async function createAccounts(params: Record<string, unknown>): Promise<unknown> { const res = await fetch(`${MANAGEMENT_BASE}/api/accounts`, { method: "POST", headers: adminHeaders(), body: JSON.stringify({ tokens: params.tokens || [], accounts: params.accounts || [] }) }); if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(stringifyErrorPayload(err) || `创建账号失败: ${res.status}`); } return res.json(); }
export async function deleteAccounts(tokens: string[]): Promise<unknown> { const res = await fetch(`${MANAGEMENT_BASE}/api/accounts`, { method: "DELETE", headers: adminHeaders(), body: JSON.stringify({ tokens }) }); if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(stringifyErrorPayload(err) || `删除账号失败: ${res.status}`); } return res.json(); }
export async function refreshAccounts(accessTokens: string[]): Promise<unknown> { const res = await fetch(`${MANAGEMENT_BASE}/api/accounts/refresh`, { method: "POST", headers: adminHeaders(), body: JSON.stringify({ access_tokens: accessTokens }) }); if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(stringifyErrorPayload(err) || `刷新账号失败: ${res.status}`); } return res.json(); }
export async function updateAccount(params: Record<string, unknown>): Promise<unknown> { const res = await fetch(`${MANAGEMENT_BASE}/api/accounts`, { method: "PUT", headers: adminHeaders(), body: JSON.stringify({ access_token: params.access_token, type: params.type, status: params.status, quota: params.quota }) }); if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(stringifyErrorPayload(err) || `更新账号失败: ${res.status}`); } return res.json(); }
