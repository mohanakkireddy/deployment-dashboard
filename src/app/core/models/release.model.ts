import { GitHubUser, GitHubRepository } from './workflow.model';

export interface Release {
  id: number;
  tag_name: string;
  target_commitish: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
  author: GitHubUser;
  html_url: string;
  tarball_url: string | null;
  zipball_url: string | null;
  assets: ReleaseAsset[];
}

export interface ReleaseAsset {
  id: number;
  name: string;
  label: string | null;
  content_type: string;
  state: 'uploaded' | 'open';
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  browser_download_url: string;
  uploader: GitHubUser;
}

export interface ReleaseWithRepo extends Release {
  repository?: GitHubRepository;
}

