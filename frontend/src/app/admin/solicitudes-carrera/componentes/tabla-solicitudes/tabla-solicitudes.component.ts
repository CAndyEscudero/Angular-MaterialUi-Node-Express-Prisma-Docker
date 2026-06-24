import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  InscripcionCarrera,
  estadoBadgeClass,
  estadoLabel,
} from '../../modelos/solicitud-carrera.model';

@Component({
  selector: 'app-tabla-solicitudes',
  templateUrl: './tabla-solicitudes.component.html',
  styleUrls: ['./tabla-solicitudes.component.css'],
})
export class TablaSolicitudesComponent {
  @Input() solicitudes: InscripcionCarrera[] = [];
  @Input() loading = false;
  @Input() filtroActivo = '';
  @Output() seleccionar = new EventEmitter<InscripcionCarrera>();

  // Expose pure functions to template
  readonly badgeClass = estadoBadgeClass;
  readonly label = estadoLabel;
}
