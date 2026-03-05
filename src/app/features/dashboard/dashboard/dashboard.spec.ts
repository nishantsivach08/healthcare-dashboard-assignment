import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { Dashboard } from './dashboard';
import { AuthorizationService } from '../../../core/authorization.service';

const mockData = {
  summary: {
    pending: 3,
    approved_this_month: 5,
    denied: 1,
    appeals_in_progress: 1,
    urgent: 2
  },
  requests: [
    {
      id: 'auth_001',
      patient: { id: 'pt_1001', name: 'Test Patient', member_id: 'MEM001' },
      health_plan: 'Test Plan',
      request_type: 'Additional Prenatal',
      visits_requested: 6,
      visits_used: 7,
      visits_remaining: 2,
      submitted_date: '2026-01-10',
      days_pending: 5,
      status: 'pending',
      appeal_deadline: null,
      doula: 'Test Doula',
      submission_method: 'Portal',
      confirmation_number: 'CONF-001',
      clinical_justification: 'Test justification',
      timeline: [
        { date: '2026-01-10', status: 'submitted', note: 'Submitted' }
      ]
    }
  ],
  health_plans: ['Test Plan']
};

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        AuthorizationService,
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display loading state initially', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('assets/data.json');
    expect(component.loading()).toBe(true);

    // Verify skeleton cards render during loading
    const skeletons = fixture.nativeElement.querySelectorAll('app-summary-card');
    expect(skeletons.length).toBe(5);

    req.flush(mockData);
  });

  it('should load summary cards after data fetch', async () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('assets/data.json');
    req.flush(mockData);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.cards().length).toBe(5);
    expect(component.cards()[0].title).toBe('Pending');
    expect(component.cards()[0].value).toBe(3);
  });

  it('should display error state on load failure', async () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('assets/data.json');
    req.error(new ProgressEvent('Network error'));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.error()).toBeTruthy();
  });

  it('should retry loading on retry button click', () => {
    fixture.detectChanges();
    httpMock.expectOne('assets/data.json').error(new ProgressEvent('error'));
    fixture.detectChanges();

    component.onRetry();
    fixture.detectChanges();

    httpMock.expectOne('assets/data.json').flush(mockData);
    fixture.detectChanges();

    expect(component.cards().length).toBe(5);
  });
});
