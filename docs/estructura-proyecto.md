# Estructura del Proyecto

## Refactor: Container / Presentational — `solicitudes-carrera`

Este refactor desacopla la feature de **Solicitudes de Inscripción a Carreras** siguiendo el patrón **Container / Presentational** (Smart / Dumb components).

### Antes (monolítico)

```
solicitudes-carrera/
├── solicitudes-carrera.component.ts      # 169 líneas — lógica + estado + API + presentación
├── solicitudes-carrera.component.html    # 236 líneas — template único con todo: filtros, tabla, modal
├── solicitudes-carrera.component.css     # 354 líneas — todos los estilos acoplados
```

Problemas:
- El componente mezclaba llamadas a la API, estado de la UI, validaciones, y presentación HTML.
- Los filtros, la tabla y el modal no podían reutilizarse ni testearse por separado.
- Cualquier cambio de layout requería modificar el mismo archivo masivo.

### Después (desacoplado)

```
solicitudes-carrera/
├── modelos/
│   └── solicitud-carrera.model.ts            # Interfaces y utilidades puras (formateo, badges)
├── componentes/
│   ├── filtros-solicitudes/
│   │   ├── filtros-solicitudes.component.ts  # Presentacional: recibe filtroActivo, emite cambio
│   │   ├── filtros-solicitudes.component.html
│   │   └── filtros-solicitudes.component.css
│   ├── tabla-solicitudes/
│   │   ├── tabla-solicitudes.component.ts    # Presentacional: recibe lista + loading, emite selección
│   │   ├── tabla-solicitudes.component.html
│   │   └── tabla-solicitudes.component.css
│   └── modal-detalle-solicitud/
│       ├── modal-detalle-solicitud.component.ts  # Presentacional: muestra detalle + documentos + revisión
│       ├── modal-detalle-solicitud.component.html
│       └── modal-detalle-solicitud.component.css
├── solicitudes-carrera.component.ts         # Container: orquesta, llama al servicio, maneja estado
├── solicitudes-carrera.component.html       # Compone los hijos con @Input/@Output
└── solicitudes-carrera.component.css        # Solo estilos de layout del contenedor
```

### Responsabilidades

| Componente | Rol | Inputs | Outputs |
|---|---|---|---|
| `SolicitudesCarreraComponent` | **Container** — orquesta, llama al servicio, maneja estado global | — (raíz de ruta) | — |
| `FiltrosSolicitudesComponent` | Presentacional — botones de filtro | `filtroActivo: string` | `filtroCambiado: string` |
| `TablaSolicitudesComponent` | Presentacional — tabla con datos y loading | `solicitudes[]`, `loading`, `filtroActivo` | `seleccionar: InscripcionCarrera` |
| `ModalDetalleSolicitudComponent` | Presentacional — modal con detalle, documentos y revisión | `solicitud`, `loading` | `cerrar`, `verDocumento(id)`, `revisar({accion, motivo})` |

### Beneficios (para la tesis)

1. **Separación de responsabilidades** — Cada componente tiene una única razón para cambiar (Single Responsibility).
2. **Testeabilidad** — Los componentes presentacionales se testean con inputs mock sin necesidad del servicio HTTP.
3. **Reutilización** — `FiltrosSolicitudesComponent` puede reusarse en otras secciones que necesiten filtros por estado.
4. **Carga cognitiva reducida** — Cada archivo tiene <150 líneas vs. los 354+ originales.
5. **Flujo de datos unidireccional** — Los datos fluyen hacia abajo (Inputs), los eventos hacia arriba (Outputs). Fácil de rastrear.
6. **Desacoplamiento del servicio** — Solo el container conoce `InscripcionesCarreraService`. Los hijos trabajan con modelos puros.

### Estructura general del frontend

```
frontend/src/app/
├── admin/                    # Módulo de administración (lazy-loaded)
│   ├── admin.module.ts
│   ├── admin-routing.module.ts
│   ├── pagina-admin.component.*
│   ├── lista-usuarios/
│   ├── lista-materias/
│   ├── lista-carreras/
│   └── solicitudes-carrera/  # → Feature refactorizada (patrón container/presentational)
├── estudiantes/              # Módulo de estudiantes (lazy-loaded)
├── docentes/                 # Módulo de docentes (lazy-loaded)
├── autenticacion/            # Módulo de autenticación (lazy-loaded)
├── servicios/                # Servicios compartidos (HTTP)
├── guards/                   # Route guards
└── app-routing.module.ts
```

## Refactor: Container / Presentational — `lista-materias`

Siguiendo el mismo patrón que `solicitudes-carrera`, se refactorizó la feature de **Materias** para separar responsabilidades en container, componentes presentacionales y modelos.

### Antes (monolítico)

```
lista-materias/
├── lista-materias.component.ts      # 192 líneas — lógica + estado + API + presentación
├── lista-materias.component.html    # 170 líneas — template único con form + tabla
├── lista-materias.component.css     # 212 líneas — todos los estilos acoplados
```

