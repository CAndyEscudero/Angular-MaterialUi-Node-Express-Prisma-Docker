import { pool } from "../config/db";
import bcrypt from "bcrypt";

// Crear usuario
export async function crearUsuario(nombre: string, email: string, password: string, rol: string = "alumno") {
  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)",
    [nombre, email, hashedPassword, rol]
  );
  return result;
}

// Obtener todos los usuarios
export async function obtenerUsuarios() {
  const [rows] = await pool.query("SELECT id, nombre, email, rol, creado_en FROM usuarios");
  return rows;
}

// Buscar usuario por email (para login)
export async function buscarUsuarioPorEmail(email: string) {
  const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

// Actualizar usuario
export async function actualizarUsuario(id: number, nombre: string, email: string, rol: string) {
  const [result] = await pool.query(
    "UPDATE usuarios SET nombre = ?, email = ?, rol = ? WHERE id = ?",
    [nombre, email, rol, id]
  );
  return result;
}

// Eliminar usuario
export async function eliminarUsuario(id: number) {
  const [result] = await pool.query("DELETE FROM usuarios WHERE id = ?", [id]);
  return result;
}
// Cambiar contraseña
export async function cambiarPassword(id: number, newPassword: string) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const [result] = await pool.query("UPDATE usuarios SET password = ? WHERE id = ?", [hashedPassword, id]);
  return result;
}
