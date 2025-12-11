import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of, catchError, map, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import {
  GitHubRepository,
  GitHubUser,
  WorkflowRun,
  WorkflowRunsResponse,
  Workflow,
  WorkflowsResponse,
  WorkflowRunSummaryResponse
} from '../models/workflow.model';
import {
  Deployment,
  DeploymentStatus,
  DeploymentWithStatus,
  Environment
} from '../models/deployment.model';
import { Release, ReleaseWithRepo } from '../models/release.model';

@Injectable({
  providedIn: 'root'
})
export class GitHubService {
  private readonly baseUrl = 'https://api.github.com';
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // User endpoints
  getCurrentUser(): Observable<GitHubUser> {
    return this.http.get<GitHubUser>(`${this.baseUrl}/user`);
  }

  getUserOrganizations(): Observable<{ login: string; id: number; avatar_url: string }[]> {
    return this.http.get<{ login: string; id: number; avatar_url: string }[]>(
      `${this.baseUrl}/user/orgs`
    );
  }

  // Repository endpoints
  getOrganizationRepos(org: string, perPage = 100): Observable<GitHubRepository[]> {
    const params = new HttpParams()
      .set('per_page', perPage.toString())
      .set('sort', 'updated')
      .set('direction', 'desc');

    return this.http.get<GitHubRepository[]>(
      `${this.baseUrl}/orgs/${org}/repos`,
      { params }
    );
  }

  getUserRepos(perPage = 100): Observable<GitHubRepository[]> {
    const params = new HttpParams()
      .set('per_page', perPage.toString())
      .set('sort', 'updated')
      .set('direction', 'desc')
      .set('affiliation', 'owner,collaborator,organization_member');

    return this.http.get<GitHubRepository[]>(
      `${this.baseUrl}/user/repos`,
      { params }
    );
  }

  // Workflow endpoints
  getWorkflowRuns(owner: string, repo: string, perPage = 30): Observable<WorkflowRunsResponse> {
    const params = new HttpParams().set('per_page', perPage.toString());

    return this.http.get<WorkflowRunsResponse>(
      `${this.baseUrl}/repos/${owner}/${repo}/actions/runs`,
      { params }
    );
  }

  getWorkflows(owner: string, repo: string): Observable<WorkflowsResponse> {
    return this.http.get<WorkflowsResponse>(
      `${this.baseUrl}/repos/${owner}/${repo}/actions/workflows`
    );
  }

  getAllWorkflowRuns(repos: GitHubRepository[], perPage = 10): Observable<WorkflowRun[]> {
    if (repos.length === 0) return of([]);

    const requests = repos.map(repo =>
      this.getWorkflowRuns(repo.owner.login, repo.name, perPage).pipe(
        map(response => response.workflow_runs.map(run => ({ ...run, repository: repo }))),
        catchError(() => of([]))
      )
    );

    return forkJoin(requests).pipe(
      map(results => results.flat().sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ))
    );
  }

  // Deployment endpoints
  getDeployments(owner: string, repo: string, perPage = 30): Observable<Deployment[]> {
    const params = new HttpParams().set('per_page', perPage.toString());

    return this.http.get<Deployment[]>(
      `${this.baseUrl}/repos/${owner}/${repo}/deployments`,
      { params }
    );
  }

  getDeploymentStatuses(owner: string, repo: string, deploymentId: number): Observable<DeploymentStatus[]> {
    return this.http.get<DeploymentStatus[]>(
      `${this.baseUrl}/repos/${owner}/${repo}/deployments/${deploymentId}/statuses`
    );
  }

  getEnvironments(owner: string, repo: string): Observable<{ environments: Environment[] }> {
    return this.http.get<{ environments: Environment[] }>(
      `${this.baseUrl}/repos/${owner}/${repo}/environments`
    );
  }

  getDeploymentsWithStatus(owner: string, repo: string, repository: GitHubRepository): Observable<DeploymentWithStatus[]> {
    return this.getDeployments(owner, repo).pipe(
      switchMap(deployments => {
        if (deployments.length === 0) return of([]);

        const statusRequests = deployments.map(deployment =>
          this.getDeploymentStatuses(owner, repo, deployment.id).pipe(
            map(statuses => ({
              ...deployment,
              latestStatus: statuses[0],
              repository
            } as DeploymentWithStatus)),
            catchError(() => of({ ...deployment, repository } as DeploymentWithStatus))
          )
        );

        return forkJoin(statusRequests);
      }),
      catchError(() => of([]))
    );
  }

  getAllDeployments(repos: GitHubRepository[]): Observable<DeploymentWithStatus[]> {
    if (repos.length === 0) return of([]);

    const requests = repos.map(repo =>
      this.getDeploymentsWithStatus(repo.owner.login, repo.name, repo)
    );

    return forkJoin(requests).pipe(
      map(results => results.flat().sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ))
    );
  }

  // Release endpoints
  getReleases(owner: string, repo: string, perPage = 30): Observable<Release[]> {
    const params = new HttpParams().set('per_page', perPage.toString());

    return this.http.get<Release[]>(
      `${this.baseUrl}/repos/${owner}/${repo}/releases`,
      { params }
    );
  }

  getAllReleases(repos: GitHubRepository[], perPage = 10): Observable<ReleaseWithRepo[]> {
    if (repos.length === 0) return of([]);

    const requests = repos.map(repo =>
      this.getReleases(repo.owner.login, repo.name, perPage).pipe(
        map(releases => releases.map(release => ({ ...release, repository: repo }))),
        catchError(() => of([]))
      )
    );

    return forkJoin(requests).pipe(
      map(results => results.flat().sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ))
    );
  }

  // Deployment Monitoring Service - AI Summary
  private readonly monitoringServiceUrl = 'https://hillary-unprevented-pinkly.ngrok-free.dev';

  getWorkflowRunSummary(owner: string, repo: string, runId: number, prNumber?: number): Observable<WorkflowRunSummaryResponse> {
    let url = `${this.monitoringServiceUrl}/api/workflows/${owner}/${repo}/runs/${runId}/summary`;
    
    if (prNumber) {
      url += `?pr_number=${prNumber}`;
    }

    // Add header to skip ngrok browser warning page
    const headers = new HttpHeaders({
      'ngrok-skip-browser-warning': 'true'
    });

    return this.http.get<WorkflowRunSummaryResponse>(url, { headers });
  }
}

