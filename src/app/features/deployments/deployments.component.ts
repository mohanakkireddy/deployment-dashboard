import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { GitHubService } from '../../core/services/github.service';
import { AuthService } from '../../core/services/auth.service';
import { GitHubRepository } from '../../core/models';
import { DeploymentWithStatus } from '../../core/models/deployment.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';

@Component({
  selector: 'app-deployments',
  standalone: true,
  imports: [
    KeyValuePipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    RouterLink,
    LoadingSpinnerComponent,
    StatusChipComponent
  ],
  templateUrl: './deployments.component.html',
  styleUrl: './deployments.component.scss'
})
export class DeploymentsComponent implements OnInit {
  private githubService = inject(GitHubService);
  private authService = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);

  repos = signal<GitHubRepository[]>([]);
  deployments = signal<DeploymentWithStatus[]>([]);
  selectedRepo = signal<string>('all');
  selectedEnvironment = signal<string>('all');

  isAuthenticated = this.authService.isAuthenticated;
  organization = this.authService.organization;

  environments = computed(() => {
    const envSet = new Set<string>();
    this.deployments().forEach(d => envSet.add(d.environment));
    return Array.from(envSet).sort();
  });

  filteredDeployments = computed(() => {
    let filtered = this.deployments();

    const selectedRepo = this.selectedRepo();
    if (selectedRepo !== 'all') {
      filtered = filtered.filter(d => d.repository?.name === selectedRepo);
    }

    const selectedEnv = this.selectedEnvironment();
    if (selectedEnv !== 'all') {
      filtered = filtered.filter(d => d.environment === selectedEnv);
    }

    return filtered;
  });

  // Group deployments by environment
  deploymentsByEnvironment = computed(() => {
    const grouped = new Map<string, DeploymentWithStatus[]>();
    this.filteredDeployments().forEach(d => {
      const existing = grouped.get(d.environment) || [];
      existing.push(d);
      grouped.set(d.environment, existing);
    });
    return grouped;
  });

  ngOnInit(): void {
    if (this.isAuthenticated()) {
      this.loadData();
    }
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    const org = this.organization();

    const reposRequest = org
      ? this.githubService.getOrganizationRepos(org)
      : this.githubService.getUserRepos();

    reposRequest.subscribe({
      next: (repos) => {
        this.repos.set(repos);
        this.loadDeployments(repos);
      },
      error: (err) => {
        this.error.set('Failed to load repositories.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  private loadDeployments(repos: GitHubRepository[]): void {
    this.githubService.getAllDeployments(repos.slice(0, 15)).subscribe({
      next: (deployments) => {
        this.deployments.set(deployments);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load deployments.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  onRepoChange(repo: string): void {
    this.selectedRepo.set(repo);
  }

  onEnvironmentChange(env: string): void {
    this.selectedEnvironment.set(env);
  }

  refresh(): void {
    this.loadData();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  getRelativeTime(date: string): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  getEnvironmentIcon(env: string): string {
    const iconMap: Record<string, string> = {
      'production': 'public',
      'prod': 'public',
      'staging': 'science',
      'stage': 'science',
      'development': 'code',
      'dev': 'code',
      'test': 'bug_report',
      'preview': 'preview'
    };
    return iconMap[env.toLowerCase()] || 'cloud';
  }

  getEnvironmentClass(env: string): string {
    const classMap: Record<string, string> = {
      'production': 'env-production',
      'prod': 'env-production',
      'staging': 'env-staging',
      'stage': 'env-staging',
      'development': 'env-development',
      'dev': 'env-development',
      'test': 'env-test',
      'preview': 'env-preview'
    };
    return classMap[env.toLowerCase()] || 'env-default';
  }
}

