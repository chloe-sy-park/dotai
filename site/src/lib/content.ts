import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { extname, join } from "node:path";

// site/src/lib/content.ts → up 3 levels to repo root.
const REPO_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

export interface FileBody {
  raw: string;
  body: string;
  ext: string;
  language: string;
}

export function readAssetFile(relPath: string): FileBody {
  const raw = readFileSync(join(REPO_ROOT, relPath), "utf-8");
  const ext = extname(relPath).toLowerCase();
  return {
    raw,
    body: stripFrontmatter(raw, ext),
    ext,
    language: extToLanguage(ext),
  };
}

function stripFrontmatter(content: string, ext: string): string {
  // TOML: meta is just one of many tables — show full file.
  if (ext === ".toml") return content.trim();

  // YAML frontmatter: --- ... --- at top
  if (content.startsWith("---")) {
    const closing = content.indexOf("\n---", 3);
    if (closing > 0) {
      return content.slice(closing + 4).trimStart();
    }
  }
  return content.trim();
}

function extToLanguage(ext: string): string {
  switch (ext) {
    case ".md":
    case ".mdc":
      return "markdown";
    case ".toml":
      return "toml";
    case ".json":
    case ".jsonc":
      return "json";
    case ".yml":
    case ".yaml":
      return "yaml";
    default:
      return "text";
  }
}
