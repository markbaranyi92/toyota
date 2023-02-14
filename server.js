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
    //console.log(response);
    Toyota_data.collect(response).then(tripInfos_ => {
        console.log(tripInfos_);
        
        let averageFuelConsumption = 0.0;
        let overallFuelConsumption = 0.0;
        let totalDistanceInKm = 0.0;
        Object.values(tripInfos_).forEach(info => {
            totalDistanceInKm += info.totalDistanceInKm;
            averageFuelConsumption += info.averageFuelConsumptionInL*info.totalDistanceInKm;
            overallFuelConsumption += info.fuelConsumptionInL;
        })
        averageFuelConsumption = averageFuelConsumption/totalDistanceInKm;

        const varToString = varObj => Object.keys(varObj)[0]
        console.log(varToString({totalDistanceInKm}) + ": " + totalDistanceInKm + " km");
        console.log(varToString({averageFuelConsumption}) + ": " + averageFuelConsumption + " l/100km");
        console.log(varToString({overallFuelConsumption}) + ": " + overallFuelConsumption + " l");
        res.end(JSON.stringify({totalDistanceInKm: totalDistanceInKm, averageFuelConsumption: averageFuelConsumption, overallFuelConsumption: overallFuelConsumption}));
    }).catch(error =>{new Error('Error during collecting the trip data!')});
 });

const server = app.listen(8081, () => {
    const host = server.address().address;
    const port = server.address().port;

    dns.lookup(os.hostname(), (err, add, fam) => {
        console.log('Example app listening at http://%s:%s', add, port);
    })
});