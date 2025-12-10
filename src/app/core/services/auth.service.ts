import { Injectable, signal, computed } from '@angular/core';

const STORAGE_KEY = 'github_pat';
const ORG_KEY = 'github_org';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSignal = signal<string | null>(this.getStoredToken());
  private organizationSignal = signal<string | null>(this.getStoredOrganization());

  readonly token = this.tokenSignal.asReadonly();
  readonly organization = this.organizationSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal());
  readonly hasOrganization = computed(() => !!this.organizationSignal());

  private getStoredToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
  }

  private getStoredOrganization(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(ORG_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(STORAGE_KEY, token);
    this.tokenSignal.set(token);
  }

  clearToken(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.tokenSignal.set(null);
  }

  setOrganization(org: string): void {
    localStorage.setItem(ORG_KEY, org);
    this.organizationSignal.set(org);
  }

  clearOrganization(): void {
    localStorage.removeItem(ORG_KEY);
    this.organizationSignal.set(null);
  }

  logout(): void {
    this.clearToken();
    this.clearOrganization();
  }
}

