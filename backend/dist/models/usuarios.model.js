"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearUsuario = crearUsuario;
exports.obtenerUsuarios = obtenerUsuarios;
exports.buscarUsuarioPorEmail = buscarUsuarioPorEmail;
exports.actualizarUsuario = actualizarUsuario;
exports.eliminarUsuario = eliminarUsuario;
exports.cambiarPassword = cambiarPassword;
const db_1 = require("../config/db");
const bcrypt_1 = __importDefault(require("bcrypt"));
// Crear usuario
async function crearUsuario(nombre, email, password, rol = "alumno") {
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const [result] = await db_1.pool.query("INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)", [nombre, email, hashedPassword, rol]);
    return result;
}
// Obtener todos los usuarios
async function obtenerUsuarios() {
    const [rows] = await db_1.pool.query("SELECT id, nombre, email, rol, creado_en FROM usuarios");
    return rows;
}
// Buscar usuario por email (para login)
async function buscarUsuarioPorEmail(email) {
    const [rows] = await db_1.pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}
// Actualizar usuario
async function actualizarUsuario(id, nombre, email, rol) {
    const [result] = await db_1.pool.query("UPDATE usuarios SET nombre = ?, email = ?, rol = ? WHERE id = ?", [nombre, email, rol, id]);
    return result;
}
// Eliminar usuario
async function eliminarUsuario(id) {
    const [result] = await db_1.pool.query("DELETE FROM usuarios WHERE id = ?", [id]);
    return result;
}
// Cambiar contraseña
async function cambiarPassword(id, newPassword) {
    const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
    const [result] = await db_1.pool.query("UPDATE usuarios SET password = ? WHERE id = ?", [hashedPassword, id]);
    return result;
}
