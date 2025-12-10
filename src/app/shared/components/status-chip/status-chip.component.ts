import { Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [MatChipsModule, MatIconModule],
  template: `
    <mat-chip [class]="'status-chip ' + statusClass">
      <mat-icon class="status-icon">{{ icon }}</mat-icon>
      {{ label }}
    </mat-chip>
  `,
  styles: [`
    .status-chip {
      font-size: 12px;
      font-weight: 500;

      .status-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        margin-right: 4px;
      }
    }

    .status-success {
      background-color: rgba(76, 175, 80, 0.2) !important;
      color: #81c784 !important;
    }

    .status-failure, .status-error {
      background-color: rgba(244, 67, 54, 0.2) !important;
      color: #ef5350 !important;
    }

    .status-pending, .status-queued, .status-waiting {
      background-color: rgba(255, 152, 0, 0.2) !important;
      color: #ffb74d !important;
    }

    .status-in_progress, .status-in-progress {
      background-color: rgba(33, 150, 243, 0.2) !important;
      color: #64b5f6 !important;
    }

    .status-cancelled, .status-inactive {
      background-color: rgba(158, 158, 158, 0.2) !important;
      color: #bdbdbd !important;
    }
  `]
})
export class StatusChipComponent {
  @Input() status: string = '';

  get statusClass(): string {
    return `status-${this.status.toLowerCase().replace('_', '-')}`;
  }

  get icon(): string {
    const iconMap: Record<string, string> = {
      'success': 'check_circle',
      'completed': 'check_circle',
      'failure': 'cancel',
      'error': 'error',
      'pending': 'schedule',
      'queued': 'hourglass_empty',
      'waiting': 'hourglass_top',
      'in_progress': 'sync',
      'in-progress': 'sync',
      'cancelled': 'block',
      'inactive': 'pause_circle'
    };
    return iconMap[this.status.toLowerCase()] || 'help';
  }

  get label(): string {
    return this.status.replace('_', ' ').replace('-', ' ');
  }
}

