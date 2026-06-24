import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { PeriodoAdmin } from '../../modelos/periodo-admin.model';

/**
 * Presentational component for the enrollment period create/edit form.
 *
 * Receives the periodo data and edit state via @Input.
 * Emits guardar (save) with the full PeriodoAdmin object or cancelar.
 * Uses local ngModel bindings and emits up on submit.
 */
@Component({
  selector: 'app-formulario-periodo',
  templateUrl: './formulario-periodo.component.html',
  styleUrls: ['./formulario-periodo.component.css'],
})
export class FormularioPeriodoComponent implements OnInit {
  @Input() periodo: PeriodoAdmin | null = null;
  @Input() editandoId: number | null = null;
  @Input() mensajeError = '';

  @Output() guardar = new EventEmitter<PeriodoAdmin>();
  @Output() cancelar = new EventEmitter<void>();

  // Local form model
  nombre = '';
  fechaInicio = '';
  fechaFin = '';
  activo = true;
  anioAcademico: number | null = null;
  cuatrimestre: number | null = null;

  ngOnInit(): void {
    if (this.periodo) {
      this.nombre = this.periodo.nombre;
      this.fechaInicio = this.periodo.fecha_inicio;
      this.fechaFin = this.periodo.fecha_fin;
      this.activo = this.periodo.activo;
      this.anioAcademico = this.periodo.anio_academico;
      this.cuatrimestre = this.periodo.cuatrimestre;
    } else {
      this.anioAcademico = new Date().getFullYear();
    }
  }

  onSubmit(): void {
    this.guardar.emit({
      id: this.editandoId || 0,
      nombre: this.nombre,
      fecha_inicio: this.fechaInicio,
      fecha_fin: this.fechaFin,
      activo: this.activo,
      anio_academico: this.anioAcademico,
      cuatrimestre: this.cuatrimestre,
      carrera_id: null,
    });
  }
}
