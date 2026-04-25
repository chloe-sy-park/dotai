---
name: standup
title:
  en: Daily Standup Generator
  ko: 데일리 스탠드업 생성기
description:
  en: Turns rough notes (or recent git activity) into a clean Yesterday/Today/Blockers standup
  ko: 메모 또는 최근 git 활동을 어제/오늘/블로커 스탠드업 포맷으로 정리
ai_tool: claude
command_type: slash_command
category: productivity
tags: [standup, daily, agile, scrum, git]
license: MIT
author: chloe-sy-park
created: 2026-04-25
argument-hint: "[optional: bullet notes about what you did]"
---

Generate a daily standup update.

## Input

- If the user passed bullet notes as `$ARGUMENTS`, use those directly.
- Otherwise, run `git log --since=yesterday --author="$(git config user.email)" --pretty=format:"%h %s"` to gather recent activity.
- If both are missing, ask the user "어제 뭐 했어요?" / "What did you do yesterday?" in their language.

## Output format

```
**어제 / Yesterday**
- (concrete shipped items, with PR/commit refs if available)

**오늘 / Today**
- (planned work, with ticket refs if mentioned)

**블로커 / Blockers**
- (waiting on someone, or write "없음 / None" if clear)
```

## Rules

- Be concrete. No "worked on stuff" — what stuff specifically.
- Past tense for yesterday, present/future for today.
- Match the user's language: Korean input → Korean output, English → English. Default to bilingual labels.
- Maximum 5 bullets per section. Prioritize ruthlessly.
- Strip `[skip ci]`, `wip:`, and other noise from commit messages.
- If multiple commits are part of one feature, combine them into one bullet.
