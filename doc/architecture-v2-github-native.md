# 아키텍처 v2 — GitHub-Native (Zero-Cost)

> v1(Supabase 기반) **폐기**. 운영 비용 0 + 트래픽 무한 흡수 + OSS 철학 100% 정렬.

---

## 0. 핵심 원칙

1. **운영 비용 = 도메인 1년치 ($12)**. 그 외 모든 게 무료 + 자동 스케일.
2. **GitHub이 백엔드**. 우리는 뷰어 + 컨트리뷰션 헬퍼만 만든다.
3. **DB 없음**. 모든 데이터는 git 파일 = 영구 보존 + 누구나 fork 가능.
4. **PR이 컨트리뷰션 메커니즘**. 자연스러운 품질 관리.
5. **트래픽 폭주가 재앙이 아니라 영광**. Cloudflare가 받아냄.

---

## 1. 아키텍처

```
┌─────────────────────────────────────┐
│  ai-command-hub (GitHub repo)       │  ← 단일 진실 소스
│                                     │
│  commands/                          │
│    claude/skills/*.md               │
│    gemini/commands/*.toml           │
│    opencode/agent/*.md              │
│    cursor/rules/*.mdc               │
│  mcp-servers/*.md                   │
│  REGISTRY.json (자동 생성)          │
│                                     │
│  Issues = 아이디어 보드             │
│  Discussions = 커뮤니티 / 댓글      │
│  Reactions = 투표                   │
└──────────┬──────────────────────────┘
           │ GitHub API + raw.githubusercontent
           ▼
┌─────────────────────────────────────┐
│  Static SPA (Next.js export)        │
│  Hosted on Cloudflare Pages          │
│                                     │
│  - 검색 (Fuse.js, 클라이언트)       │
│  - 필터 (AI / 타입 / 카테고리)      │
│  - 명령어 미리보기 + 다운로드       │
│  - 기여자 명예의 전당               │
│  - 아이디어 보드 (Issues 미러)      │
│  - 업로드 폼 → GitHub PR 자동 생성  │
│  - giscus 댓글 임베드               │
└─────────────────────────────────────┘
```

---

## 2. Repo 구조

```
ai-command-hub/
├── commands/
│   ├── claude/
│   │   ├── skills/<name>.md
│   │   ├── slash/<name>.md
│   │   ├── agents/<name>.md
│   │   └── plugins/<name>.json
│   ├── gemini/
│   │   ├── commands/<name>.toml
│   │   └── rules/GEMINI.md
│   ├── opencode/
│   │   ├── agents/<name>.md
│   │   ├── commands/<name>.md
│   │   └── rules/AGENTS.md
│   ├── cursor/
│   │   └── rules/<name>.mdc
│   └── copilot/
│       └── prompts/<name>.prompt.md
├── mcp-servers/
│   └── <name>.md           # MCP 서버 카탈로그 항목
├── REGISTRY.json           # 자동 생성 인덱스
├── CONTRIBUTORS.md         # all-contributors 봇 관리
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── new-command.yml
│   │   ├── idea.yml
│   │   └── bug.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       ├── build-registry.yml      # PR/머지 시 REGISTRY.json 갱신
│       ├── validate-contribution.yml  # frontmatter / SPDX 라이센스 검증
│       └── deploy-site.yml          # Cloudflare Pages 배포
├── site/                            # 정적 사이트 소스
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── messages/{en,ko}.json
└── README.md
```

---

## 3. 각 명령어 파일 스키마

모든 명령어 파일은 **YAML frontmatter**로 시작 (TOML 파일은 `[meta]` 테이블).

```yaml
---
name: code-reviewer
title:
  en: AI Code Reviewer
  ko: AI 코드 리뷰어
description:
  en: Reviews PRs for security and performance issues
  ko: 보안·성능 이슈를 잡아내는 PR 리뷰어
ai_tool: claude
command_type: skill
category: coding
tags: [code-review, security, performance]
license: MIT
author: chloe-park
source_repo: https://github.com/chloe-park/my-claude-skills
created: 2026-04-25
---

# 실제 명령어 내용 (Claude Skill 본문)
...
```

