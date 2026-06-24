import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnunciosService, Anuncio } from '../../servicios/anuncios.service';

@Component({
  selector: 'app-anuncios-recientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './anuncios-recientes.component.html',
  styleUrls: ['./anuncios-recientes.component.css'],
})
export class AnunciosRecientesComponent implements OnInit {
  @Output() verTodos = new EventEmitter<void>();

  anuncios: Anuncio[] = [];
  cargando = false;
  error = false;

  constructor(private anunciosService: AnunciosService) {}

  ngOnInit(): void {
    this.cargarAnuncios();
  }

  cargarAnuncios(): void {
    this.cargando = true;
    this.error = false;
    this.anunciosService.obtenerPublicados().subscribe({
      next: (data) => {
        this.anuncios = data.slice(0, 5);
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar anuncios recientes', err);
        this.cargando = false;
        this.error = true;
      },
    });
  }

  tiempoRelativo(fecha: string | null): string {
    if (!fecha) return '';

    const ahora = new Date();
    const pub = new Date(fecha);

    // Si la fecha es inválida, mostrar un valor por defecto seguro
    if (isNaN(pub.getTime())) {
      console.warn('Fecha inválida en anuncio:', fecha);
      return 'Fecha no disponible';
    }

    const diffMs = ahora.getTime() - pub.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHoras < 24) return `Hace ${diffHoras} h`;
    if (diffDias < 7) return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;
    return pub.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  }

  truncate(text: string, max: number = 80): string {
    return text.length > max ? text.slice(0, max) + '...' : text;
  }
}
