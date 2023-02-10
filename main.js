//todo lint prettier, var-let, fetch and promises alignment, exports, remove getres_auth, http name-> ``
//waitfortrips -> no brackets needed, body_authenticate -> actual calculated data and infos.
//local const usage instead global var

import dotenv from 'dotenv';
dotenv.config('/.env');
import { request } from "https";
import fetch from 'node-fetch';

const trip_param = {
    today: "0",
    last_week: "1",
    last_month: "2",
    last_year: "3"
};

const body_authenticate = {
    "username" : process.env.my_username,
    "password" : process.env.my_password
}

const post_authenticate = async (data) => {
    const url_authenticate = `https://ssoms.toyota-europe.com/authenticate`;
    const options_authenticate = {
        method: "POST",
        headers: {
            "x-tme-lc": "hu-hu",
            "x-tme-brand": "TOYOTA",
            "content-type" : "application/json"
        }
    }
    return new Promise((resolve, reject) => {
        const req = request(url_authenticate, options_authenticate, (res) => {
            //console.log('STATUS: ' + res.statusCode);
            //console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            const body = []
            res.on('data', function (chunk) {
                 //console.log('BODY: ' + chunk);
                 body.push(chunk);
                });
            res.on('end', () => {
                //const resString = Buffer.concat(body).toString()
                resolve(body);
              })
        });

        req.on('error', (e) => {
            console.error(e);
        });
        
        req.on('timeout', () => {
            req.destroy()
            reject(new Error('Request time out'))
        });

        req.write(JSON.stringify(data));

        req.end();

        //console.log(req.getHeaders());
    })

};

const get_trip_list = async (params) => {
    try
    {
        const res = await fetch(`https://cpb2cs.toyota-europe.com/api/user/${params.uuid}/cms/trips/v2/history/vin/${params.vin}/${params.time_param}`, {
            method: "GET",
            headers: {
                "x-tme-lc": "hu-hu",
                "x-tme-brand": "TOYOTA",
                "content-type" : "application/json",
                "x-tme-token" : params.token
            }
        })
        const data = await res.json();
        //console.log(res);
        //console.log(data);
        return data;
    }
    catch(error)
    {
        console.log("Error during trip list request!");
        console.log(error);
      // handle error
    }
}

const get_one_trip = async (params) => {
    try
    {
        const res = await fetch(`https://cpb2cs.toyota-europe.com/api/user/${params.uuid}/cms/trips/v2/${params.tripID}/events/vin/${params.vin}`, {
            method: "GET",
            headers: {
                "x-tme-lc": "hu-hu",
                "x-tme-brand": "TOYOTA",
                "content-type" : "application/json",
                "x-tme-token" : params.token
            }
        })
        const data = await res.json();
        return data;
    }
    catch(error)
    {
      console.log("Error during one trip request!");
      console.log(error);
      // handle error
    }
}

const waitForPromise = async (param) => {
    return await Promise.all(param).then(()=>{console.log("Waitdone!")}).catch(()=>{console.log("Error promise!")});
};


export const Toyota_data = {
    uuid: "",
    token:"",
    collect: (body) => {
        const dataAuth =
        {
            "username": body.username,
            "password": body.password
        };
        const tripIds = [];
        const tripInfos = [];
        const tripPromises = [];
        let tripListPromise = "";
        const promiseAuth = post_authenticate(dataAuth).then(value => {
            const resp_auth = JSON.parse(value);
            Toyota_data.uuid = resp_auth.customerProfile.uuid;
            Toyota_data.token = resp_auth.token;
            console.log(resp_auth);
            tripListPromise = get_trip_list({uuid: Toyota_data.uuid, vin:body.my_vin, time_param:body.time_param, token:Toyota_data.token}).then((data) => {
                //console.log(data);
                data.recentTrips.forEach(obj => {
                    tripIds.push(obj.tripId);
                });
                tripIds.forEach(tripId => {
                    tripPromises.push(get_one_trip({tripID: tripId, uuid: Toyota_data.uuid, vin:body.my_vin, token:Toyota_data.token}).then((data) => {
                        tripInfos[tripId] = data.statistics;
                    }));
                });
            });
        });
        console.log(tripPromises);
        console.log(tripInfos);
        //end of collect data

        var averageFuelConsumption = 0.0;
        var overallFuelConsumption = 0.0;
        var totalDistanceInKm = 0.0;
        Object.values(tripInfos).forEach(info => {
            totalDistanceInKm += info.totalDistanceInKm;
            averageFuelConsumption += info.averageFuelConsumptionInL*info.totalDistanceInKm;
            overallFuelConsumption += info.fuelConsumptionInL;
        })
        averageFuelConsumption = averageFuelConsumption/totalDistanceInKm;

        const varToString = varObj => Object.keys(varObj)[0]
        console.log(varToString({totalDistanceInKm}) + ": " + totalDistanceInKm + " km");
        console.log(varToString({averageFuelConsumption}) + ": " + averageFuelConsumption + " l/100km");
        console.log(varToString({overallFuelConsumption}) + ": " + overallFuelConsumption + " l");
        return body_authenticate;

    },
};

export default Toyota_data;