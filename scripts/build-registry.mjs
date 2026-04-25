#!/usr/bin/env node
/**
 * build-registry.mjs
 *
 * Walk commands/ and mcp-servers/, parse frontmatter from each file,
 * write REGISTRY.json at repo root.
 *
 * Also validates required fields and exits non-zero on errors
 * (so it doubles as a PR validation step).
 *
 * Run:  node scripts/build-registry.mjs
 * CI:   triggered by .github/workflows/build-registry.yml
 */

import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { join, relative, extname, basename } from "node:path";
import matter from "gray-matter";
import TOML from "@iarna/toml";

// ─── Config ──────────────────────────────────────────────────

const ROOT = process.cwd();
const SCAN_DIRS = ["commands", "mcp-servers"];
const REGISTRY_PATH = join(ROOT, "REGISTRY.json");

const VALID_AI_TOOLS = new Set([
  "claude", "gemini", "opencode", "cursor",
  "copilot", "aider", "continue", "cline",
]);
const VALID_COMMAND_TYPES = new Set([
  "skill", "slash_command", "rules", "agent", "plugin",
]);
const VALID_CATEGORIES = new Set([
  "coding", "writing", "productivity",
  "design", "data", "research", "personal",
]);
// minimal SPDX whitelist; expand as needed
const VALID_LICENSES = new Set([
  "MIT", "Apache-2.0", "GPL-3.0", "GPL-2.0", "BSD-3-Clause", "BSD-2-Clause",
  "Unlicense", "CC0-1.0", "ISC", "MPL-2.0", "AGPL-3.0",
]);

// Folder name (level 2 under commands/<ai_tool>/) → command_type.
// Multiple folder names can map to the same type (e.g. claude uses `slash/`,
// gemini uses `commands/`, both are `slash_command`).
const FOLDER_TO_COMMAND_TYPE = {
  skills: "skill",
  slash: "slash_command",
  commands: "slash_command",
  rules: "rules",
  agents: "agent",
  plugins: "plugin",
};

// ─── Walk ────────────────────────────────────────────────────

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.isFile()) yield path;
  }
}

// ─── Parse ───────────────────────────────────────────────────

async function parseFile(path) {
  const ext = extname(path).toLowerCase();
  const raw = await readFile(path, "utf8");

  if (ext === ".toml") {
    const parsed = TOML.parse(raw);
    const meta = parsed.meta ?? {};
    return {
      ...meta,
      title: meta.title ?? { en: meta.title_en, ko: meta.title_ko },
      description:
        meta.description ?? { en: meta.description_en, ko: meta.description_ko },
      content: raw,
    };
  }

  // .md, .mdc, .json, .yml, etc.
  const fm = matter(raw);
  return { ...fm.data, content: raw };
}

// ─── Asset type detection ────────────────────────────────────

function detectAssetType(relPath) {
  const top = relPath.split("/")[0];
  if (top === "mcp-servers") return "mcp_server";
  if (top === "commands") return "command";
  return null;
}

// ─── Validate ────────────────────────────────────────────────

function validateCommon(meta) {
  const errors = [];
  for (const f of ["name", "license", "author"]) {
    if (!meta[f]) errors.push(`missing field: ${f}`);
  }
  if (!meta.title?.en) errors.push("missing field: title.en");
  if (!meta.description?.en) errors.push("missing field: description.en");
  if (meta.license && !VALID_LICENSES.has(meta.license))
    errors.push(`invalid SPDX license: ${meta.license} (add to whitelist if intentional)`);
  if (meta.category && !VALID_CATEGORIES.has(meta.category))
    errors.push(`invalid category: ${meta.category}`);
  return errors;
}

