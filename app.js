import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';
import bodyParser from 'body-parser';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { toyotaData } from './main.js';
import helmet from 'helmet';

export default () => {
  // Create application/x-www-form-urlencoded parser
  const urlencodedParser = bodyParser.urlencoded({ extended: false });
  const app = express();
  app.use(helmet());

  app.get('/', function (req, res) {
    res.sendFile(__dirname + '/pages' + '/index.htm');
  });

  app.post('/process_post', urlencodedParser, function (req, res) {
    const response = {
      username: req.body.username,
      password: req.body.password,
      my_vin: req.body.my_vin,
      time_param: req.body.time_param,
    };
    //console.log(response);
    toyotaData
      .collect(response)
      .then((tripInfos_) => {
        let averageFuelConsumption = 0.0;
        let overallFuelConsumption = 0.0;
        let totalDistanceInKm = 0.0;
        Object.values(tripInfos_).forEach((info) => {
          totalDistanceInKm += info.totalDistanceInKm;
          averageFuelConsumption +=
            info.averageFuelConsumptionInL * info.totalDistanceInKm;
          overallFuelConsumption += info.fuelConsumptionInL;
        });
        averageFuelConsumption = averageFuelConsumption / totalDistanceInKm;

        const varToString = (varObj) => Object.keys(varObj)[0];
        console.log(
          varToString({ totalDistanceInKm }) + ': ' + totalDistanceInKm + ' km',
        );
        console.log(
          varToString({ averageFuelConsumption }) +
            ': ' +
            averageFuelConsumption +
            ' l/100km',
        );
        console.log(
          varToString({ overallFuelConsumption }) +
            ': ' +
            overallFuelConsumption +
            ' l',
        );
        // Prepare output in JSON format and send
        res.end(
          JSON.stringify({
            tripInfos: Object.assign({}, tripInfos_),
            totalDistanceInKm: totalDistanceInKm,
            averageFuelConsumption: averageFuelConsumption,
            overallFuelConsumption: overallFuelConsumption,
          }),
        );
      })
      .catch((error) => {
        console.log(error);
      });
  });

  return app;
};
