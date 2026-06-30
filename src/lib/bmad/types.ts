export type StoryStatus =
  | "done"
  | "in-progress"
  | "review"
  | "blocked"
  | "ready-for-dev"
  | "backlog"
  | "unknown";

export type DefectStatus = "open" | "in-progress" | "resolved" | "closed";
export type DefectSeverity = "critical" | "high" | "medium" | "low";

export type EpicStatus = "done" | "in-progress" | "not-started";

export interface SprintStatus {
  sprint?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  stories: SprintStoryEntry[];
}

export interface SprintStoryEntry {
  id: string;
  title: string;
  status: StoryStatus;
  epicId?: string;
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  status: EpicStatus;
  stories: string[];
  totalStories: number;
  completedStories: number;
  progressPercent: number;
}

export interface StoryDetail {
  id: string;
  title: string;
  status: StoryStatus;
  /**
   * True when the story markdown declared a status explicitly (frontmatter
   * `status:` or a `Status:` line in the body). When false, `status` came
   * from the default fallback and sprint-status.yaml may override it.
   */
  statusExplicit?: boolean;
  epicId: string;
  epicTitle?: string;
  description: string;
  acceptanceCriteria: string[];
  tasks: StoryTask[];
  completedTasks: number;
  totalTasks: number;
}

export interface StoryTask {
  description: string;
  completed: boolean;
}

export interface Defect {
  id: string;
  title: string;
  status: DefectStatus;
  severity: DefectSeverity;
  storyId: string;
  epicId?: string;
  description: string;
  stepsToReproduce: string[];
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}

export type BmadFileMetadata = {
  status?: string;
  stepsCompleted?: string[];
  lastStep?: string | number;
  title?: string;
  completedAt?: string;
  workflowType?: string;
};

export type ParsedBmadFile = {
  contentType: "markdown" | "yaml" | "json" | "text";
  frontmatter: Record<string, unknown> | null;
  metadata: BmadFileMetadata | null;
  body: string;
  rawContent: string;
  parseError: string | null;
};

export interface ParseErrorEntry {
  file: string;
  error: string;
  contentType: string;
}

export interface ParseHealthReport {
  errors: ParseErrorEntry[];
  totalFiles: number;
  successfulFiles: number;
}

export interface BmadProject {
  owner: string;
  repo: string;
  branch: string;
  displayName: string;
  sprintStatus: SprintStatus | null;
  epics: Epic[];
  stories: StoryDetail[];
  defects: Defect[];
  fileTree: FileTreeNode[];
  bmadFiles: string[];
  docsTree: FileTreeNode[];
  docsFolderName: string | null;
  parseHealth?: ParseHealthReport;
  totalStories: number;
  completedStories: number;
  inProgressStories: number;
  progressPercent: number;
}
