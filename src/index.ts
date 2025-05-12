import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Server is running!\n');
});

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});