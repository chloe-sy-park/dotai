# AI Command Hub — 분류 매트릭스 v0.2

> dotgemini.dev 벤치마킹 → **오픈소스** 멀티-AI 명령어 공유 플랫폼
> 목적: AI 도구 × 파일 포맷 × 명령어 타입을 정리해 DB 스키마/UI 필터의 기준으로 사용

**포지션:** OSS 명령어/MCP 공유 사이트. GitHub OAuth 로그인. 영/한 i18n.

---

## 1. AI 도구별 파일 포맷 (1차 분류)

| AI 도구 | 위치 | 주요 포맷 | 식별 키워드 |
|---|---|---|---|
| **Claude Code** | `.claude/skills/<name>/SKILL.md`, `.claude/commands/*.md`, `.claude/agents/*.md` | `.md` (YAML frontmatter), `.json` (plugin manifest) | skill, slash, agent, plugin |
| **Gemini CLI** | `~/.gemini/commands/*.toml` | `.toml` | custom command |
| **Cursor** | `.cursor/rules/*.mdc`, `.cursorrules` (legacy) | `.mdc`, `.cursorrules` | rule, composer |
| **GitHub Copilot** | `.github/copilot-instructions.md`, `.github/prompts/*.prompt.md` | `.md` | instruction, prompt file |
| **Aider** | `.aider.conf.yml`, `CONVENTIONS.md` | `.yml`, `.md` | conventions, config |
| **Continue.dev** | `~/.continue/config.json`, `config.ts` | `.json`, `.ts` | slash, context provider |
| **Cline / Roo** | `.clinerules`, `.roo/rules/` | text, `.md` | rules, custom mode |
| **opencode** (sst) | `.opencode/agent/*.md`, `.opencode/command/*.md`, `opencode.json`, `AGENTS.md` | `.md` (frontmatter), `.json`, `.jsonc` | agent, command, mode |
| **OpenAI (ChatGPT/Codex)** | Custom GPT instructions(웹 전용), `~/.codex/config.toml` | text, `.toml` | system prompt, codex config |

**MVP 우선순위:** Claude Code, Gemini CLI, Cursor, **opencode** 4종부터. Copilot/Aider/Continue/Cline은 v2.

> opencode는 멀티-LLM 지원 + 오픈소스라 핵심 타깃 사용자층(터미널 파워유저)과 겹쳐서 MVP에 포함 추천.

---

## 2. 명령어 타입 (2차 분류) — 통합 추상화

도구별 용어가 다르지만 기능 단위로 묶으면 5가지로 정리됨.

| 통합 타입 | 정의 | 도구별 매핑 |
|---|---|---|
| **Skill** | 호출 시 로드되는 도메인 지식 + 워크플로우 패키지 | Claude Skill, GPTs 'instructions', Cursor Composer recipe |
| **Slash Command** | `/이름`으로 즉시 실행하는 단축 액션 | Claude slash, Gemini TOML command, Continue slash |
| **Rules / Instructions** | 항상 적용되는 시스템 프롬프트 / 컨벤션 | Cursor rules, Copilot instructions, Aider conventions, Cline rules, CLAUDE.md, GEMINI.md |
| **Agent / Subagent** | 독립 페르소나로 실행되는 자동화 워커 | Claude subagent, Cursor background agent |
| **Plugin / Bundle** | 위 항목들 + MCP를 묶은 패키지 | Claude plugin, Continue bundle |

---

## 3. 호환성 매트릭스 (도구 × 타입)

|  | Claude Code | Gemini CLI | Cursor | opencode | Copilot | Aider |
|---|---|---|---|---|---|---|
| Skill | ✅ | ⚠️ (TOML로) | ⚠️ (rule로) | ⚠️ (agent로) | ❌ | ❌ |
| Slash Command | ✅ | ✅ | ⚠️ | ✅ | ⚠️ (prompt files) | ❌ |
| Rules | ⚠️ (CLAUDE.md) | ⚠️ (GEMINI.md) | ✅ | ✅ (AGENTS.md) | ✅ | ✅ |
| Agent | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Plugin | ✅ | ❌ | ❌ | ⚠️ (config 통합) | ❌ | ❌ |

⚠️ = 개념적으로 유사 / 변환 가능 → **cross-tool 변환** 기능의 근거.

---

## 4. 용도 카테고리 (3차 분류)

- **Coding** — code review, refactor, test gen, debug, docs
- **Writing** — blog/SNS, translation, editing
- **Productivity** — task/note, email, summarization
- **Design** — UI/UX feedback, asset prompt
- **Data** — SQL, analytics, viz
- **Research** — literature, web research
- **Personal** — learning, journaling

검색 필터 + 명예의 전당 카테고리로도 사용.

---

## 5. 업로드 시 자동 감지 로직 (의사코드)

```python
def detect(file):
    ext = file.extension
    content = file.read()
    fname = file.name.lower()

    # 1) 확장자 우선
    if ext == ".toml":
        return ("gemini", "slash_command")
    if ext in (".mdc", ".cursorrules"):
        return ("cursor", "rules")
    if ext == ".clinerules":
        return ("cline", "rules")
    if ext == ".yml" and "aider" in content:
        return ("aider", "rules")

    # 2) 내용 패턴
    if ext in (".json", ".jsonc") and "opencode" in content:
        return ("opencode", "plugin")
    if ext == ".md":
        if content.startswith("---") and "name:" in content and "description:" in content:
            # opencode agent/command는 frontmatter에 'mode' 또는 'tools' 키 빈출
            if "mode:" in content or "/.opencode/" in fname:
                kind = "agent" if "/agent/" in fname else "slash_command"
                return ("opencode", kind)
            kind = "skill" if "SKILL.md" in fname else "slash_command"
            return ("claude", kind)
        if "AGENTS.md" in fname:
            return ("opencode", "rules")
        if "copilot-instructions" in fname:
            return ("copilot", "rules")

    # 3) 폴백 → 사용자 수동 선택
    return ask_user()
```

---

## 6. DB에 들어갈 enum 후보 (스키마 직전 단계)

```ts
type AssetType = "command" | "mcp_server"   // 최상위 구분

type AiTool = "claude" | "gemini" | "cursor" | "opencode"
            | "copilot" | "aider" | "continue" | "cline"
            // OpenAI Custom GPT 제외 (파일 공유 불가, OSS와 충돌)

type CommandType = "skill" | "slash_command" | "rules" | "agent" | "plugin"

type Category = "coding" | "writing" | "productivity"
              | "design" | "data" | "research" | "personal"

type FileFormat = "md" | "toml" | "mdc" | "json" | "jsonc" | "yml" | "txt"

// OSS 필수 필드
type License = "MIT" | "Apache-2.0" | "GPL-3.0" | "BSD-3-Clause"
             | "Unlicense" | "CC0-1.0" | "ISC" | "MPL-2.0" | "other"
```

---

## 7. 결정 사항 (v0.2 확정)

- [x] **OpenAI Custom GPT** → ❌ 제외 (파일 공유 불가 + 폐쇄형)
- [x] **MCP 서버** → ✅ 포함, 최상위 `asset_type = "mcp_server"` 로 분리
- [x] **Cross-platform 변환본** → 한 카드 + 도구별 탭 (`asset_variants` 테이블로 묶음)
- [x] **언어 정책** → content는 원본 언어 그대로, title/description만 영/한 분리
- [x] **OSS 필드 추가** → `license` (SPDX), `source_repo`, `fork_of`

---

## 다음 단계

→ DB 스키마: `db-schema.sql` 참고
