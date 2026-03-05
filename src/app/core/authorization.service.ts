import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthorizationRequest, DashboardData, DashboardSummary } from './authorization.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthorizationService {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  private readonly summarySignal = signal<DashboardSummary | null>(null);
  readonly summary = this.summarySignal.asReadonly();

  private readonly requestsSignal = signal<AuthorizationRequest[]>([]);
  readonly requests = this.requestsSignal.asReadonly();

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();

  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  private readonly loadedSignal = signal(false);
  readonly loaded = this.loadedSignal.asReadonly();

  loadDashboard(): void {
    if (this.loadedSignal() || this.loadingSignal()) return;

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.http.get<DashboardData>('assets/data.json')
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingSignal.set(false)),
      )
      .subscribe({
        next: data => {
          this.summarySignal.set(data.summary);
          this.requestsSignal.set(data.requests);
          this.loadedSignal.set(true);
        },
        error: (err: Error) => {
          this.errorSignal.set('Failed to load dashboard data. Please try again.');
          console.error('Dashboard load failed', err);
        }
      });
  }

  retryLoad(): void {
    this.loadedSignal.set(false);
    this.loadDashboard();
  }

  updateRequestStatus(requestId: string, newStatus: string): void {
    this.requestsSignal.update(requests =>
      requests.map(req =>
        req.id === requestId
          ? {
              ...req,
              status: newStatus,
              timeline: [
                ...req.timeline,
                {
                  date: new Date().toISOString().split('T')[0],
                  status: newStatus,
                  note: `Status changed to ${newStatus}`
                }
              ]
            }
          : req
      )
    );
  }

  deleteRequest(requestId: string): void {
    this.requestsSignal.update(requests =>
      requests.filter(req => req.id !== requestId)
    );
  }
}
