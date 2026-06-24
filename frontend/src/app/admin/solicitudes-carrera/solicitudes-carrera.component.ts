import { Component, OnInit } from '@angular/core';
import { InscripcionesCarreraService } from '../../servicios/inscripciones-carrera.service';
import { InscripcionCarrera } from './modelos/solicitud-carrera.model';

/**
 * Container / orchestrator component for the career-application feature.
 *
 * Responsibilities:
 * - Owns all API calls (via InscripcionesCarreraService)
 * - Holds application-level state (list, filter, selected item, messages)
 * - Delegates presentation to child components via @Input / @Output
 *
 * Child components (under ./componentes/) are stateless presentational
 * wrappers that know nothing about the service layer.
 */
@Component({
  selector: 'app-solicitudes-carrera',
  templateUrl: './solicitudes-carrera.component.html',
  styleUrls: ['./solicitudes-carrera.component.css'],
})
export class SolicitudesCarreraComponent implements OnInit {
  // ── List state ──
  solicitudes: InscripcionCarrera[] = [];
  filtroEstado = '';
  loading = true;

  // ── Modal state ──
  solicitudSeleccionada: InscripcionCarrera | null = null;

  // ── Feedback messages ──
  mensajeExito = '';
  mensajeError = '';

  constructor(
    private inscripcionCarreraService: InscripcionesCarreraService
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  // ──────────────────────────────────────────────
  //  Data fetching
  // ──────────────────────────────────────────────

  cargarSolicitudes(): void {
    this.loading = true;
    this.inscripcionCarreraService
      .obtenerTodas(this.filtroEstado || undefined)
      .subscribe({
        next: (data) => {
          this.solicitudes = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  // ──────────────────────────────────────────────
  //  Filter
  // ──────────────────────────────────────────────

  aplicarFiltro(estado: string): void {
    this.filtroEstado = estado;
    this.cargarSolicitudes();
  }

  // ──────────────────────────────────────────────
  //  Modal open / close
  // ──────────────────────────────────────────────

  abrirModal(solicitud: InscripcionCarrera): void {
    this.solicitudSeleccionada = solicitud;
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  cerrarModal(): void {
    this.solicitudSeleccionada = null;
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  // ──────────────────────────────────────────────
  //  Review (approve / reject)
  // ──────────────────────────────────────────────

  onRevisar(event: {
    accion: 'aprobada' | 'rechazada';
    motivo: string;
  }): void {
    if (!this.solicitudSeleccionada) return;

    // Validate reason when rejecting
    if (event.accion === 'rechazada' && !event.motivo.trim()) {
      this.mensajeError = 'Debes ingresar un motivo de rechazo.';
      return;
    }

    this.loading = true;
    this.mensajeError = '';

    this.inscripcionCarreraService
      .revisar(this.solicitudSeleccionada.id, event.accion, event.motivo)
      .subscribe({
        next: (res) => {
          this.mensajeExito = res.message;
          this.cargarSolicitudes();
          setTimeout(() => this.cerrarModal(), 1500);
        },
        error: (err) => {
          this.mensajeError =
            err.error?.error || 'Error al procesar la solicitud.';
          this.loading = false;
        },
      });
  }

  // ──────────────────────────────────────────────
  //  Document download
  // ──────────────────────────────────────────────

  onVerDocumento(docId: number): void {
    this.inscripcionCarreraService.descargarDocumento(docId).subscribe({
      next: (archivo) => {
        const url = URL.createObjectURL(archivo);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (err) => {
        console.error('Error al abrir documento', err);
        this.mensajeError =
          err.error?.error || 'No se pudo abrir el documento.';
      },
    });
  }
}
