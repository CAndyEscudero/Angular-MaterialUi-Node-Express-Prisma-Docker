import { Component, OnInit } from '@angular/core';
import { AnunciosService, Anuncio } from '../../servicios/anuncios.service';
import {
  AnuncioFormModel,
  crearAnuncioFormModel,
} from './modelos/anuncio-admin.model';

@Component({
  selector: 'app-lista-anuncios',
  templateUrl: './lista-anuncios.component.html',
  styleUrls: ['./lista-anuncios.component.css'],
})
export class ListaAnunciosComponent implements OnInit {
  // ── List state ──
  anuncios: Anuncio[] = [];

  // ── Form state ──
  mostrarFormulario = false;
  editandoId: number | null = null;
  modeloFormulario: AnuncioFormModel = crearAnuncioFormModel();

  // ── Feedback messages ──
  mensajeError = '';
  mensajeExito = '';

  constructor(private anunciosService: AnunciosService) {}

  ngOnInit(): void {
    this.cargarAnuncios();
  }

  // ──────────────────────────────────────────────
  //  Data fetching
  // ──────────────────────────────────────────────

  cargarAnuncios(): void {
    this.anunciosService.listarTodos().subscribe({
      next: (data) => (this.anuncios = data),
      error: (err) => console.error('Error al cargar anuncios', err),
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
      this.modeloFormulario = crearAnuncioFormModel();
    }
  }

  private limpiarFormulario(): void {
    this.modeloFormulario = crearAnuncioFormModel();
  }

  // ──────────────────────────────────────────────
  //  Edit — populate form with existing data
  // ──────────────────────────────────────────────

  editarAnuncio(anuncio: Anuncio): void {
    this.editandoId = anuncio.id;
    this.modeloFormulario = {
      titulo: anuncio.titulo,
      contenido: anuncio.contenido,
      tipo: anuncio.tipo,
      materia_id: anuncio.materia_id,
      rol_destino: anuncio.rol_destino,
      estado: anuncio.estado,
    };
    this.mostrarFormulario = true;
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  // ──────────────────────────────────────────────
  //  Save — create or update
  // ──────────────────────────────────────────────

  guardar(): void {
    if (!this.modeloFormulario.titulo || !this.modeloFormulario.contenido) {
      this.mensajeError = 'El título y el contenido son obligatorios';
      return;
    }

    const data = { ...this.modeloFormulario };

    if (this.editandoId) {
      this.anunciosService.actualizar(this.editandoId, data).subscribe({
        next: () => {
          this.mostrarFormulario = false;
          this.editandoId = null;
          this.limpiarFormulario();
          this.mensajeExito = 'Anuncio actualizado correctamente';
          this.cargarAnuncios();
          setTimeout(() => (this.mensajeExito = ''), 3000);
        },
        error: (err) => {
          this.mensajeError = err.error?.error || 'Error al actualizar anuncio';
        },
      });
    } else {
      this.anunciosService.crear(data).subscribe({
        next: () => {
          this.mostrarFormulario = false;
          this.limpiarFormulario();
          this.mensajeExito = 'Anuncio creado correctamente';
          this.cargarAnuncios();
          setTimeout(() => (this.mensajeExito = ''), 3000);
        },
        error: (err) => {
          this.mensajeError = err.error?.error || 'Error al crear anuncio';
        },
      });
    }
  }

  // ──────────────────────────────────────────────
  //  Publish / Archive / Delete
  // ──────────────────────────────────────────────

  publicarAnuncio(anuncio: Anuncio): void {
    this.anunciosService.publicar(anuncio.id).subscribe({
      next: () => {
        this.mensajeExito = 'Anuncio publicado correctamente. Se notificó a los usuarios.';
        this.cargarAnuncios();
        setTimeout(() => (this.mensajeExito = ''), 3000);
      },
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al publicar anuncio';
      },
    });
  }

  archivarAnuncio(anuncio: Anuncio): void {
    this.anunciosService.archivar(anuncio.id).subscribe({
      next: () => {
        this.mensajeExito = 'Anuncio archivado correctamente';
        this.cargarAnuncios();
        setTimeout(() => (this.mensajeExito = ''), 3000);
      },
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al archivar anuncio';
      },
    });
  }

  confirmarEliminar(anuncio: Anuncio): void {
    if (confirm(`¿Eliminar el anuncio "${anuncio.titulo}"? Esta acción no se puede deshacer.`)) {
      this.anunciosService.eliminar(anuncio.id).subscribe({
        next: () => {
          this.mensajeExito = 'Anuncio eliminado correctamente';
          this.cargarAnuncios();
          setTimeout(() => (this.mensajeExito = ''), 3000);
        },
        error: (err) => console.error('Error al eliminar anuncio', err),
      });
    }
  }
}
