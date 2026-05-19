import type { CopySource } from "@/app/ai-image/v2/types";

export function detectCopySource(userGoal: string): CopySource {
  const trimmed = userGoal.trim();
  const hasQuotedEnglish = /"[A-Z][A-Z\s]{2,30}"/.test(trimmed);
  const isMostlyEnglish = /^[\x00-\x7F]{10,}$/.test(trimmed) && trimmed.length > 10;
  const hasUppercaseSellingPoints = /\b[A-Z]{3,15}(\s+[A-Z]{3,15}){0,3}\b/.test(trimmed);

  if (hasQuotedEnglish || (isMostlyEnglish && hasUppercaseSellingPoints)) {
    const explicitLabelPatterns = [
      /headline\s*[:：]\s*"?([A-Z][A-Za-z\s]+)"?/i,
      /title\s*[:：]\s*"?([A-Z][A-Za-z\s]+)"?/i,
      /selling points?\s*[:：]/i,
      /卖点\s*[:：]/i,
      /标题\s*[:：]/i,
    ];
    const looksExplicit = explicitLabelPatterns.some((p) => p.test(trimmed));
    if (looksExplicit) return "user_exact";
  }

  const hasChinese = /[\u4e00-\u9fff]/.test(trimmed);
  if (hasChinese) return "ai_rewritten";

  return "ai_suggested";
}
