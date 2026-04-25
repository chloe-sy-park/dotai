<!-- markdownlint-disable MD041 -->
<div align="center">

# dotai

**Open catalog of AI assistant commands, skills, and rules.**
**AI 어시스턴트 명령어·스킬·룰 오픈 카탈로그.**

[Browse](https://dotai.dev) · [Contribute](./CONTRIBUTING.md) · [Ideas](https://github.com/chloe-sy-park/dotai/issues?q=label:idea)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](./CONTRIBUTING.md)

</div>

---

## EN

**dotai** is a community catalog for AI assistant commands across Claude Code, Gemini CLI, opencode, Cursor, GitHub Copilot, and more. Find commands shared by other developers, vote on what's useful, propose ideas, or contribute your own.

### How it works

1. **Browse** [dotai.dev](https://dotai.dev) — filter by AI tool, category, or command type
2. **Download** any command directly from the GitHub raw URL
3. **Vote** with GitHub Reactions (👍 ❤️ 🚀)
4. **Contribute** by opening a PR or using the upload form on the site
5. **Propose ideas** via Issues — anyone can pick one up to implement

### Why GitHub-native

Everything you see lives in this repository. No closed database, no vendor lock-in. Fork it, mirror it, host your own — it's all MIT licensed.

---

## 한국어

**dotai**는 Claude Code, Gemini CLI, opencode, Cursor, GitHub Copilot 등 여러 AI 어시스턴트의 명령어·스킬·룰을 모아두는 커뮤니티 카탈로그입니다. 다른 개발자들이 공유한 명령어를 찾아 쓰고, 좋은 건 투표하고, 아이디어를 제안하거나 직접 기여하세요.

### 사용 방법

1. **탐색** — [dotai.dev](https://dotai.dev)에서 AI 도구·카테고리·타입으로 필터링
2. **다운로드** — GitHub raw URL로 즉시 받기
3. **투표** — GitHub Reactions (👍 ❤️ 🚀)
4. **기여** — PR 또는 사이트 업로드 폼
5. **아이디어 제안** — Issue로 등록 (label: `idea`), 누구나 구현 가능

### 왜 GitHub-native인가

여기 보이는 모든 게 이 레포에 있습니다. 폐쇄 DB도, 벤더 락인도 없음. fork·미러링·자가 호스팅 모두 환영 — MIT 라이센스.

---

## Repo structure

```
commands/
  claude/{skills,slash,agents,plugins}/
  gemini/{commands,rules}/
  opencode/{agents,commands}/
  cursor/rules/
  copilot/prompts/
mcp-servers/
REGISTRY.json     # auto-generated index, used by site
.github/          # issue/PR templates, workflows
site/             # Astro static site (deployed to Cloudflare Pages)
```

## Tech stack

- **Source of truth**: this Git repo (zero database)
- **Site**: [Astro](https://astro.build) static site, deployed on [Cloudflare Pages](https://pages.cloudflare.com)
- **Search**: [Fuse.js](https://www.fusejs.io) (client-side)
- **Voting**: GitHub Reactions API
- **Comments**: [giscus](https://giscus.app) (GitHub Discussions)
- **i18n**: en / ko

## License

MIT. See [LICENSE](./LICENSE). Each command may declare its own SPDX license in frontmatter.
