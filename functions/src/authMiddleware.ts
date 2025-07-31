import { Request, Response, NextFunction } from 'express';

const API_TOKEN = process.env.API_TOKEN || 'a9f3e1c3a8c84dfe1e650d37e76408a2f1aa0835822e21415ae12586dc0e754e';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    // Verifica se o header existe e começa com 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Não autorizado' });
        return;
    }

    // Extrai o token depois do 'Bearer '
    const token = authHeader.split(' ')[1];

    if (token !== API_TOKEN) {
        res.status(401).json({ error: 'Token inválido' });
        return;
    }

    next();
};