import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthorizationService } from './authorization.service';

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
    },
    {
      id: 'auth_002',
      patient: { id: 'pt_1002', name: 'Another Patient', member_id: 'MEM002' },
      health_plan: 'Another Plan',
      request_type: 'Additional Postpartum',
      visits_requested: 9,
      visits_used: 9,
      visits_remaining: 0,
      submitted_date: '2026-01-03',
      days_pending: 12,
      status: 'denied',
      appeal_deadline: '2026-02-04',
      doula: 'Test Doula 2',
      submission_method: 'Fax',
      confirmation_number: 'CONF-002',
      clinical_justification: 'Test justification 2',
      timeline: []
    }
  ],
  health_plans: ['Test Plan', 'Another Plan']
};

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthorizationService,
      ],
    });

    service = TestBed.inject(AuthorizationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with default state', () => {
    expect(service.summary()).toBeNull();
    expect(service.requests()).toEqual([]);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.loaded()).toBe(false);
  });

  it('should load dashboard data', () => {
    service.loadDashboard();
    expect(service.loading()).toBe(true);

    const req = httpMock.expectOne('assets/data.json');
    req.flush(mockData);

    expect(service.loading()).toBe(false);
    expect(service.loaded()).toBe(true);
    expect(service.summary()!.pending).toBe(3);
    expect(service.requests().length).toBe(2);
  });

  it('should set error on failure', () => {
    service.loadDashboard();
    const req = httpMock.expectOne('assets/data.json');
    req.error(new ProgressEvent('Network error'));

    expect(service.loading()).toBe(false);
    expect(service.error()).toBeTruthy();
  });

  it('should not load twice if already loaded', () => {
    service.loadDashboard();
    httpMock.expectOne('assets/data.json').flush(mockData);

    service.loadDashboard();
    httpMock.expectNone('assets/data.json');
  });

  it('should update request status', () => {
    service.loadDashboard();
    httpMock.expectOne('assets/data.json').flush(mockData);

    service.updateRequestStatus('auth_001', 'approved');

    const updated = service.requests().find(r => r.id === 'auth_001');
    expect(updated!.status).toBe('approved');
    expect(updated!.timeline.length).toBe(2);
    expect(updated!.timeline[1].status).toBe('approved');
  });

  it('should delete request', () => {
    service.loadDashboard();
    httpMock.expectOne('assets/data.json').flush(mockData);

    expect(service.requests().length).toBe(2);
    service.deleteRequest('auth_001');
    expect(service.requests().length).toBe(1);
    expect(service.requests()[0].id).toBe('auth_002');
  });

  it('should retry load after failure', () => {
    service.loadDashboard();
    httpMock.expectOne('assets/data.json').error(new ProgressEvent('error'));

    expect(service.error()).toBeTruthy();

    service.retryLoad();
    const req = httpMock.expectOne('assets/data.json');
    req.flush(mockData);

    expect(service.error()).toBeNull();
    expect(service.loaded()).toBe(true);
    expect(service.requests().length).toBe(2);
  });
});
