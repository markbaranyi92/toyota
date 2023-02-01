import express from 'express';
import bodyParser from 'body-parser';
import dns from 'dns';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)
import {Toyota_data} from './main.js';
const app = express();

// Create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false });

app.get('/', function (req, res) {
    res.sendFile( __dirname + "/pages" + "/index.htm" );
 });

 app.post('/process_post', urlencodedParser, function (req, res) {
    // Prepare output in JSON format
    const response = {
       username:    req.body.username,
       password:    req.body.password,
       my_vin:      req.body.my_vin,
       time_param:  req.body.time_param
    };
    console.log(response);
    res.end(JSON.stringify(Toyota_data.collect(response)));
 });

const server = app.listen(8081, () => {
    const host = server.address().address;
    const port = server.address().port;

    dns.lookup(os.hostname(), (err, add, fam) => {
        console.log('Example app listening at http://%s:%s', add, port);
    })
});