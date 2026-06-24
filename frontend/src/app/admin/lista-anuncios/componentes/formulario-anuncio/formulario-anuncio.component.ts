import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { AnuncioFormModel, crearAnuncioFormModel } from '../../modelos/anuncio-admin.model';

@Component({
  selector: 'app-formulario-anuncio',
  templateUrl: './formulario-anuncio.component.html',
  styleUrls: ['./formulario-anuncio.component.css'],
})
export class FormularioAnuncioComponent implements OnChanges {
  @Input() modelo: AnuncioFormModel = crearAnuncioFormModel();
  @Input() editandoId: number | null = null;
  @Output() guardar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  get editando(): boolean {
    return this.editandoId !== null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modelo']) {
      // Reset form when model changes
    }
  }
}
