import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MateriasService, Materia } from '../../servicios/materias.service';
import { CarrerasService, Carrera } from '../../servicios/carreras.service';
import {
  MateriaFormModel,
  ProfesorItem,
  crearMateriaFormModel,
} from './modelos/materia-admin.model';

/**
 * Container / orchestrator component for the materia management feature.
 *
 * Responsibilities:
 * - Owns all API calls (via MateriasService / CarrerasService / HttpClient)
 * - Holds application-level state (list, form model, edit mode, messages)
 * - Delegates presentation to child components via @Input / @Output
 *
 * Child components (under ./componentes/) are stateless presentational
 * wrappers that know nothing about the service layer.
 */
@Component({
  selector: 'app-lista-materias',
  templateUrl: './lista-materias.component.html',
  styleUrls: ['./lista-materias.component.css'],
})
export class ListaMateriasComponent implements OnInit {
  // ── List state ──
  materias: Materia[] = [];

  // ── Form state ──
  mostrarFormulario = false;
  editandoId: number | null = null;
  modeloFormulario: MateriaFormModel = crearMateriaFormModel();

  // ── Dropdown data ──
  profesores: ProfesorItem[] = [];
  carreras: Carrera[] = [];
  cargandoProfesores = false;

  // ── Feedback messages ──
  mensajeError = '';
  mensajeExito = '';

  constructor(
    private materiasService: MateriasService,
    private carrerasService: CarrerasService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.cargarMaterias();
    this.cargarProfesores();
    this.cargarCarreras();
  }

  // ──────────────────────────────────────────────
  //  Data fetching
  // ──────────────────────────────────────────────

  cargarMaterias(): void {
    this.materiasService.obtenerTodas().subscribe({
      next: (data) => (this.materias = data),
      error: (err) => console.error('Error al cargar materias', err),
    });
  }

  cargarProfesores(): void {
    this.cargandoProfesores = true;
    this.http.get<ProfesorItem[]>('/api/profesores').subscribe({
      next: (data) => {
        this.profesores = data;
        this.cargandoProfesores = false;
      },
      error: (err) => {
        console.error('Error al cargar profesores', err);
        this.cargandoProfesores = false;
      },
    });
  }

  cargarCarreras(): void {
    this.carrerasService.obtenerTodas().subscribe({
      next: (data) => (this.carreras = data.filter((c) => c.activa)),
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
      this.modeloFormulario = crearMateriaFormModel();
    }
  }

  private limpiarFormulario(): void {
    this.modeloFormulario = crearMateriaFormModel();
  }

  // ──────────────────────────────────────────────
  //  Edit — populate form with existing data
  // ──────────────────────────────────────────────

  editarMateria(materia: Materia): void {
    this.editandoId = materia.id;
    this.modeloFormulario = {
      nombre: materia.nombre,
      codigo: materia.codigo,
      profesor_id: materia.profesor_id,
      descripcion: materia.descripcion || '',
      cuatrimestre: materia.cuatrimestre || '',
      anio: materia.anio || new Date().getFullYear(),
      carrera: materia.carrera || '',
      carrera_id: materia.carrera_id || 0,
      dia_horario: materia.dia_horario || '',
      cupo_maximo: materia.cupo_maximo || 0,
      aula: materia.aula || '',
      modalidad: materia.modalidad || 'presencial',
      estado: materia.estado || 'activa',
      creditos: materia.creditos || 0,
      anio_carrera: materia.anio_carrera || 0,
    };
    this.mostrarFormulario = true;
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  // ──────────────────────────────────────────────
  //  Save — create or update
  // ──────────────────────────────────────────────

  guardar(): void {
    if (
      !this.modeloFormulario.nombre ||
      !this.modeloFormulario.codigo ||
      !this.modeloFormulario.profesor_id
    ) {
      this.mensajeError = 'Nombre, código y profesor son obligatorios';
      return;
    }

    const data = { ...this.modeloFormulario };
    // Limpiar valores opcionales
    if (!data.carrera_id) delete (data as any).carrera_id;

    if (this.editandoId) {
      this.materiasService.actualizar(this.editandoId, data).subscribe({
        next: () => {
          this.mostrarFormulario = false;
          this.editandoId = null;
          this.limpiarFormulario();
          this.mensajeExito = 'Materia actualizada correctamente';
          this.cargarMaterias();
          setTimeout(() => (this.mensajeExito = ''), 3000);
        },
        error: (err) => {
          this.mensajeError =
            err.error?.error || 'Error al actualizar materia';
        },
      });
    } else {
      this.materiasService.crear(data).subscribe({
        next: () => {
          this.mostrarFormulario = false;
          this.limpiarFormulario();
          this.mensajeExito = 'Materia creada correctamente';
          this.cargarMaterias();
          setTimeout(() => (this.mensajeExito = ''), 3000);
        },
        error: (err) => {
          this.mensajeError = err.error?.error || 'Error al crear materia';
        },
      });
    }
  }

  // ──────────────────────────────────────────────
  //  Delete
  // ──────────────────────────────────────────────

  confirmarEliminar(materia: Materia): void {
    if (
      confirm(
        `¿Eliminar materia "${materia.nombre}"? También se eliminarán las inscripciones asociadas.`
      )
    ) {
      this.materiasService.eliminar(materia.id).subscribe({
        next: () => {
          this.mensajeExito = 'Materia eliminada correctamente';
          this.cargarMaterias();
          setTimeout(() => (this.mensajeExito = ''), 3000);
        },
        error: (err) => console.error('Error al eliminar materia', err),
      });
    }
  }
}
