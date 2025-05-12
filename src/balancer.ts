import { config } from 'dotenv';
import { cpus } from 'node:os';
import cluster, { Worker } from 'node:cluster';
import { createServer, IncomingMessage, ServerResponse, request, ClientRequest } from 'node:http';
import http from "http";
import { router } from "./routes/user-routes";
import { Message } from "./types/message";
import { HttpStatusCode } from "./types/http-status-code";
import { getAllUsers, sync } from "./db/users";

config();

const PORT: number = Number(process.env.PORT) || 4000;
const numCPUs: number = cpus().length - 1;

function startWorker(): void {
  const workerPort = PORT + (cluster.worker?.id || 1);
  const server = http.createServer((req, res) => {
    router(req, res);
  });

  server.listen(workerPort, (): void => {
    console.log(`Worker ${process.pid} is listening on PORT: ${workerPort}`);
  });

  server.on('error', (error) => {
    console.error(`Error occurred in worker ${process.pid}: ${error.message}`);
  });

  if (process.send) process.send({ type: "syncRequest" });

  process.on("message", (message: Message) => {
    if (message.type === "sync") {
      sync(message.data);
    }
  });
}

function createLoadBalancer(): void {
  const loadBalancer = createServer(handleLoadBalancerRequest);
  loadBalancer.listen(PORT, () => console.log(`Load Balancer is listening on PORT: ${PORT}`));
}

function handleLoadBalancerRequest(req: IncomingMessage, res: ServerResponse): void {
  const targetPort = PORT + ((req.headers['x-forwarded-for'] ? 1 : 2) % numCPUs) + 1;
  
  const proxyRequest: ClientRequest = request(
    {
      hostname: 'localhost',
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (workerRes): void => {
      res.writeHead(workerRes.statusCode ?? HttpStatusCode.INTERNAL_SERVER_ERROR, workerRes.headers);
      workerRes.pipe(res, { end: true });
    },
  );

  proxyRequest.on('error', (error): void => {
    console.error(`Proxy request error: ${error.message}`);
    res.writeHead(HttpStatusCode.BAD_GATEWAY);
    res.end('Bad Gateway');
  });

  req.pipe(proxyRequest, { end: true });
}

function initializeWorkers(): Worker[] {
  const workers: Worker[] = [];
  for (let i = 0; i < numCPUs; i++) {
    workers.push(cluster.fork());
  }
  return workers;
}

function setupWorkerMessaging(workers: Worker[]): void {
  workers.forEach(worker => worker.on('message', (msg: Message) => {
    if (msg.type === "syncRequest") {
      worker.send({ type: "sync", data: getAllUsers() });
      return;
    }
    
    if (msg.type === "update") {
      sync(msg.data);
      workers
        .filter(w => worker.id != w.id)
        .forEach(w => w.send({ type: "sync", data: getAllUsers() }));
      return;
    }
  }));

  cluster.on('exit', (worker, code, signal): void => {
    console.log(`Worker ${worker.process.pid} exited. Code: ${code}, Signal: ${signal}`);
  });
}

function main(): void {
  if (!cluster.isPrimary) {
    startWorker();
    return;
  }

  console.log(`Master ${process.pid} is running...`);
  createLoadBalancer();
  
  const workers = initializeWorkers();
  setupWorkerMessaging(workers);
}

main();
