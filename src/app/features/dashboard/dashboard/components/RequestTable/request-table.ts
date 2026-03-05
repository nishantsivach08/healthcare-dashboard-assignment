import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { NgClass, DatePipe, TitleCasePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthorizationService } from '../../../../../core/authorization.service';
import { RequestFilterBarComponent, FilterState } from '../RequestFilterBar/request-filter-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../../shared/confirm-dialog/confirm-dialog';
import {
  AuthorizationRequest,
  REQUEST_STATUS,
  URGENT_DAYS_THRESHOLD,
  APPEAL_DEADLINE_DAYS,
  MS_PER_DAY,
} from '../../../../../core/authorization.model';

@Component({
  selector: 'app-request-table',
  imports: [
    NgClass,
    DatePipe,
    TitleCasePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatMenuModule,
    MatDividerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatDialogModule,
    RequestFilterBarComponent,
  ],
  templateUrl: './request-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestTableComponent {
  private readonly authService = inject(AuthorizationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  requests = this.authService.requests;
  loading = this.authService.loading;

  Math = Math;

  expandedRow = signal<string | null>(null);

  displayedColumns = [
    'expand',
    'patient_name', 'health_plan', 'request_type', 'visits_requested',
    'submitted_date', 'days_pending', 'status', 'appeal_deadline', 'actions'
  ];

  filters = signal<FilterState>({
    statuses: [], healthPlans: [], requestTypes: [],
    dateFrom: null, dateTo: null, urgentOnly: false,
    sortField: 'submitted_date', sortDirection: 'desc',
  });

  filteredRequests = computed(() => {
    const f = this.filters();
    let data = [...this.requests()];

    if (f.statuses.length)
      data = data.filter(r => f.statuses.includes(r.status));
    if (f.healthPlans.length)
      data = data.filter(r => f.healthPlans.includes(r.health_plan));
    if (f.requestTypes.length)
      data = data.filter(r => f.requestTypes.includes(r.request_type));
    if (f.dateFrom)
      data = data.filter(r => r.submitted_date && new Date(r.submitted_date) >= f.dateFrom!);
    if (f.dateTo)
      data = data.filter(r => r.submitted_date && new Date(r.submitted_date) <= f.dateTo!);
    if (f.urgentOnly) {
      const today = new Date();
      data = data.filter(r => {
        const longPending = (r.days_pending ?? 0) > URGENT_DAYS_THRESHOLD;
        const deadlineSoon = r.appeal_deadline
          ? (new Date(r.appeal_deadline).getTime() - today.getTime()) / MS_PER_DAY <= APPEAL_DEADLINE_DAYS
          : false;
        return longPending || deadlineSoon;
      });
    }

    const dir = f.sortDirection === 'asc' ? 1 : -1;
    data.sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      switch (f.sortField) {
        case 'patient.name':
          aVal = a.patient.name.toLowerCase();
          bVal = b.patient.name.toLowerCase(); break;
        case 'submitted_date':
          aVal = a.submitted_date ? new Date(a.submitted_date).getTime() : 0;
          bVal = b.submitted_date ? new Date(b.submitted_date).getTime() : 0; break;
        case 'days_pending':
          aVal = a.days_pending ?? 0; bVal = b.days_pending ?? 0; break;
        case 'appeal_deadline':
          aVal = a.appeal_deadline
            ? new Date(a.appeal_deadline).getTime() : Infinity;
          bVal = b.appeal_deadline
            ? new Date(b.appeal_deadline).getTime() : Infinity; break;
        default:
          aVal = 0; bVal = 0;
      }
      return aVal < bVal ? -1 * dir : aVal > bVal ? 1 * dir : 0;
    });

    return data;
  });

  toggleRow(id: string): void {
    this.expandedRow.update(current => current === id ? null : id);
  }

  isExpanded(id: string): boolean {
    return this.expandedRow() === id;
  }

  onFiltersChanged(state: FilterState): void {
    this.filters.set(state);
  }

  // ─── Action Handlers ───

  onAction(action: string, req: AuthorizationRequest): void {
    switch (action) {
      case 'submit':
        this.confirmAction('Submit Request',
          `Submit authorization request for ${req.patient.name}?`,
          () => {
            this.authService.updateRequestStatus(req.id, REQUEST_STATUS.SUBMITTED);
            this.showSnack(`Request for ${req.patient.name} submitted`);
          });
        break;
      case 'edit':
        this.showSnack(`Editing request for ${req.patient.name} (feature coming soon)`);
        break;
      case 'delete':
        this.confirmAction('Delete Request',
          `Are you sure you want to delete the request for ${req.patient.name}? This cannot be undone.`,
          () => {
            this.authService.deleteRequest(req.id);
            this.showSnack(`Request for ${req.patient.name} deleted`, 'Undo', () => {
              // In production, this would restore the request
            });
          });
        break;
      case 'approve':
        this.confirmAction('Mark as Approved',
          `Mark ${req.patient.name}'s request as approved?`,
          () => {
            this.authService.updateRequestStatus(req.id, REQUEST_STATUS.APPROVED);
            this.showSnack(`Request for ${req.patient.name} approved`);
          });
        break;
      case 'deny':
        this.confirmAction('Mark as Denied',
          `Mark ${req.patient.name}'s request as denied?`,
          () => {
            this.authService.updateRequestStatus(req.id, REQUEST_STATUS.DENIED);
            this.showSnack(`Request for ${req.patient.name} denied`);
          });
        break;
      case 'followup':
        this.showSnack(`Follow-up initiated for ${req.patient.name}`);
        break;
      case 'view':
        this.expandedRow.set(req.id);
        break;
      case 'patient':
        this.showSnack(`Viewing patient profile for ${req.patient.name} (feature coming soon)`);
        break;
      case 'appeal':
        this.confirmAction('Start Appeal',
          `Start an appeal for ${req.patient.name}'s denied request?`,
          () => {
            this.authService.updateRequestStatus(req.id, REQUEST_STATUS.APPEAL_SUBMITTED);
            this.showSnack(`Appeal started for ${req.patient.name}`);
          });
        break;
      case 'reason':
        this.expandedRow.set(req.id);
        break;
      case 'appeal_approve':
        this.confirmAction('Mark Appeal Approved',
          `Mark ${req.patient.name}'s appeal as approved?`,
          () => {
            this.authService.updateRequestStatus(req.id, REQUEST_STATUS.APPROVED);
            this.showSnack(`Appeal approved for ${req.patient.name}`);
          });
        break;
      case 'appeal_deny':
        this.confirmAction('Mark Appeal Denied',
          `Mark ${req.patient.name}'s appeal as denied?`,
          () => {
            this.authService.updateRequestStatus(req.id, REQUEST_STATUS.APPEAL_DENIED);
            this.showSnack(`Appeal denied for ${req.patient.name}`);
          });
        break;
    }
  }

  private confirmAction(title: string, message: string, onConfirm: () => void): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { title, message },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) onConfirm();
    });
  }

  private showSnack(message: string, action = 'OK', onAction?: () => void): void {
    const ref = this.snackBar.open(message, action, { duration: 4000 });
    if (onAction) {
      ref.onAction().subscribe(onAction);
    }
  }

  // CSV Export

  exportToCsv(): void {
    const data = this.filteredRequests();
    if (!data.length) {
      this.showSnack('No data to export');
      return;
    }

    const headers = [
      'Patient Name', 'Member ID', 'Health Plan', 'Request Type',
      'Visits Requested', 'Visits Used', 'Visits Remaining',
      'Submitted Date', 'Days Pending', 'Status', 'Appeal Deadline',
      'Doula', 'Submission Method', 'Confirmation #', 'Clinical Justification'
    ];

    const rows = data.map(r => [
      r.patient.name, r.patient.member_id, r.health_plan, r.request_type,
      r.visits_requested, r.visits_used, r.visits_remaining,
      r.submitted_date ?? '', r.days_pending ?? '', r.status, r.appeal_deadline ?? '',
      r.doula, r.submission_method ?? '', r.confirmation_number ?? '',
      `"${(r.clinical_justification ?? '').replace(/"/g, '""')}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `authorization-requests-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.showSnack(`Exported ${data.length} records to CSV`);
  }

  // Styling Helpers

  statusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'draft':            return 'bg-gray-100 text-gray-600 border border-gray-200';
      case 'submitted':        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'pending':          return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
      case 'approved':         return 'bg-green-50 text-green-700 border border-green-200';
      case 'denied':           return 'bg-red-50 text-red-700 border border-red-200';
      case 'appeal_submitted':
      case 'appeal submitted': return 'bg-orange-50 text-orange-700 border border-orange-200';
      case 'appeal_approved':
      case 'appeal approved':  return 'bg-green-50 text-green-700 border border-green-200';
      case 'appeal_denied':
      case 'appeal denied':    return 'bg-red-100 text-red-800 border border-red-300';
      default:                 return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  }

  statusDot(status: string): string {
    switch (status.toLowerCase()) {
      case 'draft':            return 'bg-gray-400';
      case 'submitted':        return 'bg-blue-400';
      case 'pending':          return 'bg-yellow-400';
      case 'approved':         return 'bg-secondary';
      case 'denied':           return 'bg-danger';
      case 'appeal_submitted':
      case 'appeal submitted': return 'bg-orange-400';
      case 'appeal_approved':
      case 'appeal approved':  return 'bg-secondary';
      case 'appeal_denied':
      case 'appeal denied':    return 'bg-red-800';
      default:                 return 'bg-gray-400';
    }
  }

  timelineIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'draft':     return 'edit_note';
      case 'submitted': return 'send';
      case 'pending':   return 'hourglass_empty';
      case 'approved':  return 'check_circle';
      case 'denied':    return 'cancel';
      case 'appeal_submitted': return 'gavel';
      case 'appeal_approved':  return 'verified';
      case 'appeal_denied':    return 'block';
      default:          return 'radio_button_unchecked';
    }
  }

  statusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }

  getActions(status: string) {
    const actions: Record<string, { label: string; action: string; icon: string }[]> = {
      [REQUEST_STATUS.DRAFT]: [
        { label: 'Review & Submit', action: 'submit', icon: 'send' },
        { label: 'Edit', action: 'edit', icon: 'edit' },
        { label: 'Delete', action: 'delete', icon: 'delete' }
      ],
      [REQUEST_STATUS.SUBMITTED]: [
        { label: 'Mark as Approved', action: 'approve', icon: 'check_circle' },
        { label: 'Mark as Denied', action: 'deny', icon: 'cancel' },
        { label: 'Follow Up', action: 'followup', icon: 'email' }
      ],
      [REQUEST_STATUS.PENDING]: [
        { label: 'Mark as Approved', action: 'approve', icon: 'check_circle' },
        { label: 'Mark as Denied', action: 'deny', icon: 'cancel' },
        { label: 'Follow Up', action: 'followup', icon: 'email' }
      ],
      [REQUEST_STATUS.APPROVED]: [
        { label: 'View Details', action: 'view', icon: 'visibility' },
        { label: 'View Patient', action: 'patient', icon: 'person' }
      ],
      [REQUEST_STATUS.DENIED]: [
        { label: 'Start Appeal', action: 'appeal', icon: 'gavel' },
        { label: 'View Denial Reason', action: 'reason', icon: 'info' },
        { label: 'View Patient', action: 'patient', icon: 'person' }
      ],
      [REQUEST_STATUS.APPEAL_SUBMITTED]: [
        { label: 'Mark Appeal Approved', action: 'appeal_approve', icon: 'verified' },
        { label: 'Mark Appeal Denied', action: 'appeal_deny', icon: 'block' }
      ]
    };

    return actions[status?.toLowerCase()] || [];
  }
}
