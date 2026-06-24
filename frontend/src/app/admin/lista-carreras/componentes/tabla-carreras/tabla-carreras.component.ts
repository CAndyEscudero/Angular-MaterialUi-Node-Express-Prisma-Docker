import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Carrera } from '../../modelos/carrera-admin.model';
import {
  estadoBadgeClass,
  estadoLabel,
} from '../../modelos/carrera-admin.model';

/**
 * Presentational component for the carrera list table.
 *
 * Receives the carrera list via @Input and emits edit / toggle-active events.
 * Pure formatting helpers are exposed as readonly properties for the template.
 */
@Component({
  selector: 'app-tabla-carreras',
  templateUrl: './tabla-carreras.component.html',
  styleUrls: ['./tabla-carreras.component.css'],
})
export class TablaCarrerasComponent {
  @Input() carreras: Carrera[] = [];
  @Output() editar = new EventEmitter<Carrera>();
  @Output() alternarEstado = new EventEmitter<Carrera>();

  // Expose pure functions to template
  readonly badgeClass = estadoBadgeClass;
  readonly label = estadoLabel;
}
