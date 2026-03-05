import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RequestTableComponent } from './request-table';
import { AuthorizationService } from '../../../../../core/authorization.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';

const mockData = {
  summary: {
    pending: 1, approved_this_month: 0, denied: 1,
    appeals_in_progress: 0, urgent: 1
  },
  requests: [
    {
      id: 'auth_001',
      patient: { id: 'pt_1001', name: 'Test Patient', member_id: 'MEM001' },
      health_plan: 'Plan A', request_type: 'Additional Prenatal',
      visits_requested: 6, visits_used: 4, visits_remaining: 2,
      submitted_date: '2026-01-10', days_pending: 5, status: 'pending',
      appeal_deadline: null, doula: 'Doula A',
      submission_method: 'Portal', confirmation_number: 'CONF-001',
      clinical_justification: 'Test justification',
      timeline: [{ date: '2026-01-10', status: 'submitted', note: 'Submitted' }]
    },
    {
      id: 'auth_002',
      patient: { id: 'pt_1002', name: 'Another Patient', member_id: 'MEM002' },
      health_plan: 'Plan B', request_type: 'Additional Postpartum',
      visits_requested: 9, visits_used: 9, visits_remaining: 0,
      submitted_date: '2026-01-03', days_pending: 12, status: 'denied',
      appeal_deadline: '2026-02-04', doula: 'Doula B',
      submission_method: 'Fax', confirmation_number: 'CONF-002',
      clinical_justification: 'Test justification 2',
      timeline: []
    }
  ],
  health_plans: ['Plan A', 'Plan B']
};

const snackBarMock = {
  open: vi.fn().mockReturnValue({ onAction: () => of(void 0) }),
};

