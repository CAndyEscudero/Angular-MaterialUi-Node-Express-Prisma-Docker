import { Component, OnInit } from '@angular/core';
import { MateriasService, Materia } from '../../servicios/materias.service';
import { InscripcionesService, PeriodoStatus } from '../../servicios/inscripciones.service';
import { ServicioAutenticacion } from '../../autenticacion/autenticacion.service';

@Component({
  selector: 'app-materias-disponibles',
  templateUrl: './materias-disponibles.component.html',
  styleUrls: ['./materias-disponibles.component.css'],
})
export class MateriasDisponiblesComponent implements OnInit {
  todasMaterias: Materia[] = [];
  materiasInscriptasId: Set<number> = new Set();
  idInscribiendo: number | null = null;
  mensajeExito = '';
  mensajeError = '';
  periodoStatus: PeriodoStatus | null = null;

  constructor(
    private materiasService: MateriasService,
    private inscripcionesService: InscripcionesService,
    private servicioAutenticacion: ServicioAutenticacion
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    // Check enrollment period status first
    this.inscripcionesService.obtenerPeriodoActual().subscribe({
      next: (status) => {
        this.periodoStatus = status;
      },
      error: (err) => console.error('Error al consultar período de inscripción', err),
    });

    // Load all subjects
    this.materiasService.obtenerTodas().subscribe({
      next: (data) => {
        this.todasMaterias = data;
      },
      error: (err) => console.error('Error al cargar materias', err),
    });

    // Load my enrollments using the authenticated user token.
    this.inscripcionesService.obtenerMias().subscribe({
      next: (inscripciones) => {
        this.materiasInscriptasId = new Set(inscripciones.map((i) => i.materia_id));
      },
      error: (err) => console.error('Error al cargar inscripciones', err),
    });
  }

  get materiasDisponibles(): Materia[] {
    return this.todasMaterias.filter((m) => !this.materiasInscriptasId.has(m.id));
  }

  get periodoAbierto(): boolean {
    return this.periodoStatus?.abierto ?? false;
  }

  get periodoNombre(): string {
    return this.periodoStatus?.periodo?.nombre ?? '';
  }

  get periodoFechas(): string {
    if (!this.periodoStatus?.periodo) return '';
    const inicio = this.periodoStatus.periodo.fecha_inicio;
    const fin = this.periodoStatus.periodo.fecha_fin;
    return `${inicio} al ${fin}`;
  }

  getBotonTexto(mat: Materia): string {
    if (this.idInscribiendo === mat.id) {
      return 'Inscribiendo...';
    }
    if (mat.cupos_disponibles !== null && mat.cupos_disponibles !== undefined && mat.cupos_disponibles <= 0) {
      return 'Sin cupo';
    }
    return 'Inscribirse';
  }

  inscribir(materiaId: number): void {
    this.idInscribiendo = materiaId;
    this.mensajeExito = '';
    this.mensajeError = '';

    this.inscripcionesService.crear(materiaId).subscribe({
      next: () => {
        this.materiasInscriptasId.add(materiaId);
        this.idInscribiendo = null;
        this.mensajeExito = '¡Inscripción exitosa!';
        setTimeout(() => (this.mensajeExito = ''), 3000);
      },
      error: (err) => {
        this.idInscribiendo = null;
        console.error('Error al inscribir', err);
        this.mensajeError = err.error?.error || 'Error al inscribirse';
        setTimeout(() => (this.mensajeError = ''), 3000);
      },
    });
  }
}
