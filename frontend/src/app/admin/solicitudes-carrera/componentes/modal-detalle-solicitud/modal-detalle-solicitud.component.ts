import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  InscripcionCarrera,
  estadoBadgeClass,
  estadoLabel,
  formatearBytes,
} from '../../modelos/solicitud-carrera.model';

@Component({
  selector: 'app-modal-detalle-solicitud',
  templateUrl: './modal-detalle-solicitud.component.html',
  styleUrls: ['./modal-detalle-solicitud.component.css'],
})
export class ModalDetalleSolicitudComponent {
  @Input() solicitud: InscripcionCarrera | null = null;
  @Input() loading = false;

  @Output() cerrar = new EventEmitter<void>();
  @Output() verDocumento = new EventEmitter<number>();
  @Output() revisar = new EventEmitter<{
    accion: 'aprobada' | 'rechazada';
    motivo: string;
  }>();

  // Internal review-flow state
  accionRevisar: 'aprobada' | 'rechazada' | null = null;
  motivoRechazo = '';

  // Expose pure functions to template
  readonly badgeClass = estadoBadgeClass;
  readonly label = estadoLabel;
  readonly formatoBytes = formatearBytes;

  // ── Review flow ──

  confirmarAprobacion(): void {
    this.accionRevisar = 'aprobada';
  }

  confirmarRechazo(): void {
    this.accionRevisar = 'rechazada';
  }

  cancelarRevision(): void {
    this.accionRevisar = null;
    this.motivoRechazo = '';
  }

  ejecutarRevision(): void {
    if (!this.solicitud || !this.accionRevisar) return;
    this.revisar.emit({
      accion: this.accionRevisar,
      motivo: this.motivoRechazo.trim(),
    });
    // Note: parent handles validation; modal stays in current state
    // until parent closes it via (cerrar) or the user cancels.
  }

  // ── Close ──

  onCerrar(): void {
    this.accionRevisar = null;
    this.motivoRechazo = '';
    this.cerrar.emit();
  }
}
