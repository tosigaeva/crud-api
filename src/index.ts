import http, { IncomingMessage, ServerResponse } from 'http';
import dotenv from 'dotenv';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} from './db/users';
import { User } from './types/user';
import { HttpMethod } from "./types/http-method";
import { HttpStatusCode } from "./types/http-status-code";

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

const sendResponse = (
    res: ServerResponse,
    statusCode: number,
    data: unknown,
) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

const parseBody = async (req: IncomingMessage): Promise<any> => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => (body += chunk));
        req.on('end', () => {
            try {
                const parsed = JSON.parse(body || '{}');
                resolve(parsed);
            } catch (err) {
                reject(err);
            }
        });
    });
};

const server = http.createServer(async (req, res) => {
    const { method, url } = req;
    const [_, api, resource, id] = url?.split('/') || [];

    if (api !== 'api' || resource !== 'users') {
        sendResponse(res, HttpStatusCode.NOT_FOUND, { message: 'Route not found' });
        return;
    }

    try {
        if (method === HttpMethod.GET && !id) {
            const users = getAllUsers();
            sendResponse(res, HttpStatusCode.OK, users);
            return;
        }

        if (method === HttpMethod.GET && id) {
            if (!uuidValidate(id)) {
                sendResponse(res, HttpStatusCode.NOT_FOUND, { message: 'Invalid UUID' });
                return;
            }
            const user = getUserById(id);
            if (!user) {
                sendResponse(res, HttpStatusCode.NOT_FOUND, { message: 'User not found' });
                return;
            }
            sendResponse(res, HttpStatusCode.OK, user);
            return;
        }

        if (method === HttpMethod.POST && !id) {
            const body = await parseBody(req);
            const { username, age, hobbies } = body;

            if (
                typeof username !== 'string' ||
                typeof age !== 'number' ||
                !Array.isArray(hobbies)
            ) {
                sendResponse(res, HttpStatusCode.BAD_REQUEST, { message: 'Invalid user data' });
                return;
            }

            const newUser: User = {
                id: uuidv4(),
                username,
                age,
                hobbies,
            };

            createUser(newUser);
            sendResponse(res, 201, newUser);
            return;
        }

        if (method === HttpMethod.PUT && id) {
            if (!uuidValidate(id)) {
                sendResponse(res, HttpStatusCode.BAD_REQUEST, { message: 'Invalid UUID' });
                return;
            }

            const existingUser = getUserById(id);
            if (!existingUser) {
                sendResponse(res, HttpStatusCode.NOT_FOUND, { message: 'User not found' });
                return;
            }

            const body = await parseBody(req);
            const { username, age, hobbies } = body;

            if (
                typeof username !== 'string' ||
                typeof age !== 'number' ||
                !Array.isArray(hobbies)
            ) {
                sendResponse(res, HttpStatusCode.BAD_REQUEST, { message: 'Invalid user data' });
                return;
            }

            const updated = updateUser(id, { username, age, hobbies });
            sendResponse(res, HttpStatusCode.OK, updated);
            return;
        }

        if (method === HttpMethod.DELETE && id) {
            if (!uuidValidate(id)) {
                sendResponse(res, HttpStatusCode.BAD_REQUEST, { message: 'Invalid UUID' });
                return;
            }

            const deleted = deleteUser(id);
            if (!deleted) {
                sendResponse(res, HttpStatusCode.NOT_FOUND, { message: 'User not found' });
                return;
            }

            res.writeHead(HttpStatusCode.NO_CONTENT);
            res.end();
            return;
        }
    } catch (error) {
        sendResponse(res, HttpStatusCode.INTERNAL_SERVER_ERROR, { message: 'Internal Server Error' });
    }
});

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});