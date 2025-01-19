import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Error handling
const unhandledRejections = new Map();
process.on('unhandledRejection', (reason, promise) => {
    unhandledRejections.set(promise, reason);
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('rejectionHandled', (promise) => {
    unhandledRejections.delete(promise);
});
process.on('Something went wrong', function (err) {
    console.log('Caught exception: ', err);
});

// Function to start the main application
function start() {
    let args = [path.join(__dirname, './client.js'), ...process.argv.slice(2)];
    let p = spawn(process.argv[0], args, {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc']
    })
        .on('message', data => {
            if (data === 'reset') {
                p.kill();
            }
        })
        .on('exit', () => {
            start();
        });
}

// Start the health check server
function startHealthCheckServer() {
    const server = http.createServer((req, res) => {
        if (req.method === 'GET' && req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'OK' }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not Found' }));
        }
    });

    const port = 8000;
    server.listen(port, () => {
        console.log(`Health check server is running on port ${port}`);
    });
}

// Start the application and health check server
start();
startHealthCheckServer();
