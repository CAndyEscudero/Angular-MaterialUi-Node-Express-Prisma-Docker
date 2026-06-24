import { Component, OnInit } from '@angular/core';
import { PeriodosInscripcionService } from '../../servicios/periodos-inscripcion.service';
import { PeriodoAdmin, desdeApi } from './modelos/periodo-admin.model';

/**
 * Container / orchestrator component for the enrollment period management feature.
 *
 * Responsibilities:
 * - Owns all API calls (via PeriodosInscripcionService)
 * - Holds application-level state (list, form state, messages)
 * - Delegates presentation to child components via @Input / @Output
 */
@Component({
  selector: 'app-lista-periodos',
  templateUrl: './lista-periodos.component.html',
  styleUrls: ['./lista-periodos.component.css'],
})
export class ListaPeriodosComponent implements OnInit {
  // ── List state ──
  periodos: PeriodoAdmin[] = [];

  // ── Form state ──
  mostrarFormulario = false;
  editandoId: number | null = null;
  periodoEditando: PeriodoAdmin | null = null;

  // ── Feedback messages ──
  mensajeError = '';
  mensajeExito = '';

  constructor(private periodosService: PeriodosInscripcionService) {}

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  // ──────────────────────────────────────────────
  //  Data fetching
  // ──────────────────────────────────────────────

  cargarPeriodos(): void {
    this.periodosService.obtenerTodos().subscribe({
      next: (data) => {
        this.periodos = data.map(desdeApi);
      },
      error: (err) => console.error('Error al cargar períodos', err),
    });
  }

  // ──────────────────────────────────────────────
  //  Form toggle / reset
  // ──────────────────────────────────────────────

  toggleForm(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.editandoId = null;
    this.periodoEditando = null;
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  private limpiarFormulario(): void {
    this.periodoEditando = null;
  }

  // ──────────────────────────────────────────────
  //  Edit — populate form with existing data
  // ──────────────────────────────────────────────

  editarPeriodo(periodo: PeriodoAdmin): void {
    this.editandoId = periodo.id;
    this.periodoEditando = { ...periodo };
    this.mostrarFormulario = true;
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  // ──────────────────────────────────────────────
  //  Save — create or update
  // ──────────────────────────────────────────────

  guardar(periodo: PeriodoAdmin): void {
    if (!periodo.nombre || !periodo.fecha_inicio || !periodo.fecha_fin) {
      this.mensajeError = 'Nombre, fecha de inicio y fecha de fin son obligatorios';
      return;
    }

    const data = {
      nombre: periodo.nombre,
      fecha_inicio: periodo.fecha_inicio,
      fecha_fin: periodo.fecha_fin,
      activo: periodo.activo ? 1 : 0,
      carrera_id: periodo.carrera_id || null,
      anio_academico: periodo.anio_academico || null,
      cuatrimestre: periodo.cuatrimestre || null,
    };

    if (this.editandoId) {
      this.periodosService.actualizar(this.editandoId, data).subscribe({
        next: () => {
          this.mostrarFormulario = false;
          this.editandoId = null;
          this.limpiarFormulario();
          this.mensajeExito = 'Período actualizado correctamente';
          this.cargarPeriodos();
          setTimeout(() => (this.mensajeExito = ''), 3000);
        },
        error: (err) => {
          this.mensajeError = err.error?.error || 'Error al actualizar período';
        },
      });
    } else {
      this.periodosService.crear(data).subscribe({
        next: () => {
          this.mostrarFormulario = false;
          this.limpiarFormulario();
          this.mensajeExito = 'Período creado correctamente';
          this.cargarPeriodos();
          setTimeout(() => (this.mensajeExito = ''), 3000);
        },
        error: (err) => {
          this.mensajeError = err.error?.error || 'Error al crear período';
        },
      });
    }
  }

  // ──────────────────────────────────────────────
  //  Delete
  // ──────────────────────────────────────────────

  confirmarEliminar(periodo: PeriodoAdmin): void {
    if (confirm(`¿Eliminar el período "${periodo.nombre}"?`)) {
      this.periodosService.eliminar(periodo.id).subscribe({
        next: () => {
          this.mensajeExito = 'Período eliminado correctamente';
          this.cargarPeriodos();
          setTimeout(() => (this.mensajeExito = ''), 3000);
        },
        error: (err) => console.error('Error al eliminar período', err),
      });
    }
  }

  // ──────────────────────────────────────────────
  //  Toggle active state
  // ──────────────────────────────────────────────

  toggleActivo(periodo: PeriodoAdmin): void {
    const nuevoEstado = periodo.activo ? 0 : 1;
    this.periodosService.actualizar(periodo.id, { activo: nuevoEstado }).subscribe({
      next: () => {
        periodo.activo = !periodo.activo;
        this.mensajeExito = periodo.activo ? 'Período activado' : 'Período desactivado';
        setTimeout(() => (this.mensajeExito = ''), 3000);
      },
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al cambiar estado';
      },
    });
  }
}
