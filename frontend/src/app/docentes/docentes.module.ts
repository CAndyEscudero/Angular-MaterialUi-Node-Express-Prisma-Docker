import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocentesRoutingModule } from './docentes-routing.module';
import { DocentesComponent } from './pagina-docentes.component';
import { MateriasAsignadasComponent } from './materias-asignadas/materias-asignadas.component';
import { CargaNotasComponent } from './carga-notas/carga-notas.component';
import { PanelNotificacionesComponent } from '../componentes/panel-notificaciones/panel-notificaciones.component';
import { DashboardStatCardComponent } from '../componentes/dashboard-stat-card/dashboard-stat-card.component';
import { AnunciosRecientesComponent } from '../componentes/anuncios-recientes/anuncios-recientes.component';
import { ListaAnunciosPublicosComponent } from '../componentes/lista-anuncios-publicos/lista-anuncios-publicos.component';

@NgModule({
  declarations: [DocentesComponent, MateriasAsignadasComponent, CargaNotasComponent],
  imports: [CommonModule, FormsModule, DocentesRoutingModule, PanelNotificacionesComponent, DashboardStatCardComponent, AnunciosRecientesComponent, ListaAnunciosPublicosComponent],
})
export class ModuloDocentes {}
