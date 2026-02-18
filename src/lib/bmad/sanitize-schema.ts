import { defaultSchema } from "rehype-sanitize";

export const bmadSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "details", "summary"],
  attributes: {
    ...defaultSchema.attributes,
    code: ["className"],
  },
} as const;
