import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Anuncio } from '../../modelos/anuncio-admin.model';
import { estadoLabel, estadoBadgeClass, rolDestinoLabel } from '../../modelos/anuncio-admin.model';

@Component({
  selector: 'app-tabla-anuncios',
  templateUrl: './tabla-anuncios.component.html',
  styleUrls: ['./tabla-anuncios.component.css'],
})
export class TablaAnunciosComponent {
  @Input() anuncios: Anuncio[] = [];
  @Output() editar = new EventEmitter<Anuncio>();
  @Output() publicar = new EventEmitter<Anuncio>();
  @Output() archivar = new EventEmitter<Anuncio>();
  @Output() eliminar = new EventEmitter<Anuncio>();

  estadoLabel = estadoLabel;
  estadoBadgeClass = estadoBadgeClass;
  rolDestinoLabel = rolDestinoLabel;
}