빌드 워크플로우가 모든 파일의 frontmatter를 긁어서 `REGISTRY.json` 만듦.

---

## 4. REGISTRY.json (자동 생성, 클라이언트가 fetch)

```json
{
  "generated_at": "2026-04-25T10:00:00Z",
  "version": 1,
  "assets": [
    {
      "id": "claude/skills/code-reviewer",
      "path": "commands/claude/skills/code-reviewer.md",
      "raw_url": "https://raw.githubusercontent.com/.../code-reviewer.md",
      "issue_url": "https://github.com/.../issues?q=label:code-reviewer",
      "ai_tool": "claude",
      "command_type": "skill",
      "category": "coding",
      "tags": ["code-review", "security"],
      "title": { "en": "...", "ko": "..." },
      "description": { "en": "...", "ko": "..." },
      "license": "MIT",
      "author": "chloe-park",
      "reactions": { "+1": 12, "heart": 5, "rocket": 3 },
      "size_bytes": 4231,
      "created": "2026-04-25"
    }
  ]
}
```

reactions 카운트는 빌드 시 GitHub API로 갱신 (commit comments 또는 issue 연결).

---

## 5. 기능 → GitHub 매핑

| 사이트 기능 | 구현 |
|---|---|
| **검색** | REGISTRY.json + Fuse.js (클라이언트) |
| **필터** | REGISTRY.json 클라이언트 필터링 |
| **다운로드** | `raw.githubusercontent.com` 직접 링크 |
| **투표 (보기)** | GitHub Reactions API (캐싱된 카운트) |
| **투표 (하기)** | GitHub OAuth 로그인 → Reactions API 직접 호출 |
| **명령어 등록** | 사이트 폼 → GitHub PR 자동 생성 (octokit + 사용자 토큰) |
| **아이디어 보드** | Issues with label `idea` 미러링 |
| **아이디어 제출** | 사이트 폼 → Issue 자동 생성 |
| **"이거 만들게요"** | Issue self-assign |
| **댓글** | giscus (Discussions 기반) 임베드 |
| **명예의 전당** | all-contributors 봇 + REGISTRY 집계 |
| **Fork** | git fork 그대로 |
| **Cross-tool 변환본** | 같은 디렉토리 내 다른 포맷 파일 (메타에 `variants_of` 필드) |

---

## 6. 아이디어 선발대회 메커니즘 (자연발생)

```
1. 누군가 사이트에서 "💡 아이디어 등록" 클릭
   └→ GitHub Issue 생성 (label: idea)

2. 다른 사람들이 사이트 또는 GitHub에서 reaction
   └→ 좋아요 많이 받은 아이디어가 보드 상단으로

3. 누군가 "이거 제가 만들어볼게요" 클릭
   └→ Issue self-assign (label: in-progress)

4. 구현 후 PR 생성, "fixes #123"
   └→ 머지되면 Issue 자동 close, label: implemented

5. 명예 자동 적립
   ├→ all-contributors 봇이 README + CONTRIBUTORS.md 업데이트
   ├→ 사이트 명예의 전당에 자동 반영
   └→ 월별 MVP 기여자 자동 집계 (Discussion 자동 포스팅)

6. 칭찬
   ├→ Discussions 카테고리: "Thanks Board"
   └→ PR/Issue 댓글 + reactions
```

**보상 단계:**
- 🥉 Bronze: 명령어 1개 또는 아이디어 5개
- 🥈 Silver: 명령어 5개 또는 구현 3개
- 🥇 Gold: 명령어 15개 또는 핵심 컨트리뷰터
- 👑 명예의 전당: 누적 reactions Top 10