function validateCommand(meta, relPath) {
  const errors = validateCommon(meta);
  for (const f of ["ai_tool", "command_type", "category"]) {
    if (!meta[f]) errors.push(`missing field: ${f}`);
  }
  if (meta.ai_tool && !VALID_AI_TOOLS.has(meta.ai_tool))
    errors.push(`invalid ai_tool: ${meta.ai_tool}`);
  if (meta.command_type && !VALID_COMMAND_TYPES.has(meta.command_type))
    errors.push(`invalid command_type: ${meta.command_type}`);

  // Folder location must match metadata.
  // Expected layout: commands/<ai_tool>/<folder>/<file>
  const parts = relPath.split("/");
  if (parts.length < 4) {
    errors.push(`command files must live at commands/<ai_tool>/<folder>/<file>, got ${relPath}`);
  } else {
    const [, folderAiTool, folder] = parts;
    if (meta.ai_tool && folderAiTool !== meta.ai_tool) {
      errors.push(`folder ai_tool "${folderAiTool}" does not match metadata "${meta.ai_tool}"`);
    }
    const expectedType = FOLDER_TO_COMMAND_TYPE[folder];
    if (!expectedType) {
      errors.push(`unknown folder "${folder}" — add it to FOLDER_TO_COMMAND_TYPE if intentional`);
    } else if (meta.command_type && expectedType !== meta.command_type) {
      errors.push(`folder "${folder}" implies command_type "${expectedType}" but metadata says "${meta.command_type}"`);
    }
  }
  return errors;
}

function validateMcpServer(meta) {
  return validateCommon(meta);
}

function validate(meta, path, assetType) {
  const relPath = relative(ROOT, path).replaceAll("\\", "/");
  const errors =
    assetType === "mcp_server" ? validateMcpServer(meta) : validateCommand(meta, relPath);

  const expectedName = basename(path, extname(path));
  if (meta.name && meta.name !== expectedName)
    errors.push(`filename "${expectedName}" must match name "${meta.name}"`);

  return errors;
}

// ─── Build entry ─────────────────────────────────────────────

function buildEntry(meta, path, assetType, repoOwner, repoName, branch = "main") {
  const rel = relative(ROOT, path).replaceAll("\\", "/");
  const id =
    assetType === "mcp_server"
      ? `mcp_server/${meta.name}`
      : `${meta.ai_tool}/${meta.command_type}/${meta.name}`;
  return {
    id,
    asset_type: assetType,
    path: rel,
    raw_url: `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branch}/${rel}`,
    github_url: `https://github.com/${repoOwner}/${repoName}/blob/${branch}/${rel}`,
    ai_tool: meta.ai_tool ?? null,
    command_type: meta.command_type ?? null,
    category: meta.category ?? null,
    tags: meta.tags ?? [],
    title: meta.title,
    description: meta.description,
    license: meta.license,
    author: meta.author,
    source_repo: meta.source_repo ?? null,
    fork_of: meta.fork_of ?? null,
    created: meta.created ?? null,
    size_bytes: Buffer.byteLength(meta.content, "utf8"),
  };
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  const repo = process.env.GITHUB_REPOSITORY ?? "OWNER/dotai";
  const [repoOwner, repoName] = repo.split("/");
  const branch = process.env.GITHUB_REF_NAME ?? "main";

  const assets = [];
  const allErrors = [];

  for (const dir of SCAN_DIRS) {
    for await (const path of walk(join(ROOT, dir))) {
      // skip non-content files
      const ext = extname(path).toLowerCase();
      if (![".md", ".mdc", ".toml", ".json", ".yml", ".yaml"].includes(ext))
        continue;
      // skip placeholder
      if (basename(path) === ".gitkeep") continue;

      try {
        const relPath = relative(ROOT, path).replaceAll("\\", "/");
        const assetType = detectAssetType(relPath);
        if (!assetType) {
          allErrors.push({
            path: relPath,
            errors: [`file is outside known top-level dirs (${SCAN_DIRS.join(", ")})`],
          });
          continue;
        }
        const meta = await parseFile(path);
        const errors = validate(meta, path, assetType);
        if (errors.length) {
          allErrors.push({ path: relPath, errors });
          continue;
        }
        assets.push(buildEntry(meta, path, assetType, repoOwner, repoName, branch));
      } catch (err) {
        allErrors.push({
          path: relative(ROOT, path),
          errors: [`parse error: ${err.message}`],
        });
      }
    }
  }

  if (allErrors.length) {
    console.error("❌ Validation failed:\n");
    for (const { path, errors } of allErrors) {
      console.error(`  ${path}`);
      for (const e of errors) console.error(`    - ${e}`);
    }
    process.exit(1);
  }

  // sort: ai_tool → command_type → name
  assets.sort((a, b) => a.id.localeCompare(b.id));

  const registry = {
    generated_at: new Date().toISOString(),
    version: 1,
    count: assets.length,
    assets,
  };

  await writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n");
  console.log(`✅ Wrote REGISTRY.json with ${assets.length} assets`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
