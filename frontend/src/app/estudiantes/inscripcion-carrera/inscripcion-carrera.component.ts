import { Component, OnInit } from '@angular/core';
import { InscripcionesCarreraService, InscripcionCarrera } from '../../servicios/inscripciones-carrera.service';
import { CarrerasService, Carrera } from '../../servicios/carreras.service';

@Component({
  selector: 'app-inscripcion-carrera',
  templateUrl: './inscripcion-carrera.component.html',
  styleUrls: ['./inscripcion-carrera.component.css'],
})
export class InscripcionCarreraComponent implements OnInit {
  /** Current application (null = never applied) */
  solicitud: InscripcionCarrera | null = null;
  carreras: Carrera[] = [];
  loading = true;
  modoSolicitud = false;

  // Form fields
  carreraSeleccionada: number | null = null;
  archivos: { tipo: string; archivo: File | null; nombre: string }[] = [
    { tipo: 'dni_frente', archivo: null, nombre: 'DNI Frente' },
    { tipo: 'dni_dorso', archivo: null, nombre: 'DNI Dorso' },
    { tipo: 'titulo_secundario', archivo: null, nombre: 'Título Secundario' },
    { tipo: 'foto_carnet', archivo: null, nombre: 'Foto Carnet' },
  ];
  archivoOtro: File | null = null;

  mensajeExito = '';
  mensajeError = '';

  constructor(
    private inscripcionCarreraService: InscripcionesCarreraService,
    private carrerasService: CarrerasService
  ) {}

  ngOnInit(): void {
    this.cargarCarreras();
    this.cargarSolicitud();
  }

  private cargarCarreras(): void {
    this.carrerasService.obtenerTodas().subscribe({
      next: (data) => {
        this.carreras = data.filter((c) => c.activa);
      },
      error: () => console.error('Error al cargar carreras'),
    });
  }

  private cargarSolicitud(): void {
    this.loading = true;
    this.inscripcionCarreraService.obtenerMiSolicitud().subscribe({
      next: (data) => {
        this.solicitud = data;
        this.loading = false;
      },
      error: () => {
        this.solicitud = null;
        this.loading = false;
      },
    });
  }

  get tieneSolicitudActiva(): boolean {
    return this.solicitud !== null && this.solicitud.estado === 'pendiente';
  }

  get puedeSolicitar(): boolean {
    return (
      this.solicitud === null ||
      this.solicitud.estado === 'rechazada' ||
      this.solicitud.estado === 'cancelada'
    );
  }

  get estaAprobada(): boolean {
    return this.solicitud?.estado === 'aprobada';
  }

  iniciarSolicitud(): void {
    this.modoSolicitud = true;
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  cancelarSolicitud(): void {
    this.modoSolicitud = false;
    this.carreraSeleccionada = null;
    this.archivos.forEach((a) => (a.archivo = null));
    this.archivoOtro = null;
    this.mensajeError = '';
  }

  onFileSelected(tipo: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type
      const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowed.includes(file.type)) {
        this.mensajeError = 'Formato no permitido. Solo JPG, PNG y PDF.';
        input.value = '';
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.mensajeError = 'El archivo no puede superar los 5MB.';
        input.value = '';
        return;
      }

      this.mensajeError = '';

      if (tipo === 'otro') {
        this.archivoOtro = file;
      } else {
        const item = this.archivos.find((a) => a.tipo === tipo);
        if (item) item.archivo = file;
      }
    }
  }

  getArchivoNombre(tipo: string): string {
    if (tipo === 'otro') {
      return this.archivoOtro?.name || '';
    }
    const item = this.archivos.find((a) => a.tipo === tipo);
    return item?.archivo?.name || '';
  }

  enviarSolicitud(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.carreraSeleccionada) {
      this.mensajeError = 'Debes seleccionar una carrera.';
      return;
    }

    // Check required documents
    const docsAEnviar: { tipo: string; archivo: File }[] = [];

    for (const item of this.archivos) {
      if (item.archivo) {
        docsAEnviar.push({ tipo: item.tipo, archivo: item.archivo });
      }
    }

    // At least DNI frente + DNI dorso + título secundario are required
    const tieneDniFrente = docsAEnviar.some((d) => d.tipo === 'dni_frente');
    const tieneDniDorso = docsAEnviar.some((d) => d.tipo === 'dni_dorso');
    const tieneTitulo = docsAEnviar.some((d) => d.tipo === 'titulo_secundario');

    if (!tieneDniFrente || !tieneDniDorso || !tieneTitulo) {
      this.mensajeError =
        'Debes subir al menos: DNI Frente, DNI Dorso y Título Secundario.';
      return;
    }

    if (this.archivoOtro) {
      docsAEnviar.push({ tipo: 'otro', archivo: this.archivoOtro });
    }

    this.loading = true;
    this.inscripcionCarreraService
      .solicitar(this.carreraSeleccionada, docsAEnviar)
      .subscribe({
        next: () => {
          this.mensajeExito = 'Solicitud enviada correctamente.';
          this.modoSolicitud = false;
          this.carreraSeleccionada = null;
          this.archivos.forEach((a) => (a.archivo = null));
          this.archivoOtro = null;
          this.cargarSolicitud();
        },
        error: (err) => {
          this.mensajeError =
            err.error?.error || 'Error al enviar la solicitud.';
          this.loading = false;
        },
      });
  }

  estadoBadgeClass(estado: string): string {
    switch (estado) {
      case 'aprobada':
        return 'status-aprobada';
      case 'rechazada':
        return 'status-rechazada';
      case 'cancelada':
        return 'status-cancelada';
      default:
        return 'status-pendiente';
    }
  }

  estadoLabel(estado: string): string {
    switch (estado) {
      case 'aprobada':
        return 'Aprobada';
      case 'rechazada':
        return 'Rechazada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return 'Pendiente';
    }
  }
}
