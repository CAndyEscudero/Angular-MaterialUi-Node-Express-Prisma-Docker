"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usuarios_controller_1 = require("../controllers/usuarios.controller");
const router = (0, express_1.Router)();
// Listar todos los usuarios
router.get("/", usuarios_controller_1.getUsuarios);
// Crear nuevo usuario
router.post("/", usuarios_controller_1.createUsuario);
// Login de usuario
router.post("/login", usuarios_controller_1.loginUsuario);
// Actualizar usuario por ID
router.put("/:id", usuarios_controller_1.updateUsuario);
// Eliminar usuario por ID
router.delete("/:id", usuarios_controller_1.deleteUsuario);
exports.default = router;
