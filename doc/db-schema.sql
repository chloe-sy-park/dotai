-- ============================================================
-- AI Command Hub — DB Schema v0.1 (Postgres / Supabase)
-- ============================================================
-- 의존: Supabase Auth (auth.users 테이블)
-- 참고: ai-command-hub-taxonomy.md v0.2
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. ENUMS
-- ─────────────────────────────────────────────

CREATE TYPE asset_type AS ENUM ('command', 'mcp_server');

CREATE TYPE ai_tool AS ENUM (
  'claude', 'gemini', 'cursor', 'opencode',
  'copilot', 'aider', 'continue', 'cline'
);

CREATE TYPE command_type AS ENUM (
  'skill', 'slash_command', 'rules', 'agent', 'plugin'
);

CREATE TYPE category AS ENUM (
  'coding', 'writing', 'productivity',
  'design', 'data', 'research', 'personal'
);

CREATE TYPE file_format AS ENUM (
  'md', 'toml', 'mdc', 'json', 'jsonc', 'yml', 'txt'
);

-- ─────────────────────────────────────────────
-- 2. PROFILES (Supabase Auth 확장)
-- ─────────────────────────────────────────────

CREATE TABLE profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  github_username text NOT NULL UNIQUE,
  github_id       bigint UNIQUE,
  avatar_url      text,
  display_name    text,
  bio             text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_github_username ON profiles(github_username);

-- ─────────────────────────────────────────────
-- 3. ASSETS (commands + mcp_servers 통합)
-- ─────────────────────────────────────────────

CREATE TABLE assets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type      asset_type NOT NULL,

  -- 다국어 메타데이터 (content는 원본 언어 그대로)
  title_en        text NOT NULL,
  title_ko        text,
  description_en  text NOT NULL,
  description_ko  text,

  -- 분류
  ai_tool         ai_tool,           -- mcp_server는 NULL 가능 (cross-tool)
  command_type    command_type,      -- mcp_server는 NULL
  category        category NOT NULL,
  tags            text[] NOT NULL DEFAULT '{}',

  -- 콘텐츠
  file_format     file_format,
  content         text,              -- 원본 파일 내용 (작은 파일)
  file_url        text,              -- Supabase Storage URL (큰 파일)

  -- mcp_server 전용 메타 (JSONB로 확장 여지)
  -- 예: { "transport": "stdio", "runtime": "node", "package": "@scope/name" }
  extra           jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- OSS 메타
  license         text NOT NULL,             -- SPDX: 'MIT', 'Apache-2.0', ...
  source_repo     text,                      -- 원본 GitHub URL
  fork_of         uuid REFERENCES assets(id) ON DELETE SET NULL,

  -- 작성자
  author_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- 통계 (캐시 컬럼, 트리거로 동기화)
  vote_count      int NOT NULL DEFAULT 0,
  download_count  int NOT NULL DEFAULT 0,
  view_count      int NOT NULL DEFAULT 0,

  -- 타임스탬프
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- 제약
  CONSTRAINT chk_command_has_ai_tool
    CHECK (asset_type <> 'command' OR ai_tool IS NOT NULL),
  CONSTRAINT chk_command_has_type
    CHECK (asset_type <> 'command' OR command_type IS NOT NULL),
  CONSTRAINT chk_content_or_url
    CHECK (content IS NOT NULL OR file_url IS NOT NULL OR source_repo IS NOT NULL)
);

-- 인덱스
CREATE INDEX idx_assets_type        ON assets(asset_type);
CREATE INDEX idx_assets_ai_tool     ON assets(ai_tool);
CREATE INDEX idx_assets_command_type ON assets(command_type);
CREATE INDEX idx_assets_category    ON assets(category);
CREATE INDEX idx_assets_author      ON assets(author_id);
CREATE INDEX idx_assets_votes       ON assets(vote_count DESC);
CREATE INDEX idx_assets_created     ON assets(created_at DESC);
CREATE INDEX idx_assets_tags        ON assets USING gin(tags);
CREATE INDEX idx_assets_extra       ON assets USING gin(extra);

