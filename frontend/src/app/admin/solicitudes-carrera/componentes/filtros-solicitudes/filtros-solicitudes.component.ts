import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-filtros-solicitudes',
  templateUrl: './filtros-solicitudes.component.html',
  styleUrls: ['./filtros-solicitudes.component.css'],
})
export class FiltrosSolicitudesComponent {
  @Input() filtroActivo = '';
  @Output() filtroCambiado = new EventEmitter<string>();
}
