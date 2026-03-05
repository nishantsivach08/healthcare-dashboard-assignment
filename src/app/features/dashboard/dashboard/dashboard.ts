import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { SummaryCardComponent } from './components/summary-cards/summary-cards';
import { AuthorizationService } from '../../../core/authorization.service';
import { RequestTableComponent } from './components/RequestTable/request-table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard',
  imports: [SummaryCardComponent, RequestTableComponent, MatIconModule, MatButtonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private readonly authService = inject(AuthorizationService);

  summary = this.authService.summary;
  loading = this.authService.loading;
  error = this.authService.error;

  cards = computed(() => {
    const s = this.summary();
    if (!s) return [];

    return [
      {
        id: 'pending',
        title: 'Pending',
        value: s.pending,
        colorClass: 'text-primary',
        isUrgent: false,
        icon: 'pending_actions'
      },
      {
        id: 'approved',
        title: 'Approved (This Month)',
        value: s.approved_this_month,
        colorClass: 'text-secondary',
        isUrgent: false,
        icon: 'check_circle'
      },
      {
        id: 'denied',
        title: 'Denied',
        value: s.denied,
        colorClass: 'text-red-600',
        isUrgent: false,
        icon: 'cancel'
      },
      {
        id: 'appeals',
        title: 'Appeals in Progress',
        value: s.appeals_in_progress,
        colorClass: 'text-accent',
        isUrgent: false,
        icon: 'hourglass_top'
      },
      {
        id: 'urgent',
        title: 'Urgent',
        value: s.urgent,
        colorClass: 'text-red-700',
        isUrgent: true,
        icon: 'priority_high'
      }
    ];
  });

  ngOnInit(): void {
    this.authService.loadDashboard();
  }

  onRetry(): void {
    this.authService.retryLoad();
  }
}