-- 영문 full-text search (한글은 별도 처리 — pg_bigm 또는 trigram)
CREATE INDEX idx_assets_search_en ON assets USING gin(
  to_tsvector('english',
    coalesce(title_en, '') || ' ' || coalesce(description_en, '')
  )
);

-- 한글 검색은 trigram으로 (Postgres 기본 한글 토크나이저 없음)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_assets_search_ko ON assets USING gin(
  (coalesce(title_ko, '') || ' ' || coalesce(description_ko, '')) gin_trgm_ops
);

-- ─────────────────────────────────────────────
-- 4. ASSET VARIANTS (cross-tool 변환본 묶음)
-- ─────────────────────────────────────────────
-- 같은 논리적 명령어를 여러 AI 도구로 변환한 버전 묶기
-- 예: 같은 "코드리뷰" skill의 Claude / Gemini / Cursor 버전

CREATE TABLE asset_variants (
  group_id    uuid NOT NULL,        -- 같은 group_id = 같은 논리적 명령어
  asset_id    uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  is_original boolean NOT NULL DEFAULT false,
  PRIMARY KEY (group_id, asset_id)
);

CREATE INDEX idx_variants_asset ON asset_variants(asset_id);

-- ─────────────────────────────────────────────
-- 5. VOTES
-- ─────────────────────────────────────────────

CREATE TABLE votes (
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  asset_id   uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, asset_id)
);

CREATE INDEX idx_votes_asset ON votes(asset_id);

-- vote_count 자동 동기화 트리거
CREATE OR REPLACE FUNCTION sync_vote_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE assets SET vote_count = vote_count + 1 WHERE id = NEW.asset_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE assets SET vote_count = vote_count - 1 WHERE id = OLD.asset_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_votes_count
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION sync_vote_count();

-- ─────────────────────────────────────────────
-- 6. updated_at 자동 갱신
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY (Supabase)
-- ─────────────────────────────────────────────

ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes          ENABLE ROW LEVEL SECURITY;

-- profiles: 누구나 읽기, 본인만 수정
CREATE POLICY profiles_read ON profiles
  FOR SELECT USING (true);
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- assets: 누구나 읽기, 작성자만 수정/삭제, 로그인 사용자 등록
CREATE POLICY assets_read ON assets
  FOR SELECT USING (true);
CREATE POLICY assets_insert ON assets
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY assets_update_own ON assets
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY assets_delete_own ON assets
  FOR DELETE USING (auth.uid() = author_id);

-- variants: 누구나 읽기, 그룹 내 자산 작성자가 관리
CREATE POLICY variants_read ON asset_variants
  FOR SELECT USING (true);
CREATE POLICY variants_write ON asset_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assets a
      WHERE a.id = asset_variants.asset_id AND a.author_id = auth.uid()
    )
  );

-- votes: 본인 투표만 관리, 모두 읽기
CREATE POLICY votes_read ON votes
  FOR SELECT USING (true);
CREATE POLICY votes_insert_own ON votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY votes_delete_own ON votes
  FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 8. 편의 VIEW (Top Contributors 명예의 전당)
-- ─────────────────────────────────────────────

CREATE OR REPLACE VIEW top_contributors AS
SELECT
  p.id,
  p.github_username,
  p.avatar_url,
  count(a.id)              AS asset_count,
  coalesce(sum(a.vote_count), 0)     AS total_votes,
  coalesce(sum(a.download_count), 0) AS total_downloads
FROM profiles p
LEFT JOIN assets a ON a.author_id = p.id
GROUP BY p.id
ORDER BY total_votes DESC, asset_count DESC;

-- ============================================================
-- TODO (v0.2 후보)
-- - 댓글/리뷰 테이블
-- - 신고/스팸 처리
-- - 컬렉션(여러 명령어 묶음) 기능
-- - 한글 형태소 분석기 (mecab) 도입 검토
-- ============================================================
