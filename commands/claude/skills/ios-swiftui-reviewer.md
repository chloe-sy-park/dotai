---
name: ios-swiftui-reviewer
title:
  en: iOS/SwiftUI Code Reviewer
  ko: iOS/SwiftUI 코드 리뷰어
description:
  en: Reviews SwiftUI code for performance, idiomatic patterns, and common pitfalls
  ko: SwiftUI 코드의 성능, 관용 패턴, 흔한 실수를 리뷰
ai_tool: claude
command_type: skill
category: coding
tags: [swift, swiftui, ios, code-review]
license: MIT
author: chloe-sy-park
created: 2026-04-25
---

# iOS/SwiftUI Code Reviewer

Review the provided Swift/SwiftUI code with a focus on performance, idiomatic patterns, and pitfalls common in apps targeting iOS 17+.

## Performance

- **Property wrapper choice** — `@State` (owned local) vs `@Binding` (passed in) vs `@StateObject` (created here) vs `@ObservedObject` (passed in). `@StateObject` in a child that gets replaced = state loss.
- **`@Observable` (iOS 17+)** over `ObservableObject` where compatible — finer-grained tracking, no Combine overhead.
- **View body cost** — heavy computation in `body` runs on every dependency change. Hoist into computed lets, `@State`-cached values, or `Equatable` views.
- **`ForEach` identity** — must use stable, unique IDs. Don't use index-as-id over mutable collections.
- **`.id()` modifier** — forces full view tear-down on change. Almost always a code smell unless intentional.
- **Lazy containers** — `LazyVStack` / `LazyHStack` for long lists, `List` for system-managed scrolling.

## SwiftUI idioms

- View composition over imperative mutation; extract `ViewModifier` for repeated patterns.
- `EnvironmentObject` / `@Environment` for cross-cutting state, not for prop chains 2 levels deep.
- `@ViewBuilder` over returning `AnyView` (type-erasure penalizes diffing).
- Prefer system materials and SF Symbols over custom drawing where possible.

## Concurrency

- `@MainActor` on view models that publish UI state.
- `Task { ... }` cancellation on view disappear (`.task` modifier handles this for free).
- No `DispatchQueue.main.async` in modern code — use `await MainActor.run` or `@MainActor`.
- `async let` for parallel fetches.

## Common pitfalls

- Force unwrapping (`!`) anywhere in a view body
- `@State` mutated from a background thread
- `objectWillChange.send()` as a workaround — usually means wrong property wrapper
- Closure `self` capture without `[weak self]` in `Combine` sinks or long-lived `Task`s
- Using `if let` inside `body` for optional unwrapping when `Group` + `.padding` would be cleaner

## Output format

```
## <severity>: <one-line issue>
**File:** path/to/File.swift:line
**Why:** brief explanation
**Fix:**
```swift
// suggested code
```
```

Severities: `🔴 critical` (bug or crash) / `🟡 warning` (perf or anti-pattern) / `🟢 nit` (style).

Group by severity, critical first. If the code is clean, say so — don't manufacture nits.
