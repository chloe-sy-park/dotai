export type Locale = "en" | "ko";

export const messages = {
  en: {
    site_title: "dotai",
    tagline: "Open catalog of AI assistant commands, skills, and rules.",
    browse: "Browse",
    contribute: "Contribute",
    ideas: "Ideas",
    contributors: "Contributors",
    asset_count: (n: number) => `${n} asset${n === 1 ? "" : "s"} in the catalog`,
    by: "by",
  },
  ko: {
    site_title: "dotai",
    tagline: "AI 어시스턴트 명령어·스킬·룰 오픈 카탈로그.",
    browse: "탐색",
    contribute: "기여하기",
    ideas: "아이디어",
    contributors: "기여자",
    asset_count: (n: number) => `카탈로그에 ${n}개 항목`,
    by: "작성자",
  },
} as const;

export function t(locale: Locale) {
  return messages[locale];
}