Problemas:
- El componente mezclaba llamadas a la API, estado del formulario, validaciones, y presentación HTML.
- El formulario de creación/edición y la tabla no podían reutilizarse ni testearse por separado.
- Cualquier cambio de layout requería modificar el mismo archivo masivo.

### Después (desacoplado)

```
lista-materias/
├── modelos/
│   └── materia-admin.model.ts                # Interfaces (MateriaFormModel, ProfesorItem) + helpers puros
├── componentes/
│   ├── formulario-materia/
│   │   ├── formulario-materia.component.ts   # Presentacional: form bindings, emite guardar/cancelar
│   │   ├── formulario-materia.component.html
│   │   └── formulario-materia.component.css
│   └── tabla-materias/
│       ├── tabla-materias.component.ts        # Presentacional: tabla con materias, emite editar/eliminar
│       ├── tabla-materias.component.html
│       └── tabla-materias.component.css
├── lista-materias.component.ts               # Container: orquesta, llama servicios, maneja estado
├── lista-materias.component.html             # Compone los hijos con @Input/@Output
└── lista-materias.component.css              # Solo estilos de layout del contenedor
```

### Responsabilidades

| Componente | Rol | Inputs | Outputs |
|---|---|---|---|
| `ListaMateriasComponent` | **Container** — orquesta, llama servicios, maneja estado global | — (raíz de ruta) | — |
| `FormularioMateriaComponent` | Presentacional — formulario con todos los campos | `modelo`, `editandoId`, `profesores[]`, `carreras[]`, `cargandoProfesores`, `mensajeError` | `guardar`, `cancelar` |
| `TablaMateriasComponent` | Presentacional — tabla con listado de materias | `materias[]` | `editar(materia)`, `eliminar(materia)` |

### Beneficios (para la tesis)

1. **Separación de responsabilidades** — Cada componente tiene una única razón para cambiar (Single Responsibility Principle).
2. **Testeabilidad** — `FormularioMateriaComponent` y `TablaMateriasComponent` se testean con inputs mock sin necesidad de servicios HTTP.
3. **Reutilización** — `FormularioMateriaComponent` puede reutilizarse en otras secciones que necesiten crear/editar materias.
4. **Carga cognitiva reducida** — Ningún archivo supera las ~100 líneas de lógica vs. los 192+ originales.
5. **Flujo de datos unidireccional** — Los datos fluyen hacia abajo (Inputs), los eventos hacia arriba (Outputs).
6. **Desacoplamiento del servicio** — Solo el container conoce `MateriasService` y `CarrerasService`. Los hijos trabajan con modelos puros.
7. **Consistencia con `solicitudes-carrera`** — Ambos módulos del panel admin siguen exactamente la misma arquitectura, lo que demuestra que el patrón se aplicó de forma sistemática y no es un caso aislado.

## Refactor: Container / Presentational — `lista-usuarios`

Siguiendo el mismo patrón que `solicitudes-carrera` y `lista-materias`, se refactorizó la feature de **Usuarios** para separar responsabilidades en container, componentes presentacionales y modelos.

### Antes (monolítico)

```
lista-usuarios/
├── lista-usuarios.component.ts      # 97 líneas — lógica + estado + API + presentación
├── lista-usuarios.component.html    # 70 líneas — template único con form + tabla + badges inline
├── lista-usuarios.component.css     # 171 líneas — todos los estilos acoplados
```

Problemas:
- El componente mezclaba llamadas a la API, filtrado local, estado del formulario, validaciones, y presentación HTML.
- El formulario de creación y la tabla no podían reutilizarse ni testearse por separado.
- El filtrado por rol y el badge de rol estaban acoplados al template del container.

### Después (desacoplado)

```
lista-usuarios/
├── modelos/
│   └── usuario-admin.model.ts                 # Interfaces (UsuarioFormModel) + helpers puros (rolLabel, rolBadgeClass)
├── componentes/
│   ├── formulario-usuario/
│   │   ├── formulario-usuario.component.ts    # Presentacional: form bindings, emite guardar/cancelar
│   │   ├── formulario-usuario.component.html
│   │   └── formulario-usuario.component.css
│   └── tabla-usuarios/
│       ├── tabla-usuarios.component.ts         # Presentacional: tabla con usuarios, emite eliminar
│       ├── tabla-usuarios.component.html
│       └── tabla-usuarios.component.css
├── lista-usuarios.component.ts                # Container: orquesta, llama servicio, maneja estado
├── lista-usuarios.component.html              # Compone los hijos con @Input/@Output
└── lista-usuarios.component.css               # Solo estilos de layout del contenedor
```

### Responsabilidades

| Componente | Rol | Inputs | Outputs |
|---|---|---|---|
| `ListaUsuariosComponent` | **Container** — orquesta, llama servicios, maneja estado global | `filtroRol` | — |
| `FormularioUsuarioComponent` | Presentacional — formulario para crear usuario | `modelo`, `mensajeError` | `guardar`, `cancelar` |
| `TablaUsuariosComponent` | Presentacional — tabla con listado de usuarios | `usuarios[]` | `eliminar(usuario)` |

### Beneficios (para la tesis)

