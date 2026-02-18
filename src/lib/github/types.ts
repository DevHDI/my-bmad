export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export interface GitHubRepo {
  id: number;
  fullName: string;
  name: string;
  owner: string;
  description: string | null;
  isPrivate: boolean;
  updatedAt: string;
  defaultBranch: string;
  hasBmad: boolean;
}

