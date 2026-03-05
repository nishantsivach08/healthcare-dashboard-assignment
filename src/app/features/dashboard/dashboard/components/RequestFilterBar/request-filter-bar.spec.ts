import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RequestFilterBarComponent } from './request-filter-bar';

describe('RequestFilterBarComponent', () => {
  let component: RequestFilterBarComponent;
  let fixture: ComponentFixture<RequestFilterBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestFilterBarComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestFilterBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default sort', () => {
    expect(component.sortValue()).toBe('submitted_date|desc');
  });

  it('should have zero active filters initially', () => {
    expect(component.activeFilterCount()).toBe(0);
  });

  it('should emit filters on sort change', () => {
    const spy = vi.fn();
    component.filtersChanged.subscribe(spy);

    component.onSortChange('patient.name|asc');

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        sortField: 'patient.name',
        sortDirection: 'asc',
      })
    );
  });

  it('should clear all filters', () => {
    component.selectedStatuses.set(['pending']);
    component.urgentOnly.set(true);
    expect(component.activeFilterCount()).toBe(2);

    component.clearAll();

    expect(component.activeFilterCount()).toBe(0);
    expect(component.selectedStatuses()).toEqual([]);
    expect(component.urgentOnly()).toBe(false);
  });

  it('should count date range as one active filter', () => {
    component.dateFrom.set(new Date('2026-01-01'));
    expect(component.activeFilterCount()).toBe(1);

    component.dateTo.set(new Date('2026-02-01'));
    // dateFrom + dateTo still counts as 1
    expect(component.activeFilterCount()).toBe(1);
  });

  it('should count each filter type independently', () => {
    component.selectedStatuses.set(['pending']);
    component.selectedHealthPlans.set(['Plan A']);
    component.selectedRequestTypes.set(['Additional Prenatal']);
    component.urgentOnly.set(true);
    component.dateFrom.set(new Date());

    expect(component.activeFilterCount()).toBe(5);
  });

  it('should emit correct filter state structure', () => {
    const spy = vi.fn();
    component.filtersChanged.subscribe(spy);

    component.selectedStatuses.set(['pending', 'approved']);
    component.urgentOnly.set(true);
    component.emit();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        statuses: ['pending', 'approved'],
        urgentOnly: true,
        sortField: 'submitted_date',
        sortDirection: 'desc',
      })
    );
  });

  it('should reset sort to default on clearAll', () => {
    component.onSortChange('patient.name|asc');
    expect(component.sortValue()).toBe('patient.name|asc');

    component.clearAll();
    expect(component.sortValue()).toBe('submitted_date|desc');
  });
});
