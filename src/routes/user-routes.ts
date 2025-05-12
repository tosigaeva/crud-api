import { IncomingMessage, ServerResponse } from 'http';
import { handleUserRoute } from '../controllers/user-controller';
import {HttpStatusCode} from "../types/http-status-code";

export const router = async (
    req: IncomingMessage,
    res: ServerResponse,
): Promise<void> => {
    const urlParts = req.url?.split('/') || [];
    const [, api, resource, id] = urlParts;

    if (api === 'api' && resource === 'users') {
        await handleUserRoute(req, res, id);
    } else {
        res.writeHead(HttpStatusCode.NOT_FOUND, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Route not found' }));
    }
};
