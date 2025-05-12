import { IncomingMessage, ServerResponse } from 'http';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} from '../db/users';
import { User } from '../types/user';
import { parseBody, sendJSON } from '../utils/http-utils';
import {HttpMethod} from "../types/http-method";
import {HttpStatusCode} from "../types/http-status-code";

export const handleUserRoute = async (
    req: IncomingMessage,
    res: ServerResponse,
    id?: string,
) => {
    try {
        const { method } = req;

        if (method === HttpMethod.GET && !id) {
            const users = getAllUsers();
            return sendJSON(res, HttpStatusCode.OK, users);
        }

        if (method === HttpMethod.GET && id) {
            if (!uuidValidate(id)) {
                return sendJSON(res, HttpStatusCode.NOT_FOUND, { message: 'Invalid UUID' });
            }
            const user = getUserById(id);
            return user
                ? sendJSON(res, HttpStatusCode.OK, user)
                : sendJSON(res,  HttpStatusCode.NOT_FOUND, { message: 'User not found' });
        }

        if (method === HttpMethod.POST && !id) {
            const body = await parseBody(req);
            const { username, age, hobbies } = body;

            if (
                typeof username !== 'string' ||
                typeof age !== 'number' ||
                !Array.isArray(hobbies)
            ) {
                return sendJSON(res, HttpStatusCode.BAD_REQUEST, { message: 'Invalid user data' });
            }

            const newUser: User = {
                id: uuidv4(),
                username,
                age,
                hobbies,
            };

            createUser(newUser);
            return sendJSON(res, 201, newUser);
        }

        if (method === HttpMethod.PUT && id) {
            if (!uuidValidate(id)) {
                return sendJSON(res, HttpStatusCode.BAD_REQUEST, { message: 'Invalid UUID' });
            }

            const existingUser = getUserById(id);
            if (!existingUser) {
                return sendJSON(res, HttpStatusCode.NOT_FOUND, { message: 'User not found' });
            }

            const body = await parseBody(req);
            const { username, age, hobbies } = body;

            if (
                typeof username !== 'string' ||
                typeof age !== 'number' ||
                !Array.isArray(hobbies)
            ) {
                return sendJSON(res, HttpStatusCode.BAD_REQUEST, { message: 'Invalid user data' });
            }

            const updated = updateUser(id, { username, age, hobbies });
            return sendJSON(res, HttpStatusCode.OK, updated);
        }

        if (method === HttpMethod.DELETE && id) {
            if (!uuidValidate(id)) {
                return sendJSON(res, HttpStatusCode.BAD_REQUEST, { message: 'Invalid UUID' });
            }

            const deleted = deleteUser(id);
            if (!deleted) {
                return sendJSON(res, HttpStatusCode.NOT_FOUND, { message: 'User not found' });
            }

            res.writeHead(HttpStatusCode.NO_CONTENT);
            res.end();
            return;
        }
    } catch (error) {
        sendJSON(res, HttpStatusCode.INTERNAL_SERVER_ERROR, { message: 'Internal Server Error' });
    }

}