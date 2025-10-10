"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsuarios = getUsuarios;
exports.createUsuario = createUsuario;
exports.loginUsuario = loginUsuario;
exports.updateUsuario = updateUsuario;
exports.deleteUsuario = deleteUsuario;
const UsuarioModel = __importStar(require("../models/usuarios.model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Obtener todos los usuarios
async function getUsuarios(req, res) {
    try {
        const usuarios = await UsuarioModel.obtenerUsuarios();
        res.json(usuarios);
    }
    catch (error) {
        console.error("Error al obtener usuarios:", error);
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
}
// Crear usuario
async function createUsuario(req, res) {
    try {
        const { nombre, email, password, rol } = req.body;
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
        }
        const result = await UsuarioModel.crearUsuario(nombre, email, password, rol || "alumno");
        res.status(201).json({ message: "Usuario creado", result });
    }
    catch (error) {
        console.error("Error al crear usuario:", error);
        res.status(500).json({ error: "Error al crear usuario" });
    }
}
// Login de usuario
async function loginUsuario(req, res) {
    try {
        const { email, password } = req.body;
        const usuario = await UsuarioModel.buscarUsuarioPorEmail(email);
        if (!usuario) {
            return res.status(401).json({ error: "Usuario no encontrado" });
        }
        const passwordMatch = await bcrypt_1.default.compare(password, usuario.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: "Credenciales incorrectas" });
        }
        const token = jsonwebtoken_1.default.sign({ id: usuario.id, rol: usuario.rol }, process.env.JWT_SECRET || "mi_secreto", { expiresIn: "1h" });
        res.json({ message: "Login exitoso", token, rol: usuario.rol });
    }
    catch (error) {
        console.error("Error en login:", error);
        res.status(500).json({ error: "Error en login" });
    }
}
// Actualizar usuario
async function updateUsuario(req, res) {
    try {
        const { id } = req.params;
        const { nombre, email, rol } = req.body;
        const result = await UsuarioModel.actualizarUsuario(Number(id), nombre, email, rol);
        res.json({ message: "Usuario actualizado", result });
    }
    catch (error) {
        console.error("Error al actualizar usuario:", error);
        res.status(500).json({ error: "Error al actualizar usuario" });
    }
}
// Eliminar usuario
async function deleteUsuario(req, res) {
    try {
        const { id } = req.params;
        const result = await UsuarioModel.eliminarUsuario(Number(id));
        res.json({ message: "Usuario eliminado", result });
    }
    catch (error) {
        console.error("Error al eliminar usuario:", error);
        res.status(500).json({ error: "Error al eliminar usuario" });
    }
}
