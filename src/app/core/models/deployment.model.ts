import { GitHubUser, GitHubRepository } from './workflow.model';

export interface Deployment {
  id: number;
  sha: string;
  ref: string;
  task: string;
  environment: string;
  description: string | null;
  creator: GitHubUser;
  created_at: string;
  updated_at: string;
  statuses_url: string;
  repository_url: string;
  transient_environment: boolean;
  production_environment: boolean;
  payload: Record<string, unknown>;
}

export interface DeploymentStatus {
  id: number;
  state: 'error' | 'failure' | 'inactive' | 'pending' | 'success' | 'queued' | 'in_progress';
  creator: GitHubUser;
  description: string | null;
  environment: string;
  target_url: string | null;
  created_at: string;
  updated_at: string;
  deployment_url: string;
  repository_url: string;
  environment_url: string | null;
  log_url: string | null;
}

export interface Environment {
  id: number;
  name: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  protection_rules?: ProtectionRule[];
  deployment_branch_policy?: DeploymentBranchPolicy;
}

export interface ProtectionRule {
  id: number;
  type: string;
  wait_timer?: number;
  reviewers?: GitHubUser[];
}

export interface DeploymentBranchPolicy {
  protected_branches: boolean;
  custom_branch_policies: boolean;
}

export interface DeploymentWithStatus extends Deployment {
  latestStatus?: DeploymentStatus;
  repository?: GitHubRepository;
}

