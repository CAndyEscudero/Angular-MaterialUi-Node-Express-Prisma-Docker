import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstudiantesRoutingModule } from './estudiantes-routing.module';
import { EstudiantesComponent } from './pagina-estudiantes.component';
import { MateriasDisponiblesComponent } from './materias-disponibles/materias-disponibles.component';
import { MisInscripcionesComponent } from './mis-inscripciones/mis-inscripciones.component';
import { InscripcionCarreraComponent } from './inscripcion-carrera/inscripcion-carrera.component';
import { PanelNotificacionesComponent } from '../componentes/panel-notificaciones/panel-notificaciones.component';
import { DashboardStatCardComponent } from '../componentes/dashboard-stat-card/dashboard-stat-card.component';
import { AnunciosRecientesComponent } from '../componentes/anuncios-recientes/anuncios-recientes.component';
import { ListaAnunciosPublicosComponent } from '../componentes/lista-anuncios-publicos/lista-anuncios-publicos.component';

@NgModule({
  declarations: [EstudiantesComponent, MateriasDisponiblesComponent, MisInscripcionesComponent, InscripcionCarreraComponent],
  imports: [CommonModule, FormsModule, EstudiantesRoutingModule, PanelNotificacionesComponent, DashboardStatCardComponent, AnunciosRecientesComponent, ListaAnunciosPublicosComponent],
})
export class ModuloEstudiantes {}
