import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    id: number;
    rol: string;
}

// Extiende la interfaz Request para incluir 'usuario'
declare global {
    namespace Express {
        interface Request {
            usuario?: JwtPayload;
        }
    }
}

export const verificarToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado' });
    }

    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET no configurado');
            return res.status(500).json({ error: 'Configuración de autenticación incompleta' });
        }

        const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
        req.usuario = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

export const esProfesorOAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.usuario?.rol !== 'profesor' && req.usuario?.rol !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos suficientes' });
    }
    next();
};

export const esAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.usuario?.rol !== 'admin') {
        return res.status(403).json({ error: 'Acción permitida solo para administradores' });
    }
    next();
};
