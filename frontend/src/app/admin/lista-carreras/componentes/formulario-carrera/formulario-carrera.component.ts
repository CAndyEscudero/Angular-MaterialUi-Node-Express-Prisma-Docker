import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CarreraFormModel } from '../../modelos/carrera-admin.model';

/**
 * Presentational component for the carrera create/edit form.
 *
 * Receives the form model, editing state, and error via @Input.
 * Emits guardar (save) or cancelar when the user triggers those actions.
 */
@Component({
  selector: 'app-formulario-carrera',
  templateUrl: './formulario-carrera.component.html',
  styleUrls: ['./formulario-carrera.component.css'],
})
export class FormularioCarreraComponent {
  @Input() modelo!: CarreraFormModel;
  @Input() editandoId: number | null = null;
  @Input() mensajeError = '';

  @Output() guardar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
}
