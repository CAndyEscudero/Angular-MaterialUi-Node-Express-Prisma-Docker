import { Component, Input, Output, EventEmitter } from '@angular/core';
import { UsuarioFormModel } from '../../modelos/usuario-admin.model';

/**
 * Presentational component for the user create form.
 *
 * Receives the form model and error state via @Input.
 * Emits guardar (save) when the user triggers that action.
 */
@Component({
  selector: 'app-formulario-usuario',
  templateUrl: './formulario-usuario.component.html',
  styleUrls: ['./formulario-usuario.component.css'],
})
export class FormularioUsuarioComponent {
  @Input() modelo!: UsuarioFormModel;
  @Input() mensajeError = '';

  @Output() guardar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
}
