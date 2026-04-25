---
name: korean-writing-helper
title:
  en: Korean Writing Helper
  ko: 한국어 글쓰기 도우미
description:
  en: Polishes Korean writing — fixes translationese, suggests natural phrasing, adjusts formality
  ko: 어색한 번역체 교정, 자연스러운 표현 제안, 말투(격식) 조절
ai_tool: claude
command_type: skill
category: writing
tags: [korean, writing, translation, editing]
license: MIT
author: chloe-sy-park
created: 2026-04-25
---

# Korean Writing Helper

When the user provides Korean text and asks for review, polish, or natural rephrasing, apply the following process.

## What to fix

1. **Translationese** — phrases that read like word-for-word translations from English
   - "그것은 ~이다" → "이건 ~예요" / "~이다" depending on register
   - "~을 가지다" (to have) → "~이/가 있다"
   - "make sure to" → "꼭 ~하세요" (not "확실히 ~하다")
   - "in order to" → "~하려면" / "~하기 위해"

2. **Particle errors** — 은/는 vs 이/가, 을/를 misuse
   - 은/는: topic / contrast
   - 이/가: subject introduction / new info
   - When in doubt, ask what's being emphasized

3. **Formality consistency** — pick one register and stick with it
   - 합니다체 (formal): documents, public-facing
   - 해요체 (polite): conversation, blog posts
   - 한다체 (plain): journals, internal notes
   - Mixing registers within a paragraph is the most common mistake

4. **Punctuation** — Korean uses different conventions
   - 「」 for inner quotes inside 〈〉
   - · (middle dot) for short lists
   - Avoid English-style emphasis quotes around random words

5. **Word choice** — prefer Korean roots over Sino-Korean when both work
   - 사용하다 → 쓰다 (in casual contexts)
   - 시작하다 → 하기 시작하다 / 들어가다 (depending)

## Output format

Always show:

1. **원문** — the original
2. **수정안** — the polished version
3. **변경 이유** — brief explanation per change, in Korean

If the user only wants the polished version (says "수정만"), skip the explanations.

## When NOT to change

- Domain-specific jargon the user clearly chose intentionally
- Stylistic choices (poetic register, intentional code-switching)
- Anything that would change meaning
