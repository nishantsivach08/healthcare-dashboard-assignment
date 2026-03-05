import {
  ChangeDetectionStrategy,
  Component,
  output,
  signal,
  computed,
  inject,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthorizationService } from '../../../../../core/authorization.service';
import { MatCardModule } from '@angular/material/card';

export interface FilterState {
  statuses: string[];
  healthPlans: string[];
  requestTypes: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
  urgentOnly: boolean;
  sortField: string;
  sortDirection: 'asc' | 'desc';
}

@Component({
  selector: 'app-request-filter-bar',
  imports: [
    TitleCasePipe,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatCardModule,
  ],
  templateUrl: './request-filter-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestFilterBarComponent {
  private readonly authService = inject(AuthorizationService);
  requests = this.authService.requests;

  filtersChanged = output<FilterState>();

  // Filter state
  selectedStatuses = signal<string[]>([]);
  selectedHealthPlans = signal<string[]>([]);
  selectedRequestTypes = signal<string[]>([]);
  dateFrom = signal<Date | null>(null);
  dateTo = signal<Date | null>(null);
  urgentOnly = signal(false);
  sortValue = signal('submitted_date|desc');

  // Dynamic options
  allStatuses = computed(() => [...new Set(this.requests().map((r) => r.status))]);
  allHealthPlans = computed(() => [...new Set(this.requests().map((r) => r.health_plan))]);
  allRequestTypes = computed(() => [...new Set(this.requests().map((r) => r.request_type))]);

  activeSortLabel = computed(() => {
    return this.sortOptions.find((o) => o.value === this.sortValue())?.label ?? '';
  });

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedStatuses().length) count++;
    if (this.selectedHealthPlans().length) count++;
    if (this.selectedRequestTypes().length) count++;
    if (this.dateFrom() || this.dateTo()) count++;
    if (this.urgentOnly()) count++;
    return count;
  });

  sortOptions = [
    { label: 'Submitted Date (Newest)', value: 'submitted_date|desc' },
    { label: 'Submitted Date (Oldest)', value: 'submitted_date|asc' },
    { label: 'Patient Name (A–Z)', value: 'patient.name|asc' },
    { label: 'Patient Name (Z–A)', value: 'patient.name|desc' },
    { label: 'Days Pending (Longest)', value: 'days_pending|desc' },
    { label: 'Days Pending (Shortest)', value: 'days_pending|asc' },
    { label: 'Appeal Deadline (Soonest)', value: 'appeal_deadline|asc' },
  ];

  onSortChange(value: string) {
    this.sortValue.set(value);
    this.emit();
  }

  clearAll() {
    this.selectedStatuses.set([]);
    this.selectedHealthPlans.set([]);
    this.selectedRequestTypes.set([]);
    this.dateFrom.set(null);
    this.dateTo.set(null);
    this.urgentOnly.set(false);
    this.sortValue.set('submitted_date|desc');
    this.emit();
  }

  emit() {
    const [field, direction] = this.sortValue().split('|');
    this.filtersChanged.emit({
      statuses: this.selectedStatuses(),
      healthPlans: this.selectedHealthPlans(),
      requestTypes: this.selectedRequestTypes(),
      dateFrom: this.dateFrom(),
      dateTo: this.dateTo(),
      urgentOnly: this.urgentOnly(),
      sortField: field,
      sortDirection: direction as 'asc' | 'desc',
    });
  }
}
