import yaml from "js-yaml";
import type { ContentProvider } from "@/lib/content-provider";

export interface BmadConfig {
  outputDir: string;
}

export const DEFAULT_OUTPUT_DIR = "_bmad-output";
export const CORE_CONFIG_PATH = "_bmad/core/config.yaml";

const PROJECT_ROOT_PREFIX = /^\{project-root\}\/+/;

function normalizeOutputFolder(raw: string): string | null {
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  if (!trimmed) return null;
  const stripped = trimmed.replace(PROJECT_ROOT_PREFIX, "");
  const cleaned = stripped.replace(/^\/+/, "").replace(/\/+$/, "");
  return cleaned || null;
}

export function parseConfigContent(content: string): BmadConfig | null {
  try {
    const data = yaml.load(content);
    if (!data || typeof data !== "object") return null;

    const raw = (data as Record<string, unknown>).output_folder;
    if (typeof raw !== "string") return null;

    const outputDir = normalizeOutputFolder(raw);
    if (!outputDir) return null;

    return { outputDir };
  } catch (e) {
    console.warn("[BMAD Config] Failed to parse config YAML:", e);
    return null;
  }
}

export async function getBmadConfig(
  provider: ContentProvider,
  paths: string[],
): Promise<BmadConfig> {
  if (!paths.includes(CORE_CONFIG_PATH)) {
    return { outputDir: DEFAULT_OUTPUT_DIR };
  }

  try {
    const content = await provider.getFileContent(CORE_CONFIG_PATH);
    const parsed = parseConfigContent(content);
    if (parsed) return parsed;
  } catch (e) {
    console.warn(`[BMAD Config] Failed to read ${CORE_CONFIG_PATH}:`, e);
  }

  return { outputDir: DEFAULT_OUTPUT_DIR };
}
