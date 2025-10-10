import { Router } from "express";
import {
  getUsuarios,
  createUsuario,
  loginUsuario,
  updateUsuario,
  deleteUsuario,
} from "../controllers/usuarios.controller";

const router = Router();

// Listar todos los usuarios
router.get("/", getUsuarios);

// Crear nuevo usuario
router.post("/", createUsuario);

// Login de usuario
router.post("/login", loginUsuario);

// Actualizar usuario por ID
router.put("/:id", updateUsuario);

// Eliminar usuario por ID
router.delete("/:id", deleteUsuario);

export default router;
