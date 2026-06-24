import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import usuariosRoutes from "./routes/usuarios.routes";
import materiasRoutes from "./routes/materias.routes";
import profesoresRoutes from "./routes/profesores.routes";
import alumnosRoutes from "./routes/alumnos.routes";
import inscripcionesRoutes from "./routes/inscripciones.routes";
import carrerasRoutes from "./routes/carreras.routes";
import inscripcionesCarreraRoutes from "./routes/inscripciones-carrera.routes";
import periodosInscripcionRoutes from "./routes/periodos-inscripcion.routes";
import examenesRoutes from "./routes/examenes.routes";
import notificacionesRoutes from "./routes/notificaciones.routes";
import anunciosRoutes from "./routes/anuncios.routes";

dotenv.config();
const app = express();

// CORS — allow frontend origin from env or default to localhost:4200
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:4200",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/materias", materiasRoutes);
app.use("/api/profesores", profesoresRoutes);
app.use("/api/alumnos", alumnosRoutes);
app.use("/api/inscripciones", inscripcionesRoutes);
app.use("/api/carreras", carrerasRoutes);
app.use("/api/inscripciones-carrera", inscripcionesCarreraRoutes);
app.use("/api/periodos-inscripcion", periodosInscripcionRoutes);
app.use("/api/examenes", examenesRoutes);
app.use("/api/notificaciones", notificacionesRoutes);
app.use("/api/anuncios", anunciosRoutes);

// Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
