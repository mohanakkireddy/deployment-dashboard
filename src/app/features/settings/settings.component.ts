import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../core/services/auth.service';
import { GitHubService } from '../../core/services/github.service';
import { OAuthService, OAUTH_CONFIG } from '../../core/services/oauth.service';
import { GitHubUser } from '../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private githubService = inject(GitHubService);
  private oauthService = inject(OAuthService);
  private snackBar = inject(MatSnackBar);

  token = signal('');
  selectedOrg = signal('');
  hideToken = signal(true);

  loading = signal(false);
  verifying = signal(false);
  oauthLoading = signal(false);

  currentUser = signal<GitHubUser | null>(null);
  organizations = signal<{ login: string; id: number; avatar_url: string }[]>([]);

  isAuthenticated = this.authService.isAuthenticated;
  storedOrganization = this.authService.organization;
  isOAuthConfigured = this.oauthService.isOAuthConfigured();

  ngOnInit(): void {
    // Handle OAuth callback if present
    if (this.oauthService.hasCallbackParams()) {
      this.handleOAuthCallback();
      return;
    }

    if (this.isAuthenticated()) {
      this.loadUserData();
    }
    // Load stored organization
    const org = this.storedOrganization();
    if (org) {
      this.selectedOrg.set(org);
    }
  }

  private handleOAuthCallback(): void {
    this.oauthLoading.set(true);
    this.oauthService.handleCallback().subscribe({
      next: (success) => {
        this.oauthLoading.set(false);
        if (success) {
          this.snackBar.open('Successfully logged in with GitHub!', 'Close', { duration: 3000 });
          this.loadUserData();
        } else {
          this.snackBar.open('OAuth login failed. Please try again.', 'Close', { duration: 3000 });
        }
      },
      error: () => {
        this.oauthLoading.set(false);
        this.snackBar.open('OAuth login failed. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }

  private loadUserData(): void {
    this.loading.set(true);

    this.githubService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.loadOrganizations();
      },
      error: (err) => {
        console.error('Failed to load user data', err);
        this.loading.set(false);
      }
    });
  }

  private loadOrganizations(): void {
    this.githubService.getUserOrganizations().subscribe({
      next: (orgs) => {
        this.organizations.set(orgs);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load organizations', err);
        this.loading.set(false);
      }
    });
  }

  loginWithGitHub(): void {
    this.oauthService.login();
  }

  saveToken(): void {
    const tokenValue = this.token().trim();
    if (!tokenValue) {
      this.snackBar.open('Please enter a valid token', 'Close', { duration: 3000 });
      return;
    }

    this.verifying.set(true);

    // Temporarily set token to verify
    this.authService.setToken(tokenValue);

    this.githubService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser.set(user);
        this.token.set('');
        this.verifying.set(false);
        this.snackBar.open(`Successfully authenticated as ${user.login}`, 'Close', { duration: 3000 });
        this.loadOrganizations();
      },
      error: (err) => {
        this.authService.clearToken();
        this.verifying.set(false);
        this.snackBar.open('Invalid token. Please check and try again.', 'Close', { duration: 3000 });
        console.error(err);
      }
    });
  }

  saveOrganization(): void {
    const org = this.selectedOrg();
    if (org) {
      this.authService.setOrganization(org);
      this.snackBar.open(`Organization set to ${org}`, 'Close', { duration: 3000 });
    }
  }

  clearOrganization(): void {
    this.authService.clearOrganization();
    this.selectedOrg.set('');
    this.snackBar.open('Organization cleared. Using personal repositories.', 'Close', { duration: 3000 });
  }

  logout(): void {
    this.authService.logout();
    this.currentUser.set(null);
    this.organizations.set([]);
    this.selectedOrg.set('');
    this.snackBar.open('Logged out successfully', 'Close', { duration: 3000 });
  }

  toggleTokenVisibility(): void {
    this.hideToken.update(v => !v);
  }
}
