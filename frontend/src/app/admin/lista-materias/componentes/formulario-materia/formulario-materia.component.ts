import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  MateriaFormModel,
  ProfesorItem,
  Carrera,
} from '../../modelos/materia-admin.model';

/**
 * Presentational component for the materia create/edit form.
 *
 * Receives the form model, dropdown data, and error state via @Input.
 * Emits guardar (save) or cancelar when the user triggers those actions.
 * Uses [(ngModel)] directly on the @Input() modelo object — the owning
 * container mutates this reference on edit transitions.
 */
@Component({
  selector: 'app-formulario-materia',
  templateUrl: './formulario-materia.component.html',
  styleUrls: ['./formulario-materia.component.css'],
})
export class FormularioMateriaComponent {
  @Input() modelo!: MateriaFormModel;
  @Input() editandoId: number | null = null;
  @Input() profesores: ProfesorItem[] = [];
  @Input() carreras: Carrera[] = [];
  @Input() cargandoProfesores = false;
  @Input() mensajeError = '';

  @Output() guardar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
}
