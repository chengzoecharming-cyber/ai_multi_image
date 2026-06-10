export const V2_SESSION_FETCH_LIMIT = 300;

export function getV2SessionsUrl() {
  return `/api/ai-image/v2/sessions?limit=${V2_SESSION_FETCH_LIMIT}`;
}
