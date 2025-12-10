import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { GitHubService } from '../../core/services/github.service';
import { AuthService } from '../../core/services/auth.service';
import { WorkflowRun, GitHubRepository } from '../../core/models';
import { DeploymentWithStatus } from '../../core/models/deployment.model';
import { ReleaseWithRepo } from '../../core/models/release.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    RouterLink,
    NgxChartsModule,
    LoadingSpinnerComponent,
    StatusChipComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private githubService = inject(GitHubService);
  private authService = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);

  repos = signal<GitHubRepository[]>([]);
  workflowRuns = signal<WorkflowRun[]>([]);
  deployments = signal<DeploymentWithStatus[]>([]);
  releases = signal<ReleaseWithRepo[]>([]);

  isAuthenticated = this.authService.isAuthenticated;
  organization = this.authService.organization;

  // Computed statistics
  totalWorkflows = computed(() => this.workflowRuns().length);
  successfulWorkflows = computed(() =>
    this.workflowRuns().filter(r => r.conclusion === 'success').length
  );
  failedWorkflows = computed(() =>
    this.workflowRuns().filter(r => r.conclusion === 'failure').length
  );
  inProgressWorkflows = computed(() =>
    this.workflowRuns().filter(r => r.status === 'in_progress').length
  );

  totalDeployments = computed(() => this.deployments().length);
  successfulDeployments = computed(() =>
    this.deployments().filter(d => d.latestStatus?.state === 'success').length
  );

  totalReleases = computed(() => this.releases().length);

  // Chart data
  workflowStatusData = computed(() => [
    { name: 'Success', value: this.successfulWorkflows() },
    { name: 'Failed', value: this.failedWorkflows() },
    { name: 'In Progress', value: this.inProgressWorkflows() },
    { name: 'Other', value: this.totalWorkflows() - this.successfulWorkflows() - this.failedWorkflows() - this.inProgressWorkflows() }
  ].filter(d => d.value > 0));

  colorScheme: string = 'cool';

  recentWorkflows = computed(() => this.workflowRuns().slice(0, 5));
  recentDeployments = computed(() => this.deployments().slice(0, 5));
  recentReleases = computed(() => this.releases().slice(0, 5));

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
        this.loadAllData(repos);
      },
      error: (err) => {
        this.error.set('Failed to load repositories. Please check your token and organization settings.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  private loadAllData(repos: GitHubRepository[]): void {
    forkJoin({
      workflows: this.githubService.getAllWorkflowRuns(repos.slice(0, 10), 10),
      deployments: this.githubService.getAllDeployments(repos.slice(0, 10)),
      releases: this.githubService.getAllReleases(repos.slice(0, 10), 5)
    }).subscribe({
      next: (data) => {
        this.workflowRuns.set(data.workflows);
        this.deployments.set(data.deployments);
        this.releases.set(data.releases);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load some data. Please try again.');
        this.loading.set(false);
        console.error(err);
      }
    });
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
}

