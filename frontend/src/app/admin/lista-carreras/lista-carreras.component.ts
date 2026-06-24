import { Component, OnInit } from '@angular/core';
import { CarrerasService, Carrera } from '../../servicios/carreras.service';
import {
  CarreraFormModel,
  crearCarreraFormModel,
} from './modelos/carrera-admin.model';

/**
 * Container / orchestrator component for the carrera management feature.
 *
 * Responsibilities:
 * - Owns all API calls (via CarrerasService)
 * - Holds application-level state (list, form model, edit mode, messages)
 * - Delegates presentation to child components via @Input / @Output
 *
 * Child components (under ./componentes/) are stateless presentational
 * wrappers that know nothing about the service layer.
 */
@Component({
  selector: 'app-lista-carreras',
  templateUrl: './lista-carreras.component.html',
  styleUrls: ['./lista-carreras.component.css'],
})
export class ListaCarrerasComponent implements OnInit {
  // ── List state ──
  carreras: Carrera[] = [];

  // ── Form state ──
  mostrarFormulario = false;
  editandoId: number | null = null;
  modeloFormulario: CarreraFormModel = crearCarreraFormModel();

  // ── Feedback messages ──
  mensajeError = '';
  mensajeExito = '';

  constructor(private carrerasService: CarrerasService) {}

  ngOnInit(): void {
    this.cargarCarreras();
  }

  // ──────────────────────────────────────────────
  //  Data fetching
  // ──────────────────────────────────────────────

  cargarCarreras(): void {
    this.carrerasService.obtenerTodas().subscribe({
      next: (data) => (this.carreras = data),
      error: (err) => console.error('Error al cargar carreras', err),
    });
  }

  // ──────────────────────────────────────────────
  //  Form toggle / reset
  // ──────────────────────────────────────────────

  toggleForm(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.editandoId = null;
    this.mensajeError = '';
    this.mensajeExito = '';
    if (!this.mostrarFormulario) {
      this.limpiarFormulario();
    }
  }

  private limpiarFormulario(): void {
    this.modeloFormulario = crearCarreraFormModel();
  }

  // ──────────────────────────────────────────────
  //  Edit — populate form with existing data
  // ──────────────────────────────────────────────

  editarCarrera(carrera: Carrera): void {
    this.editandoId = carrera.id;
    this.modeloFormulario = {
      nombre: carrera.nombre,
      codigo: carrera.codigo,
      descripcion: carrera.descripcion || '',
      duracion_anios: carrera.duracion_anios,
    };
    this.mostrarFormulario = true;
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  // ──────────────────────────────────────────────
  //  Save — create or update
  // ──────────────────────────────────────────────

  guardar(): void {
    if (!this.modeloFormulario.nombre || !this.modeloFormulario.codigo) {
      this.mensajeError = 'Nombre y código son obligatorios';
      return;
    }

    if (this.editandoId) {
      this.carrerasService
        .actualizar(this.editandoId, this.modeloFormulario)
        .subscribe({
          next: () => {
            this.mostrarFormulario = false;
            this.editandoId = null;
            this.limpiarFormulario();
            this.mensajeError = '';
            this.mensajeExito = 'Carrera actualizada correctamente';
            this.cargarCarreras();
            setTimeout(() => (this.mensajeExito = ''), 3000);
          },
          error: (err) => {
            this.mensajeError =
              err.error?.error || 'Error al actualizar carrera';
          },
        });
    } else {
      this.carrerasService.crear(this.modeloFormulario).subscribe({
        next: () => {
          this.mostrarFormulario = false;
          this.limpiarFormulario();
          this.mensajeError = '';
          this.mensajeExito = 'Carrera creada correctamente';
          this.cargarCarreras();
          setTimeout(() => (this.mensajeExito = ''), 3000);
        },
        error: (err) => {
          this.mensajeError = err.error?.error || 'Error al crear carrera';
        },
      });
    }
  }

  // ──────────────────────────────────────────────
  //  Deactivate / Reactivate
  // ──────────────────────────────────────────────

  confirmarDesactivar(carrera: Carrera): void {
    const accion = carrera.activa ? 'desactivar' : 'reactivar';
    if (
      confirm(
        `¿${accion === 'desactivar' ? 'Desactivar' : 'Reactivar'} la carrera "${carrera.nombre}"?`
      )
    ) {
      if (carrera.activa) {
        this.carrerasService.eliminar(carrera.id).subscribe({
          next: () => {
            this.mensajeExito = 'Carrera desactivada correctamente';
            this.cargarCarreras();
            setTimeout(() => (this.mensajeExito = ''), 3000);
          },
          error: (err) => {
            this.mensajeError =
              err.error?.error || 'Error al desactivar carrera';
          },
        });
      } else {
        this.carrerasService.actualizar(carrera.id, { activa: 1 }).subscribe({
          next: () => {
            this.mensajeExito = 'Carrera reactivada correctamente';
            this.cargarCarreras();
            setTimeout(() => (this.mensajeExito = ''), 3000);
          },
          error: (err) => {
            this.mensajeError =
              err.error?.error || 'Error al reactivar carrera';
          },
        });
      }
    }
  }
}
