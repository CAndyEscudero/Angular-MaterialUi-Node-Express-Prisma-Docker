import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { MateriasService, Materia } from '../../servicios/materias.service';
import { ServicioAutenticacion } from '../../autenticacion/autenticacion.service';

@Component({
  selector: 'app-materias-asignadas',
  templateUrl: './materias-asignadas.component.html',
  styleUrls: ['./materias-asignadas.component.css'],
})
export class MateriasAsignadasComponent implements OnInit {
  materias: Materia[] = [];
  materiaSeleccionadaId: number | null = null;
  @Output() materiaSeleccionada = new EventEmitter<number>();

  constructor(
    private materiasService: MateriasService,
    private servicioAutenticacion: ServicioAutenticacion
  ) {}

  ngOnInit(): void {
    this.cargarMaterias();
  }

  cargarMaterias(): void {
    const profesorId = this.servicioAutenticacion.obtenerUsuarioId();
    if (profesorId) {
      this.materiasService.obtenerTodas(profesorId).subscribe({
        next: (data) => (this.materias = data),
        error: (err) => console.error('Error al cargar materias asignadas', err),
      });
    }
  }

  seleccionarMateria(materiaId: number): void {
    this.materiaSeleccionadaId = materiaId;
    this.materiaSeleccionada.emit(materiaId);
  }
}
