import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PeriodoAdmin, cuatrimestreLabel, estadoBadgeClass, estadoLabel } from '../../modelos/periodo-admin.model';

/**
 * Presentational component for the enrollment period list table.
 *
 * Receives the periodos list via @Input and emits edit / delete / toggle events.
 * Pure formatting helpers are exposed as readonly properties for the template.
 */
@Component({
  selector: 'app-tabla-periodos',
  templateUrl: './tabla-periodos.component.html',
  styleUrls: ['./tabla-periodos.component.css'],
})
export class TablaPeriodosComponent {
  @Input() periodos: PeriodoAdmin[] = [];
  @Output() editar = new EventEmitter<PeriodoAdmin>();
  @Output() eliminar = new EventEmitter<PeriodoAdmin>();
  @Output() toggleActivo = new EventEmitter<PeriodoAdmin>();

  // Expose pure functions to template
  readonly badgeClass = estadoBadgeClass;
  readonly label = estadoLabel;
  readonly cuatrimestre = cuatrimestreLabel;
}
