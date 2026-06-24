import { Component, OnInit } from '@angular/core';
import { InscripcionesService, Inscripcion } from '../../servicios/inscripciones.service';

@Component({
  selector: 'app-mis-inscripciones',
  templateUrl: './mis-inscripciones.component.html',
  styleUrls: ['./mis-inscripciones.component.css'],
})
export class MisInscripcionesComponent implements OnInit {
  inscripciones: Inscripcion[] = [];
  idCancelando: number | null = null;

  constructor(
    private inscripcionesService: InscripcionesService
  ) {}

  ngOnInit(): void {
    this.cargarInscripciones();
  }

  cargarInscripciones(): void {
    this.inscripcionesService.obtenerMias().subscribe({
      next: (data) => (this.inscripciones = data),
      error: (err) => console.error('Error al cargar inscripciones', err),
    });
  }

  confirmarCancelar(inscripcion: Inscripcion): void {
    if (confirm(`¿Cancelar inscripción en "${inscripcion.materia_nombre}"?`)) {
      this.cancelarInscripcion(inscripcion.id);
    }
  }

  cancelarInscripcion(id: number): void {
    this.idCancelando = id;
    this.inscripcionesService.eliminar(id).subscribe({
      next: () => {
        this.inscripciones = this.inscripciones.filter((e) => e.id !== id);
        this.idCancelando = null;
      },
      error: (err) => {
        console.error('Error al cancelar inscripción', err);
        this.idCancelando = null;
      },
    });
  }
}
