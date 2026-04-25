# Contributing to dotai

Thanks for wanting to share! Here's everything you need to add a command, propose an idea, or implement someone else's idea.

## EN

### Adding a command

1. Pick the right folder under `commands/<ai-tool>/<command-type>/`
2. Name your file in `kebab-case` matching your command's `name` field
3. Add **frontmatter** at the top (see schema below)
4. Open a PR

The site rebuilds automatically when your PR is merged.

### Frontmatter schema

All command files must start with frontmatter (YAML for `.md`/`.mdc`, `[meta]` table for `.toml`).

```yaml
---
name: my-command           # kebab-case, must match filename
title:
  en: My Command           # required
  ko: 내 명령어             # optional
description:
  en: One-line summary     # required
  ko: 한 줄 요약            # optional
ai_tool: claude            # one of: claude, gemini, opencode, cursor, copilot, aider, continue, cline
command_type: skill        # one of: skill, slash_command, rules, agent, plugin
category: coding           # one of: coding, writing, productivity, design, data, research, personal
tags: [tag1, tag2]         # any descriptive tags
license: MIT               # SPDX identifier
author: your-github-username
source_repo: https://github.com/you/repo  # optional, link to original
created: 2026-04-25        # ISO date
---
```

### Proposing an idea

Open an [Issue](https://github.com/chloe-sy-park/dotai/issues/new?template=idea.yml) with the `idea` template. Use Reactions to vote on others' ideas.

### Implementing someone's idea

1. Comment on the Issue: "I'll take this"
2. Maintainer assigns it to you (or you self-assign)
3. Submit a PR with `Closes #<issue-number>`
4. You'll be credited in the contributors list automatically

### Validation

Each PR runs a workflow that checks:
- Required frontmatter fields are present
- `ai_tool`, `command_type`, `category` are valid enum values
- `license` is a valid SPDX identifier
- File is in the correct folder for its `ai_tool` and `command_type`

If validation fails, fix the issues and push again — the workflow re-runs automatically.

---

## 한국어

### 명령어 추가하기

1. `commands/<ai-tool>/<command-type>/` 아래 알맞은 폴더 선택
2. 파일명은 `kebab-case`, frontmatter의 `name`과 일치
3. 파일 맨 위에 **frontmatter** 추가 (위 스키마 참고)
4. PR 열기

PR 머지되면 사이트가 자동 재빌드됩니다.

### 아이디어 제안

[새 Issue](https://github.com/chloe-sy-park/dotai/issues/new?template=idea.yml)에서 `idea` 템플릿으로 등록. 다른 사람 아이디어에는 Reaction으로 투표.

### 다른 사람 아이디어 구현하기

1. Issue에 댓글로 "이거 제가 해볼게요" 표시
2. self-assign 또는 메인테이너가 할당
3. PR 만들 때 본문에 `Closes #<issue-number>`
4. 머지되면 기여자 목록에 자동 등재

### 검증

모든 PR은 자동 검증 통과해야 머지 가능:
- frontmatter 필수 필드
- enum 값 유효성 (`ai_tool`, `command_type`, `category`)
- SPDX 라이센스 코드
- 파일이 올바른 폴더에 위치

검증 실패하면 수정 후 다시 push → 워크플로우 자동 재실행.

---

## Code of Conduct

Be kind. Be specific. Help others learn. We're all figuring this out together.

친절하게, 구체적으로, 서로 배우면서. 함께 만드는 거니까요.
