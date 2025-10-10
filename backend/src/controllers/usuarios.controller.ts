import { Request, Response } from "express";
import * as UsuarioModel from "../models/usuarios.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Obtener todos los usuarios
export async function getUsuarios(req: Request, res: Response) {
  try {
    const usuarios = await UsuarioModel.obtenerUsuarios();
    res.json(usuarios);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
}

// Crear usuario
export async function createUsuario(req: Request, res: Response) {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios" });
    }

    const result = await UsuarioModel.crearUsuario(nombre, email, password, rol || "alumno");
    res.status(201).json({ message: "Usuario creado", result });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: "Error al crear usuario" });
  }
}

// Login de usuario
export async function loginUsuario(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const usuario: any = await UsuarioModel.buscarUsuarioPorEmail(email);

    if (!usuario) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const passwordMatch = await bcrypt.compare(password, usuario.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET || "mi_secreto",
      { expiresIn: "1h" }
    );

    res.json({ message: "Login exitoso", token, rol: usuario.rol });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error en login" });
  }
}

// Actualizar usuario
export async function updateUsuario(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nombre, email, rol } = req.body;

    const result = await UsuarioModel.actualizarUsuario(Number(id), nombre, email, rol);
    res.json({ message: "Usuario actualizado", result });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
}

// Eliminar usuario
export async function deleteUsuario(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await UsuarioModel.eliminarUsuario(Number(id));
    res.json({ message: "Usuario eliminado", result });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
}
