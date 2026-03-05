import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-summary-card',
  imports: [NgClass, MatIconModule],
  templateUrl: './summary-cards.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryCardComponent {
  readonly title = input('');
  readonly value = input(0);
  readonly colorClass = input('');
  readonly isUrgent = input(false);
  readonly icon = input('');
  readonly loading = input(false);
}
