import { registry, type Asset, type AiTool, type CommandType, type Category } from "./registry";

export interface FilterOptions {
  ai_tools: AiTool[];
  command_types: CommandType[];
  categories: Category[];
}

export function getFilterOptions(): FilterOptions {
  const ai_tools = new Set<AiTool>();
  const command_types = new Set<CommandType>();
  const categories = new Set<Category>();
  for (const asset of registry.assets) {
    if (asset.ai_tool) ai_tools.add(asset.ai_tool);
    if (asset.command_type) command_types.add(asset.command_type);
    if (asset.category) categories.add(asset.category);
  }
  return {
    ai_tools: [...ai_tools].sort(),
    command_types: [...command_types].sort(),
    categories: [...categories].sort(),
  };
}

export function searchableText(asset: Asset): string {
  return [
    asset.title.en,
    asset.title.ko ?? "",
    asset.description.en,
    asset.description.ko ?? "",
    ...asset.tags,
    asset.author,
  ]
    .join(" ")
    .toLowerCase();
}
