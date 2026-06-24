import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-stat-card.component.html',
  styleUrls: ['./dashboard-stat-card.component.css'],
})
export class DashboardStatCardComponent {
  @Input() icon: string = 'numbers';
  @Input() value: number | string = 0;
  @Input() label: string = '';
  @Input() variant:
    | 'lavender'
    | 'yellow'
    | 'blue'
    | 'pink'
    | 'green'
    | 'orange'
    | 'teal' = 'lavender';
  @Input() ariaLabel: string = '';
  @Input() clickable: boolean = true;
}
