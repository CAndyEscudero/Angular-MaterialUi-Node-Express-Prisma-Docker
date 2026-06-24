import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Materia } from '../../modelos/materia-admin.model';
import {
  cuatrimestreDisplay,
  estadoBadgeClass,
  estadoLabel,
} from '../../modelos/materia-admin.model';

/**
 * Presentational component for the materia list table.
 *
 * Receives the materia list via @Input and emits edit / delete events.
 * Pure formatting helpers are exposed as readonly properties for the template.
 */
@Component({
  selector: 'app-tabla-materias',
  templateUrl: './tabla-materias.component.html',
  styleUrls: ['./tabla-materias.component.css'],
})
export class TablaMateriasComponent {
  @Input() materias: Materia[] = [];
  @Output() editar = new EventEmitter<Materia>();
  @Output() eliminar = new EventEmitter<Materia>();

  // Expose pure functions to template
  readonly badgeClass = estadoBadgeClass;
  readonly label = estadoLabel;
  readonly cuatrimestre = cuatrimestreDisplay;
}
