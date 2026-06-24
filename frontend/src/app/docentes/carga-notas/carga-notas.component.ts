import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { InscripcionesService } from '../../servicios/inscripciones.service';
import { HttpClient } from '@angular/common/http';

interface EstudianteInscripto {
  id: number;
  alumno_id: number;
  materia_id: number;
  nota: number | null;
  fecha_inscripcion: string;
  carrera: string;
  nombre: string;
  email: string;
}

@Component({
  selector: 'app-carga-notas',
  templateUrl: './carga-notas.component.html',
  styleUrls: ['./carga-notas.component.css'],
})
export class CargaNotasComponent implements OnChanges {
  @Input() materiaId: number | null = null;
  estudiantes: EstudianteInscripto[] = [];
  notaEditando: { [key: number]: number | null } = {};
  idNotaGuardando: number | null = null;
  mensajeError = '';

  constructor(
    private inscripcionesService: InscripcionesService,
    private http: HttpClient
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['materiaId'] && this.materiaId) {
      this.cargarEstudiantes(this.materiaId);
    }
  }

  cargarEstudiantes(materiaId: number): void {
    this.http.get<EstudianteInscripto[]>(`/api/inscripciones/materia/${materiaId}`).subscribe({
      next: (data) => {
        this.estudiantes = data;
        // Initialize editing grades from current values
        this.notaEditando = {};
        for (const s of data) {
          this.notaEditando[s.id] = s.nota;
        }
      },
      error: (err) => console.error('Error al cargar estudiantes inscriptos', err),
    });
  }

  guardarNota(inscripcionId: number): void {
    const nota = this.notaEditando[inscripcionId];
    if (nota === undefined || nota === null) {
      this.mensajeError = 'Ingrese una nota válida';
      return;
    }
    if (nota < 0 || nota > 100) {
      this.mensajeError = 'La nota debe estar entre 0 y 100';
      return;
    }

    this.idNotaGuardando = inscripcionId;
    this.mensajeError = '';

    this.inscripcionesService.setNota(inscripcionId, nota).subscribe({
      next: () => {
        // Update local state
        const estudiante = this.estudiantes.find((s) => s.id === inscripcionId);
        if (estudiante) {
          estudiante.nota = nota;
        }
        this.idNotaGuardando = null;
      },
      error: (err) => {
        console.error('Error al guardar nota', err);
        this.mensajeError = err.error?.error || 'Error al guardar nota';
        this.idNotaGuardando = null;
      },
    });
  }
}
