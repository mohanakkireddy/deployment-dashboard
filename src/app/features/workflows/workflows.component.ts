import { Component, OnInit, inject, signal, computed, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { GitHubService } from '../../core/services/github.service';
import { AuthService } from '../../core/services/auth.service';
import { WorkflowRun, GitHubRepository } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { SummaryDialogComponent, SummaryDialogData } from '../../shared/components/summary-dialog/summary-dialog.component';

@Component({
  selector: 'app-workflows',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDialogModule,
    RouterLink,
    LoadingSpinnerComponent,
    StatusChipComponent
  ],
  templateUrl: './workflows.component.html',
  styleUrl: './workflows.component.scss'
})
export class WorkflowsComponent implements OnInit {
  private githubService = inject(GitHubService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  loading = signal(false);
  error = signal<string | null>(null);

  repos = signal<GitHubRepository[]>([]);
  selectedRepo = signal<string>('all');
  workflowRuns = signal<WorkflowRun[]>([]);

  dataSource = new MatTableDataSource<WorkflowRun>([]);
  displayedColumns = ['status', 'name', 'repository', 'branch', 'actor', 'duration', 'created', 'actions'];

  isAuthenticated = this.authService.isAuthenticated;
  organization = this.authService.organization;

  filteredRuns = computed(() => {
    const runs = this.workflowRuns();
    const selectedRepo = this.selectedRepo();

    if (selectedRepo === 'all') {
      return runs;
    }
    return runs.filter(r => r.repository?.name === selectedRepo);
  });

  ngOnInit(): void {
    if (this.isAuthenticated()) {
      this.loadData();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
        this.loadWorkflows(repos);
      },
      error: (err) => {
        this.error.set('Failed to load repositories.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  private loadWorkflows(repos: GitHubRepository[]): void {
    this.githubService.getAllWorkflowRuns(repos.slice(0, 20), 20).subscribe({
      next: (runs) => {
        this.workflowRuns.set(runs);
        this.dataSource.data = runs;
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load workflow runs.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  onRepoChange(repo: string): void {
    this.selectedRepo.set(repo);
    this.dataSource.data = this.filteredRuns();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
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

  getDuration(run: WorkflowRun): string {
    if (!run.run_started_at || run.status === 'in_progress') {
      return 'In progress';
    }

    const start = new Date(run.run_started_at);
    const end = new Date(run.updated_at);
    const diffMs = end.getTime() - start.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;

    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  }

  openRun(run: WorkflowRun): void {
    window.open(run.html_url, '_blank');
  }

  isFailedRun(run: WorkflowRun): boolean {
    return run.conclusion === 'failure';
  }

  viewSummary(run: WorkflowRun): void {
    const dialogData: SummaryDialogData = {
      run,
      loading: true
    };

    const dialogRef = this.dialog.open(SummaryDialogComponent, {
      data: dialogData,
      panelClass: 'summary-dialog-panel',
      maxWidth: '90vw'
    });

    // Fetch the summary
    const owner = run.repository?.owner?.login;
    const repo = run.repository?.name;

    if (owner && repo) {
      this.githubService.getWorkflowRunSummary(owner, repo, run.id).subscribe({
        next: (summary) => {
          dialogData.loading = false;
          dialogData.summary = summary;
        },
        error: (err) => {
          dialogData.loading = false;
          dialogData.error = err.message || 'Failed to fetch AI summary. Make sure the deployment monitoring service is running.';
          console.error('Failed to fetch summary:', err);
        }
      });
    } else {
      dialogData.loading = false;
      dialogData.error = 'Repository information not available';
    }
  }
}

