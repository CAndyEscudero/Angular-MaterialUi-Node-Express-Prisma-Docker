import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificacionesService, Notificacion } from '../../servicios/notificaciones.service';

@Component({
  selector: 'app-panel-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './panel-notificaciones.component.html',
  styleUrls: ['./panel-notificaciones.component.css'],
})
export class PanelNotificacionesComponent implements OnInit, OnDestroy {
  @Output() notificacionSeleccionada = new EventEmitter<Notificacion>();

  notificaciones: Notificacion[] = [];
  total = 0;
  noLeidas = 0;
  cargando = false;
  error = false;
  private destroy$ = new Subject<void>();

  constructor(private notificacionesService: NotificacionesService) {}

  ngOnInit(): void {
    this.cargar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    this.cargando = true;
    this.error = false;
    this.notificacionesService.listar(1, 50).subscribe({
      next: (res) => {
        this.notificaciones = res.notificaciones;
        this.total = res.total;
        this.noLeidas = res.noLeidas;
        this.cargando = false;
        // Detectar y reportar inconsistencia: badge > 0 pero lista vacía
        if (res.noLeidas > 0 && res.notificaciones.length === 0) {
          console.warn(
            `[Notificaciones] Inconsistencia: noLeidas=${res.noLeidas} sin notificaciones en listado`
          );
        }
      },
      error: (err) => {
        console.error('[Notificaciones] Error al cargar lista', err);
        this.cargando = false;
        this.error = true;
      },
    });
  }

  marcarLeida(notif: Notificacion): void {
    if (!notif.leida) {
      this.notificacionesService.marcarLeida(notif.id).subscribe({
        next: () => {
          notif.leida = true;
          this.noLeidas = Math.max(0, this.noLeidas - 1);
        },
        error: (err) => {
          console.error('[Notificaciones] Error al marcar notificación como leída', err);
        },
      });
    }
    // Emitir la notificación seleccionada para navegación
    this.notificacionSeleccionada.emit(notif);
  }

  marcarTodasLeidas(): void {
    this.notificacionesService.marcarTodasLeidas().subscribe({
      next: () => {
        this.notificaciones.forEach((n) => (n.leida = true));
        this.noLeidas = 0;
      },
      error: (err) => {
        console.error('[Notificaciones] Error al marcar todas como leídas', err);
      },
    });
  }

  getTipoIcon(tipo: string): string {
    switch (tipo) {
      case 'carrera': return 'how_to_reg';
      case 'nota': return 'star';
      case 'examen': return 'quiz';
      case 'inscripcion': return 'assignment';
      case 'anuncio': return 'campaign';
      default: return 'notifications';
    }
  }

  formatearFecha(fecha: string): string {
    const ahora = new Date();
    const fechaDate = new Date(fecha);
    const diffMs = ahora.getTime() - fechaDate.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHoras < 24) return `Hace ${diffHoras}h`;
    if (diffDias < 7) return `Hace ${diffDias}d`;
    return fechaDate.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
