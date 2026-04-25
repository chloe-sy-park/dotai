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
    search_placeholder: "Search title, description, tags…",
    filter_ai_tool: "AI tool",
    filter_command_type: "Type",
    filter_category: "Category",
    filter_all: "All",
    no_results: "No matches.",
    download_raw: "Download raw",
    view_on_github: "View on GitHub",
    metadata: "Metadata",
    tags_label: "Tags",
    license_label: "License",
    author_label: "Author",
    created_label: "Created",
    asset_type_label: "Type",
    back_to_browse: "← Browse",
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
    search_placeholder: "제목·설명·태그 검색…",
    filter_ai_tool: "AI 도구",
    filter_command_type: "타입",
    filter_category: "카테고리",
    filter_all: "전체",
    no_results: "결과 없음.",
    download_raw: "원본 다운로드",
    view_on_github: "GitHub에서 보기",
    metadata: "메타데이터",
    tags_label: "태그",
    license_label: "라이센스",
    author_label: "작성자",
    created_label: "작성일",
    asset_type_label: "타입",
    back_to_browse: "← 탐색",
  },
} as const;

export function t(locale: Locale) {
  return messages[locale];
}

export function localePath(locale: Locale, path: string): string {
  // path expected to start with "/"
  if (locale === "en") return path;
  if (path === "/") return "/ko/";
  return "/ko" + path;
}

export function toggleLocale(locale: Locale, currentPath: string): { locale: Locale; href: string } {
  if (locale === "ko") {
    const stripped = currentPath.replace(/^\/ko/, "");
    return { locale: "en", href: stripped || "/" };
  }
  return { locale: "ko", href: localePath("ko", currentPath) };
}
