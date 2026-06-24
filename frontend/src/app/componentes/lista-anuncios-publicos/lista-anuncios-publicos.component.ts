import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnunciosService, Anuncio } from '../../servicios/anuncios.service';

export type FiltroAnuncio = 'todos' | 'generales' | 'materias';

@Component({
  selector: 'app-lista-anuncios-publicos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-anuncios-publicos.component.html',
  styleUrls: ['./lista-anuncios-publicos.component.css'],
})
export class ListaAnunciosPublicosComponent implements OnInit {
  @Input() highlightId: number | null = null;

  anuncios: Anuncio[] = [];
  filtroActivo: FiltroAnuncio = 'todos';
  cargando = false;
  error = false;
  expandidos = new Set<number>();

  constructor(private anunciosService: AnunciosService) {}

  ngOnInit(): void {
    this.cargarAnuncios();
  }

  cargarAnuncios(): void {
    this.cargando = true;
    this.error = false;
    this.anunciosService.obtenerPublicados().subscribe({
      next: (data) => {
        this.anuncios = data;
        this.cargando = false;

        // Autoexpandir el destacado si hay highlightId
        if (this.highlightId) {
          this.expandidos.add(this.highlightId);
        }
      },
      error: (err) => {
        console.error('Error al cargar anuncios', err);
        this.cargando = false;
        this.error = true;
      },
    });
  }

  get filtrados(): Anuncio[] {
    if (this.filtroActivo === 'generales') {
      return this.anuncios.filter((a) => a.tipo === 'general');
    }
    if (this.filtroActivo === 'materias') {
      return this.anuncios.filter((a) => a.tipo === 'materia');
    }
    return this.anuncios;
  }

  toggleExpand(id: number): void {
    if (this.expandidos.has(id)) {
      this.expandidos.delete(id);
    } else {
      this.expandidos.add(id);
    }
  }

  isExpandido(id: number): boolean {
    return this.expandidos.has(id);
  }

  setFiltro(f: FiltroAnuncio): void {
    this.filtroActivo = f;
  }

  trackById(_index: number, item: Anuncio): number {
    return item.id;
  }

  tiempoRelativo(fecha: string | null): string {
    if (!fecha) return '';
    const ahora = new Date();
    const pub = new Date(fecha);
    if (isNaN(pub.getTime())) return 'Fecha no disponible';

    const diffMs = ahora.getTime() - pub.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHoras < 24) return `Hace ${diffHoras} h`;
    if (diffDias < 7) return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;
    return pub.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  get filtro(): FiltroAnuncio {
    return this.filtroActivo;
  }
}
