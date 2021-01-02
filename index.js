/*
 * Primary file for API
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config.js');

// Instantiate the HTTP server
const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
});

// Start the HTTP server
httpServer.listen(config.httpPort, () => {
    console.log(`The server is listening on port ${config.httpPort} in ${config.envName} now`);
});

// Instantiate the HTTPS server
const httpServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpServerOptions, (req, res) => {
    unifiedServer(req, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, () => {
    console.log(`The HTTPS server is listening on port ${config.httpsPort} in ${config.envName} now`);
});

// All the server logic for both the http and https servers
const unifiedServer = (req, res) => {
    // Get the URL and parse it
    const parsedUrl = url.parse(req.url, true);

    // Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace('/^\/+|\/+$/g', '');

    // Get the query string as an object 
    const queryStringObject = JSON.stringify(parsedUrl.query);

    // Get the HTTP method
    const method = req.method.toLowerCase();

    // Get the headers as an object
    const headers = JSON.stringify(req.headers);

    // Get the payload, if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });
    req.on('end', (data) => {
        buffer += decoder.end();

        // Choose the handler this request should go to
        const chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler
        const dataObject = {
            'trimmedPath': trimmedPath,
            'headers': headers,
            'method': method,
            'queryStringObject': queryStringObject,
            'payload': buffer
        };

        // Route the request to the handler specified in the router
        chosenHandler(data, (statusCode, payload) => {

            // Use the status code called back by the handler, or default
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

            // Use the payload called back by the handler, or default
            payload = typeof (payload) == 'object' ? payload : {};

            // Convert the payload to the string
            const payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the request path
            console.log(`Returning the response: ${statusCode} ${payloadString}`);
        });
    });
};

// Define the handlers
const handlers = {};

// Ping handler
handlers.ping = (data, callback) => {
    callback(200);
};

// Error handler
handlers.notFound = (data, callback) => {
    callback(404);
};

// Hello handler
handlers.hello = (data, callback) => {
    callback(200, {
        'message': 'hello friend!'
    });
};

// Define the routing
const router = {
    '/ping': handlers.ping,
    '/hello': handlers.hello
};