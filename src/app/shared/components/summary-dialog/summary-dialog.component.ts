import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { WorkflowRun, WorkflowRunSummaryResponse } from '../../../core/models';

export interface SummaryDialogData {
  run: WorkflowRun;
  summary?: WorkflowRunSummaryResponse;
  loading: boolean;
  error?: string;
}

@Component({
  selector: 'app-summary-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  template: `
    <div class="summary-dialog">
      <div class="dialog-header">
        <div class="header-icon">
          <mat-icon>psychology</mat-icon>
        </div>
        <div class="header-text">
          <h2>AI Failure Analysis</h2>
          <p class="workflow-info">{{ data.run.name }} #{{ data.run.run_number }}</p>
        </div>
        <button mat-icon-button class="close-btn" (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      @if (data.loading) {
        <div class="loading-state">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Analyzing workflow logs with AI...</p>
        </div>
      } @else if (data.error) {
        <div class="error-state">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <h3>Analysis Failed</h3>
          <p>{{ data.error }}</p>
          <button mat-stroked-button color="primary" (click)="close()">Close</button>
        </div>
      } @else if (data.summary) {
        <div class="summary-content">
          <div class="meta-info">
            <mat-chip-set>
              <mat-chip [class]="'severity-' + data.summary.ai_summary.severity">
                <mat-icon matChipAvatar>{{ getSeverityIcon(data.summary.ai_summary.severity) }}</mat-icon>
                {{ data.summary.ai_summary.severity | uppercase }}
              </mat-chip>
              <mat-chip class="error-type">
                <mat-icon matChipAvatar>{{ getErrorTypeIcon(data.summary.ai_summary.error_type) }}</mat-icon>
                {{ data.summary.ai_summary.error_type }}
              </mat-chip>
            </mat-chip-set>
          </div>

          <div class="summary-section">
            <div class="section-header">
              <mat-icon>summarize</mat-icon>
              <h3>Summary</h3>
            </div>
            <p>{{ data.summary.ai_summary.summary }}</p>
          </div>

          <div class="summary-section root-cause">
            <div class="section-header">
              <mat-icon>bug_report</mat-icon>
              <h3>Root Cause</h3>
            </div>
            <p>{{ data.summary.ai_summary.root_cause }}</p>
          </div>

          <div class="summary-section suggested-fix">
            <div class="section-header">
              <mat-icon>lightbulb</mat-icon>
              <h3>Suggested Fix</h3>
            </div>
            <p>{{ data.summary.ai_summary.suggested_fix }}</p>
          </div>

          @if (data.summary.pr) {
            <div class="pr-info">
              <mat-icon>merge</mat-icon>
              <div class="pr-details">
                <span class="pr-title">{{ data.summary.pr.title }}</span>
                <span class="pr-author">by {{ data.summary.pr.author }}</span>
              </div>
              <a mat-icon-button [href]="data.summary.pr.html_url" target="_blank" matTooltip="View PR">
                <mat-icon>open_in_new</mat-icon>
              </a>
            </div>
          }
        </div>

        <div class="dialog-actions">
          <button mat-stroked-button (click)="close()">Close</button>
          <a mat-flat-button color="primary" [href]="data.run.html_url" target="_blank">
            <mat-icon>open_in_new</mat-icon>
            View on GitHub
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .summary-dialog {
      min-width: 500px;
      max-width: 600px;
      background: #1a1a2e;
      color: #fff;
    }

    .dialog-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 24px 24px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      .header-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: linear-gradient(135deg, #7c3aed 0%, #00d9ff 100%);
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
      }

      .header-text {
        flex: 1;

        h2 {
          margin: 0 0 4px;
          font-size: 20px;
          font-weight: 600;
        }

        .workflow-info {
          margin: 0;
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
        }
      }

      .close-btn {
        margin: -8px -8px 0 0;
        color: rgba(255, 255, 255, 0.6);
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
      gap: 24px;

      p {
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
      }
    }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      text-align: center;

      .error-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #f44336;
        margin-bottom: 16px;
      }

      h3 {
        margin: 0 0 8px;
        color: #fff;
      }

      p {
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 24px;
      }
    }

    .summary-content {
      padding: 24px;
    }

    .meta-info {
      margin-bottom: 24px;

      mat-chip {
        font-weight: 500;
        text-transform: capitalize;
      }

      .severity-critical {
        background: rgba(244, 67, 54, 0.2) !important;
        color: #f44336 !important;
      }

      .severity-high {
        background: rgba(255, 152, 0, 0.2) !important;
        color: #ff9800 !important;
      }

      .severity-medium {
        background: rgba(255, 193, 7, 0.2) !important;
        color: #ffc107 !important;
      }

      .severity-low {
        background: rgba(76, 175, 80, 0.2) !important;
        color: #4caf50 !important;
      }

      .severity-unknown {
        background: rgba(158, 158, 158, 0.2) !important;
        color: #9e9e9e !important;
      }

      .error-type {
        background: rgba(124, 58, 237, 0.2) !important;
        color: #b39ddb !important;
      }
    }

    .summary-section {
      margin-bottom: 20px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 12px;
      border-left: 3px solid #7c3aed;

      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
          color: #00d9ff;
        }

        h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }
      }

      p {
        margin: 0;
        color: rgba(255, 255, 255, 0.8);
        font-size: 14px;
        line-height: 1.6;
      }

      &.root-cause {
        border-left-color: #f44336;
      }

      &.suggested-fix {
        border-left-color: #4caf50;
      }
    }

    .pr-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: rgba(0, 217, 255, 0.1);
      border-radius: 8px;
      margin-top: 16px;

      mat-icon {
        color: #00d9ff;
      }

      .pr-details {
        flex: 1;
        display: flex;
        flex-direction: column;

        .pr-title {
          font-weight: 500;
          color: #fff;
          font-size: 14px;
        }

        .pr-author {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
  `]
})
export class SummaryDialogComponent {
  data = inject<SummaryDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<SummaryDialogComponent>);

  close(): void {
    this.dialogRef.close();
  }

  getSeverityIcon(severity: string): string {
    const icons: Record<string, string> = {
      critical: 'error',
      high: 'warning',
      medium: 'info',
      low: 'check_circle',
      unknown: 'help'
    };
    return icons[severity] || 'help';
  }

  getErrorTypeIcon(errorType: string): string {
    const icons: Record<string, string> = {
      build: 'build',
      test: 'science',
      deploy: 'rocket_launch',
      dependency: 'inventory_2',
      configuration: 'settings',
      permission: 'lock',
      other: 'category'
    };
    return icons[errorType] || 'category';
  }
}

