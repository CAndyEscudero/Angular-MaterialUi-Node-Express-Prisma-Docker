import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';
import { PaginaAdminComponent } from './pagina-admin.component';
import { ListaUsuariosComponent } from './lista-usuarios/lista-usuarios.component';
import { FormularioUsuarioComponent } from './lista-usuarios/componentes/formulario-usuario/formulario-usuario.component';
import { TablaUsuariosComponent } from './lista-usuarios/componentes/tabla-usuarios/tabla-usuarios.component';
import { ListaMateriasComponent } from './lista-materias/lista-materias.component';
import { FormularioMateriaComponent } from './lista-materias/componentes/formulario-materia/formulario-materia.component';
import { TablaMateriasComponent } from './lista-materias/componentes/tabla-materias/tabla-materias.component';
import { ListaCarrerasComponent } from './lista-carreras/lista-carreras.component';
import { FormularioCarreraComponent } from './lista-carreras/componentes/formulario-carrera/formulario-carrera.component';
import { TablaCarrerasComponent } from './lista-carreras/componentes/tabla-carreras/tabla-carreras.component';
import { SolicitudesCarreraComponent } from './solicitudes-carrera/solicitudes-carrera.component';
import { FiltrosSolicitudesComponent } from './solicitudes-carrera/componentes/filtros-solicitudes/filtros-solicitudes.component';
import { TablaSolicitudesComponent } from './solicitudes-carrera/componentes/tabla-solicitudes/tabla-solicitudes.component';
import { ModalDetalleSolicitudComponent } from './solicitudes-carrera/componentes/modal-detalle-solicitud/modal-detalle-solicitud.component';
import { ListaPeriodosComponent } from './lista-periodos/lista-periodos.component';
import { FormularioPeriodoComponent } from './lista-periodos/componentes/formulario-periodo/formulario-periodo.component';
import { TablaPeriodosComponent } from './lista-periodos/componentes/tabla-periodos/tabla-periodos.component';
import { ListaAnunciosComponent } from './lista-anuncios/lista-anuncios.component';
import { FormularioAnuncioComponent } from './lista-anuncios/componentes/formulario-anuncio/formulario-anuncio.component';
import { TablaAnunciosComponent } from './lista-anuncios/componentes/tabla-anuncios/tabla-anuncios.component';
import { PanelNotificacionesComponent } from '../componentes/panel-notificaciones/panel-notificaciones.component';
import { DashboardStatCardComponent } from '../componentes/dashboard-stat-card/dashboard-stat-card.component';
import { AnunciosRecientesComponent } from '../componentes/anuncios-recientes/anuncios-recientes.component';

@NgModule({
  declarations: [PaginaAdminComponent, ListaUsuariosComponent, FormularioUsuarioComponent, TablaUsuariosComponent, ListaMateriasComponent, FormularioMateriaComponent, TablaMateriasComponent, ListaCarrerasComponent, FormularioCarreraComponent, TablaCarrerasComponent, SolicitudesCarreraComponent, FiltrosSolicitudesComponent, TablaSolicitudesComponent, ModalDetalleSolicitudComponent, ListaPeriodosComponent, FormularioPeriodoComponent, TablaPeriodosComponent, ListaAnunciosComponent, FormularioAnuncioComponent, TablaAnunciosComponent],
  imports: [CommonModule, FormsModule, AdminRoutingModule, PanelNotificacionesComponent, DashboardStatCardComponent, AnunciosRecientesComponent],
})
export class ModuloAdmin {}
