import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Usuario } from '../../modelos/usuario-admin.model';
import { rolLabel, rolBadgeClass } from '../../modelos/usuario-admin.model';

/**
 * Presentational component for the user list table.
 *
 * Receives the user list via @Input and emits delete events.
 * Pure formatting helpers are exposed as readonly properties for the template.
 */
@Component({
  selector: 'app-tabla-usuarios',
  templateUrl: './tabla-usuarios.component.html',
  styleUrls: ['./tabla-usuarios.component.css'],
})
export class TablaUsuariosComponent {
  @Input() usuarios: Usuario[] = [];
  @Output() eliminar = new EventEmitter<Usuario>();

  // Expose pure functions to template
  readonly labelRol = rolLabel;
  readonly badgeClass = rolBadgeClass;
}
