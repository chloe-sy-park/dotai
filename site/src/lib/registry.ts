import registryJson from "../../../REGISTRY.json";

export type AssetType = "command" | "mcp_server";
export type AiTool = "claude" | "gemini" | "opencode" | "cursor" | "copilot" | "aider" | "continue" | "cline";
export type CommandType = "skill" | "slash_command" | "rules" | "agent" | "plugin";
export type Category = "coding" | "writing" | "productivity" | "design" | "data" | "research" | "personal";

export interface Asset {
  id: string;
  asset_type: AssetType;
  path: string;
  raw_url: string;
  github_url: string;
  ai_tool: AiTool | null;
  command_type: CommandType | null;
  category: Category | null;
  tags: string[];
  title: { en: string; ko?: string };
  description: { en: string; ko?: string };
  license: string;
  author: string;
  source_repo: string | null;
  fork_of: string | null;
  created: string | null;
  size_bytes: number;
}

export interface Registry {
  generated_at: string;
  version: number;
  count: number;
  assets: Asset[];
}

export const registry: Registry = registryJson as Registry;
