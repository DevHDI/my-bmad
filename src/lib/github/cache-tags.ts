export function repoTag(owner: string, repo: string): string {
  return `repo:${owner}/${repo}`;
}

export function fileTag(owner: string, repo: string, path: string): string {
  return `file:${owner}/${repo}/${path}`;
}
