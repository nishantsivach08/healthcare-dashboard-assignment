import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SummaryCardComponent } from './summary-cards';

describe('SummaryCardComponent', () => {
  let component: SummaryCardComponent;
  let fixture: ComponentFixture<SummaryCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.title()).toBe('');
    expect(component.value()).toBe(0);
    expect(component.isUrgent()).toBe(false);
    expect(component.loading()).toBe(false);
  });

  it('should render skeleton when loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const skeleton = fixture.nativeElement.querySelector('.animate-pulse');
    expect(skeleton).toBeTruthy();
  });

  it('should render card content when not loading', () => {
    fixture.componentRef.setInput('title', 'Pending');
    fixture.componentRef.setInput('value', 5);
    fixture.componentRef.setInput('icon', 'pending_actions');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Pending');
    expect(el.textContent).toContain('5');
  });

  it('should show urgent message when urgent and value > 0', () => {
    fixture.componentRef.setInput('isUrgent', true);
    fixture.componentRef.setInput('value', 3);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Attention needed!');
  });

  it('should not show urgent message when value is 0', () => {
    fixture.componentRef.setInput('isUrgent', true);
    fixture.componentRef.setInput('value', 0);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Attention needed!');
  });
});
