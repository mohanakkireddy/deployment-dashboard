import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterLink } from '@angular/router';
import { GitHubService } from '../../core/services/github.service';
import { AuthService } from '../../core/services/auth.service';
import { GitHubRepository } from '../../core/models';
import { ReleaseWithRepo } from '../../core/models/release.model';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-releases',
  standalone: true,
  imports: [
    SlicePipe,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatBadgeModule,
    RouterLink,
    LoadingSpinnerComponent
  ],
  templateUrl: './releases.component.html',
  styleUrl: './releases.component.scss'
})
export class ReleasesComponent implements OnInit {
  private githubService = inject(GitHubService);
  private authService = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);

  repos = signal<GitHubRepository[]>([]);
  releases = signal<ReleaseWithRepo[]>([]);
  selectedRepo = signal<string>('all');

  isAuthenticated = this.authService.isAuthenticated;
  organization = this.authService.organization;

  filteredReleases = computed(() => {
    const releases = this.releases();
    const selectedRepo = this.selectedRepo();

    if (selectedRepo === 'all') {
      return releases;
    }
    return releases.filter(r => r.repository?.name === selectedRepo);
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
        this.loadReleases(repos);
      },
      error: (err) => {
        this.error.set('Failed to load repositories.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  private loadReleases(repos: GitHubRepository[]): void {
    this.githubService.getAllReleases(repos.slice(0, 20), 10).subscribe({
      next: (releases) => {
        this.releases.set(releases);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load releases.');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  onRepoChange(repo: string): void {
    this.selectedRepo.set(repo);
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

  getTotalDownloads(release: ReleaseWithRepo): number {
    return release.assets.reduce((sum, asset) => sum + asset.download_count, 0);
  }

  formatDownloads(count: number): string {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  openRelease(release: ReleaseWithRepo): void {
    window.open(release.html_url, '_blank');
  }
}

