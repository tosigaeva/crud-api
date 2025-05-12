import http from 'http';
import dotenv from 'dotenv';
import { router } from './routes/user-routes';

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

const server = http.createServer((req, res) => {
    router(req, res);
});

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});