1. **Separación de responsabilidades** — Cada componente tiene una única razón para cambiar (Single Responsibility Principle).
2. **Testeabilidad** — `FormularioUsuarioComponent` y `TablaUsuariosComponent` se testean con inputs mock sin necesidad del servicio HTTP.
3. **Carga cognitiva reducida** — Ningún archivo supera las ~60 líneas de lógica vs. los 97+ originales.
4. **Flujo de datos unidireccional** — Los datos fluyen hacia abajo (Inputs), los eventos hacia arriba (Outputs).
5. **Desacoplamiento del servicio** — Solo el container conoce `UsuariosService`. Los hijos trabajan con modelos puros.
6. **Consistencia con `solicitudes-carrera` y `lista-materias`** — Los tres módulos del panel admin siguen exactamente la misma arquitectura.

---

## Refactor: Container / Presentational — `lista-carreras`

Siguiendo el mismo patrón que `solicitudes-carrera` y `lista-materias`, se refactorizó la feature de **Carreras** para separar responsabilidades en container, componentes presentacionales y modelos.

### Antes (monolítico)

```
lista-carreras/
├── lista-carreras.component.ts      # 130 líneas — lógica + estado + API + presentación
├── lista-carreras.component.html    # 114 líneas — template único con form + tabla + badges inline
├── lista-carreras.component.css     # 44 líneas — estilos parciales (dependía de estilos globales)
```

Problemas:
- El componente mezclaba llamadas a la API, estado del formulario, validaciones, y presentación HTML.
- El formulario de creación/edición y la tabla no podían reutilizarse ni testearse por separado.
- Los estilos de tabla, botones y formularios dependían de clases globales no declaradas en el componente.

### Después (desacoplado)

```
lista-carreras/
├── modelos/
│   └── carrera-admin.model.ts                 # Interfaces (CarreraFormModel) + helpers puros (estadoBadgeClass, estadoLabel)
├── componentes/
│   ├── formulario-carrera/
│   │   ├── formulario-carrera.component.ts    # Presentacional: form bindings, emite guardar/cancelar
│   │   ├── formulario-carrera.component.html
│   │   └── formulario-carrera.component.css
│   └── tabla-carreras/
│       ├── tabla-carreras.component.ts         # Presentacional: tabla con carreras, emite editar/alternarEstado
│       ├── tabla-carreras.component.html
│       └── tabla-carreras.component.css
├── lista-carreras.component.ts                # Container: orquesta, llama servicio, maneja estado
├── lista-carreras.component.html              # Compone los hijos con @Input/@Output
└── lista-carreras.component.css               # Solo estilos de layout del contenedor
```

### Responsabilidades

| Componente | Rol | Inputs | Outputs |
|---|---|---|---|
| `ListaCarrerasComponent` | **Container** — orquesta, llama servicios, maneja estado global | — (raíz de ruta) | — |
| `FormularioCarreraComponent` | Presentacional — formulario con todos los campos | `modelo`, `editandoId`, `mensajeError` | `guardar`, `cancelar` |
| `TablaCarrerasComponent` | Presentacional — tabla con listado de carreras | `carreras[]` | `editar(carrera)`, `alternarEstado(carrera)` |

### Beneficios (para la tesis)

1. **Separación de responsabilidades** — Cada componente tiene una única razón para cambiar (Single Responsibility Principle).
2. **Testeabilidad** — `FormularioCarreraComponent` y `TablaCarrerasComponent` se testean con inputs mock sin necesidad del servicio HTTP.
3. **Carga cognitiva reducida** — Ningún archivo supera las ~60 líneas de lógica vs. los 130+ originales.
4. **Flujo de datos unidireccional** — Los datos fluyen hacia abajo (Inputs), los eventos hacia arriba (Outputs).
5. **Desacoplamiento del servicio** — Solo el container conoce `CarrerasService`. Los hijos trabajan con modelos puros.
6. **Autocontención de estilos** — Cada componente ahora declara sus propias clases CSS, eliminando la dependencia de estilos globales no documentados.
7. **Consistencia con `solicitudes-carrera`, `lista-materias` y `lista-usuarios`** — Los cuatro módulos del panel admin siguen exactamente la misma arquitectura, demostrando que el patrón se aplicó de forma sistemática en todo el módulo.

---

### Estructura general del frontend

```
frontend/src/app/
├── admin/                    # Módulo de administración (lazy-loaded)
│   ├── admin.module.ts
│   ├── admin-routing.module.ts
│   ├── pagina-admin.component.*
│   ├── lista-usuarios/       # ✅ Refactorizado (container/presentational)
│   ├── lista-materias/       # ✅ Refactorizado (container/presentational)
│   ├── lista-carreras/       # ✅ Refactorizado (container/presentational)
│   └── solicitudes-carrera/  # ✅ Refactorizado (container/presentational)
├── estudiantes/              # Módulo de estudiantes (lazy-loaded)
├── docentes/                 # Módulo de docentes (lazy-loaded)
├── autenticacion/            # Módulo de autenticación (lazy-loaded)
├── servicios/                # Servicios compartidos (HTTP)
├── guards/                   # Route guards
└── app-routing.module.ts
```