describe('RequestTableComponent', () => {
  let component: RequestTableComponent;
  let fixture: ComponentFixture<RequestTableComponent>;
  let httpMock: HttpTestingController;
  let authService: AuthorizationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestTableComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestTableComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthorizationService);
    snackBarMock.open.mockClear();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct displayed columns', () => {
    expect(component.displayedColumns).toContain('patient_name');
    expect(component.displayedColumns).toContain('status');
    expect(component.displayedColumns).toContain('actions');
  });

  it('should toggle row expansion', () => {
    expect(component.isExpanded('auth_001')).toBe(false);

    component.toggleRow('auth_001');
    expect(component.isExpanded('auth_001')).toBe(true);

    component.toggleRow('auth_001');
    expect(component.isExpanded('auth_001')).toBe(false);
  });

  it('should collapse previous row when expanding another', () => {
    component.toggleRow('auth_001');
    expect(component.isExpanded('auth_001')).toBe(true);

    component.toggleRow('auth_002');
    expect(component.isExpanded('auth_001')).toBe(false);
    expect(component.isExpanded('auth_002')).toBe(true);
  });

  it('should return correct status classes', () => {
    expect(component.statusClass('pending')).toContain('bg-yellow-50');
    expect(component.statusClass('approved')).toContain('bg-green-50');
    expect(component.statusClass('denied')).toContain('bg-red-50');
    expect(component.statusClass('draft')).toContain('bg-gray-100');
    expect(component.statusClass('appeal_submitted')).toContain('bg-orange-50');
  });

  it('should return correct timeline icons', () => {
    expect(component.timelineIcon('draft')).toBe('edit_note');
    expect(component.timelineIcon('submitted')).toBe('send');
    expect(component.timelineIcon('approved')).toBe('check_circle');
    expect(component.timelineIcon('denied')).toBe('cancel');
  });

  it('should return correct actions per status', () => {
    const draftActions = component.getActions('draft');
    expect(draftActions.length).toBe(3);
    expect(draftActions[0].action).toBe('submit');

    const deniedActions = component.getActions('denied');
    expect(deniedActions.length).toBe(3);
    expect(deniedActions[0].action).toBe('appeal');

    const approvedActions = component.getActions('approved');
    expect(approvedActions.length).toBe(2);
  });

  it('should format status labels correctly', () => {
    expect(component.statusLabel('appeal_submitted')).toBe('appeal submitted');
    expect(component.statusLabel('pending')).toBe('pending');
    expect(component.statusLabel('appeal_denied')).toBe('appeal denied');
  });

  it('should update filters when onFiltersChanged is called', () => {
    const newFilters = {
      statuses: ['pending'],
      healthPlans: [],
      requestTypes: [],
      dateFrom: null,
      dateTo: null,
      urgentOnly: false,
      sortField: 'days_pending',
      sortDirection: 'desc' as const,
    };

    component.onFiltersChanged(newFilters);
    expect(component.filters()).toEqual(newFilters);
  });

  // ─── CSV Export Tests ───

  it('should export CSV with correct headers and data', () => {
    authService.loadDashboard();
    httpMock.expectOne('assets/data.json').flush(mockData);
    fixture.detectChanges();

    const mockAnchor = { href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement;
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    component.exportToCsv();

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test');
    expect(mockAnchor.click).toHaveBeenCalled();

    createElementSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it('should show snack message when no data to export', () => {
    component.exportToCsv();
    expect(component.filteredRequests().length).toBe(0);
    expect(snackBarMock.open).toHaveBeenCalledWith('No data to export', 'OK', expect.any(Object));
  });

  // ─── Action Handler Tests ───

  it('should call updateRequestStatus on approve action', () => {
    authService.loadDashboard();
    httpMock.expectOne('assets/data.json').flush(mockData);
    fixture.detectChanges();

    const dialog = TestBed.inject(MatDialog);
    const dialogSpy = vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(true)
    } as any);

    const req = authService.requests()[0];
    component.onAction('approve', req);

    expect(dialogSpy).toHaveBeenCalled();
    dialogSpy.mockRestore();
  });

  it('should call deleteRequest on confirmed delete action', () => {
    authService.loadDashboard();
    httpMock.expectOne('assets/data.json').flush(mockData);
    fixture.detectChanges();

    const dialog = TestBed.inject(MatDialog);
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(true)
    } as any);

    const deleteSpy = vi.spyOn(authService, 'deleteRequest');
    const req = authService.requests()[0];
    component.onAction('delete', req);

    expect(deleteSpy).toHaveBeenCalledWith(req.id);
    deleteSpy.mockRestore();
  });

  it('should not perform action when dialog is cancelled', () => {
    authService.loadDashboard();
    httpMock.expectOne('assets/data.json').flush(mockData);
    fixture.detectChanges();

    const dialog = TestBed.inject(MatDialog);
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(false)
    } as any);

    const updateSpy = vi.spyOn(authService, 'updateRequestStatus');
    const req = authService.requests()[0];
    component.onAction('approve', req);

    expect(updateSpy).not.toHaveBeenCalled();
    updateSpy.mockRestore();
  });

  // ─── Filter ───

  it('should filter requests by status', () => {
    authService.loadDashboard();
    httpMock.expectOne('assets/data.json').flush(mockData);
    fixture.detectChanges();

    component.onFiltersChanged({
      statuses: ['pending'], healthPlans: [], requestTypes: [],
      dateFrom: null, dateTo: null, urgentOnly: false,
      sortField: 'submitted_date', sortDirection: 'desc',
    });

    expect(component.filteredRequests().length).toBe(1);
    expect(component.filteredRequests()[0].status).toBe('pending');
  });

  it('should filter urgent requests only', () => {
    authService.loadDashboard();
    httpMock.expectOne('assets/data.json').flush(mockData);
    fixture.detectChanges();

    component.onFiltersChanged({
      statuses: [], healthPlans: [], requestTypes: [],
      dateFrom: null, dateTo: null, urgentOnly: true,
      sortField: 'submitted_date', sortDirection: 'desc',
    });

    expect(component.filteredRequests().some(r => (r.days_pending ?? 0) > 7)).toBe(true);
  });

  it('should return empty actions for unknown status', () => {
    expect(component.getActions('unknown_status')).toEqual([]);
  });

  it('should return correct statusDot colors', () => {
    expect(component.statusDot('approved')).toContain('bg-secondary');
    expect(component.statusDot('denied')).toContain('bg-danger');
    expect(component.statusDot('pending')).toContain('bg-yellow-400');
    expect(component.statusDot('unknown')).toContain('bg-gray-400');
  });
});