배지는 사이트 프로필 + GitHub README 모두에 표시.

---

## 7. 비용 매트릭스

| 항목 | 서비스 | 무료 tier 한도 | 트래픽 폭주 시 |
|---|---|---|---|
| 호스팅 | Cloudflare Pages | **무제한 대역폭** | 그대로 동작 |
| Repo | GitHub (public) | 무제한 | 그대로 동작 |
| 도메인 | Cloudflare Registrar | $10/년 (.dev) ~ $12/년 (.org) | 영향 없음 |
| 댓글 | giscus | 무료 영구 | GitHub API rate limit (사용자별) |
| 분석 | Cloudflare Web Analytics | 무료 | 그대로 동작 |
| 빌드 | GitHub Actions | 공개 repo는 무제한 | PR 폭주 시 큐잉 |

**총 운영비: 연 $10-12**

CDN/대역폭/DB/Storage/함수 — 다 무료.

---

## 8. 기술 스택 (수정)

| 항목 | 선택 |
|---|---|
| Framework | **Next.js (Static Export)** 또는 **Astro** |
| Styling | Tailwind + shadcn/ui |
| 검색 | Fuse.js (클라이언트) |
| GitHub API | Octokit |
| i18n | next-intl 또는 Astro i18n |
| 호스팅 | Cloudflare Pages |
| 댓글 | giscus |
| 분석 | Cloudflare Web Analytics |
| Auth | GitHub OAuth (Octokit Device Flow, 서버 불필요) |

**Astro 추천:** 정적 사이트 최적화 + island 아키텍처 + 더 가벼움. Next.js보다 적합.

---

## 9. v1 자산 처리

- ❌ `db-schema.sql` — 폐기 (참고용으로만 보존)
- ✅ `ai-command-hub-taxonomy.md` v0.2 — **그대로 유지**, frontmatter 스키마의 기준
- ⚠️ `nextjs-setup-guide.md` — 절반은 폐기, i18n/컴포넌트 부분만 재활용

---

## 10. 새 MVP 빌드 순서

| 순서 | 항목 | 비고 |
|---|---|---|
| 1 | GitHub repo 생성 + 폴더 구조 | `ai-command-hub` 또는 결정된 이름 |
| 2 | Issue/PR 템플릿 + 라벨 셋업 | idea, bug, in-progress, implemented 등 |
| 3 | 시드 명령어 5-10개 (Chloe 본인 자산) | Claude/Gemini/opencode 골고루 |
| 4 | `build-registry.yml` 워크플로우 | frontmatter → REGISTRY.json |
| 5 | `validate-contribution.yml` | 필수 필드 + SPDX 검증 |
| 6 | Astro 프로젝트 + i18n 셋업 | en/ko |
| 7 | 홈 + 브라우즈 페이지 (Fuse.js 검색/필터) | REGISTRY.json fetch |
| 8 | 상세 페이지 + raw 다운로드 + 리액션 표시 | |
| 9 | 업로드 폼 → PR 자동 생성 (Octokit) | GitHub OAuth Device Flow |
| 10 | 아이디어 보드 (Issues 미러) | label=idea 필터 |
| 11 | 명예의 전당 + 배지 시스템 | all-contributors 통합 |
| 12 | giscus 댓글 임베드 | |
| 13 | Cloudflare Pages 배포 + 도메인 연결 | 끝 |

---

## 11. 결정 필요

- [ ] **사이트 프레임워크**: Astro vs Next.js Static Export
- [ ] **도메인**: `dotai.dev` / `aihub.dev` / `commands.sh` / `ai-commands.org` 등
- [ ] **레포 이름**: `ai-command-hub` / `dotai` / `commands` 등
- [ ] **시드 명령어**: Chloe 본인 자산 중 어떤 걸 먼저 올릴지
- [ ] **유지보수 정책**: PR 리뷰 누가? (Chloe 단독 → 코어 팀 → 자동 머지 봇)
