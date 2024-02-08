/*
 * Server
 * ****** */

// Import Module
const express = require('express'),
    https = require('https'),
    fs = require('fs'),
    dotenv = require('dotenv'),
    path = require('path'),
// awsIot = require('aws-iot-client-sdk'),
// mqtt = require('mqtt'),
app = express();
PUBLIC_PATH = path.join(__dirname, "public")

// Initialize the mqtt client
// const endpoint = 'a11tiojfrl1fep-ats.iot.us-east-1.amazonaws.com',
//     port = 8883,
//     options = {
//         clientId: 'Watch1',
//         key: fs.readFileSync('./mqtt_certs/private.pem.key'),
//         cert: fs.readFileSync('./mqtt_certs/certificate.pem.crt'),
//         ca: [fs.readFileSync('./mqtt_certs/AmazonRootCA1.pem')],
//         protocol: 'mqtts'
//     };

// const client = mqtt.connect(`wss://${endpoint}:${port}/mqtt`, options);

// const client = awsIot.device({
//         clientId: 'Watch1',
//         host: 'a11tiojfrl1fep-ats.iot.us-east-1.amazonaws.com',
//         port: 8883,
//         keyPath: './mqtt_certs/private.pem.key',
//         certPath: './mqtt_certs/certificate.pem.crt',
//         caPath: './mqtt_certs/AmazonRootCA1.pem',
//         debug: true,
//         // region: 'us-east-1',
//     });

// const topic = 'immersivity/data';

// client.on("connect", function () {
//     console.log("Connected to MQTT broker");
//     console.log(`Trying to subscribe to ${topic} ...`)
//     client.subscribe(topic);
//     client.end();
//     // client.publish(topic, JSON.stringify({temperature: 36.37728007591633, bpm: 88.0, oxysaturation: 98.59272646768603, luminosity: 95.0}));
// });

// client.on('error', function (error) {
//     console.log(error)
// })

// client.on("close", function () {
//     console.log("Connection to MQTT broker closed");
//     client.reconnect();
// });

// client.on("message", function (topic, message) {
//     console.log(`Received message on topic ${topic}: ${message}`);
// });

// Variable environement (.env)
dotenv.config();
const { PORT } = process.env;
// Use CORS
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    return next();
});
// File static
app.use(express.static(path.join(__dirname, 'public')));


// Route
app.get('/', function (req, res) {
    res.sendFile(path.join(PUBLIC_PATH, "index.html"))
})

// Run
const server = https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}, app);
server.listen(PORT, () => { console.log(`listening on ${PORT}`) });
