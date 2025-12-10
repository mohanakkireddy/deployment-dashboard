import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

// Configuration - Update these values for your GitHub OAuth App
export const OAUTH_CONFIG = {
  // Create OAuth App at: https://github.com/settings/developers
  clientId: '', // Your GitHub OAuth App Client ID
  // Proxy URL for token exchange (Cloudflare Worker, Netlify Function, etc.)
  tokenProxyUrl: '', // e.g., 'https://your-worker.workers.dev/token'
  // Redirect URI (your GitHub Pages URL)
  redirectUri: '', // e.g., 'https://username.github.io/deployment-dashboard/'
  // Scopes needed
  scopes: 'repo read:org'
};

@Injectable({
  providedIn: 'root'
})
export class OAuthService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  /**
   * Check if OAuth is configured
   */
  isOAuthConfigured(): boolean {
    return !!(OAUTH_CONFIG.clientId && OAUTH_CONFIG.tokenProxyUrl && OAUTH_CONFIG.redirectUri);
  }

  /**
   * Initiate GitHub OAuth flow
   */
  login(): void {
    if (!this.isOAuthConfigured()) {
      console.error('OAuth not configured. Please set OAUTH_CONFIG values.');
      return;
    }

    const state = this.generateState();
    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      scope: OAUTH_CONFIG.scopes,
      state: state
    });

    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Handle OAuth callback
   */
  handleCallback(): Observable<boolean> {
    return new Observable(observer => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const storedState = sessionStorage.getItem('oauth_state');

      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);

      if (!code) {
        observer.next(false);
        observer.complete();
        return;
      }

      // Verify state to prevent CSRF
      if (state !== storedState) {
        console.error('OAuth state mismatch');
        observer.next(false);
        observer.complete();
        return;
      }

      sessionStorage.removeItem('oauth_state');

      // Exchange code for token via proxy
      this.exchangeCodeForToken(code).subscribe({
        next: (response: any) => {
          if (response.access_token) {
            this.authService.setToken(response.access_token);
            observer.next(true);
          } else {
            observer.next(false);
          }
          observer.complete();
        },
        error: (err) => {
          console.error('Token exchange failed:', err);
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  /**
   * Exchange authorization code for access token via proxy
   */
  private exchangeCodeForToken(code: string): Observable<any> {
    return this.http.post(OAUTH_CONFIG.tokenProxyUrl, {
      code,
      redirect_uri: OAUTH_CONFIG.redirectUri
    });
  }

  /**
   * Generate random state for CSRF protection
   */
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check if current URL has OAuth callback parameters
   */
  hasCallbackParams(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('code');
  }
}

