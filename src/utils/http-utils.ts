import { IncomingMessage, ServerResponse } from 'http';

export const sendJSON = (res: ServerResponse, code: number, data: unknown) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

export const parseBody = (req: IncomingMessage): Promise<any> =>
    new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
            try {
                resolve(JSON.parse(body || '{}'));
            } catch {
                reject(new Error('Invalid JSON'));
            }
        });
    });
