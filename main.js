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
const my_vin = "SB1Z93BE10E261393";

var uuid = "";
var token = "";
var resp_auth = {};
var promise_auth;
const tripIds = [];
var promise_trip_list;
const trip_infos = [];
const promises_trip = [];

const post_authenticate = async (data) => {
    const url_authenticate = "https://ssoms.toyota-europe.com/authenticate";
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

const getres_auth = async (auth_data) => { 
    try {
        const result = await post_authenticate(auth_data);
        return result;
      } catch(error) {
        // handle error
      }

};

const get_trip_list = async (param) => {
    try
    {
        await Promise.all([promise_auth]);
        const res = await fetch("https://cpb2cs.toyota-europe.com/api/user/"+uuid+"/cms/trips/v2/history/vin/"+my_vin+"/"+param, {
            method: "GET",
            headers: {
                "x-tme-lc": "hu-hu",
                "x-tme-brand": "TOYOTA",
                "content-type" : "application/json",
                "x-tme-token" : token
            }
        })
        const data = await res.json();
        //console.log(res);
        //console.log(data);
        return data;
    }
    catch(error)
    {
      // handle error
    }
}

const get_one_trip = async (tripId) => {
    try
    {
        await Promise.all([promise_trip_list]);
        const res = await fetch("https://cpb2cs.toyota-europe.com/api/user/"+uuid+"/cms/trips/v2/"+tripId+"/events/vin/"+my_vin, {
            method: "GET",
            headers: {
                "x-tme-lc": "hu-hu",
                "x-tme-brand": "TOYOTA",
                "content-type" : "application/json",
                "x-tme-token" : token
            }
        })
        const data = await res.json();
        return data;
    }
    catch(error)
    {
      // handle error
    }
}

const waitForTrips = async () => {
    await Promise.all(promises_trip);
};


export const Toyota_data = {
    collect: (body) => {
        const dataAuth =
        {
            "username": body.username,
            "password": body.password
        }
        promise_auth = getres_auth(dataAuth).then(value =>{
            resp_auth = JSON.parse(value);
            uuid = resp_auth.customerProfile.uuid;
            token = resp_auth.token;
            console.log(resp_auth);
            console.log(uuid);
            console.log(token);
        });
        promise_trip_list = get_trip_list(body.time_param).then((data) => {
            //console.log(data);
            data.recentTrips.forEach(obj => {
                tripIds.push(obj.tripId);
            });
        });
        tripIds.forEach(tripId => {
            promises_trip.push(get_one_trip(tripId).then((data) =>{
                trip_infos[tripId] = data.statistics;
            }));
        });
        waitForTrips().then(() => {
            console.log(trip_infos);
            //end of collect data
    
            var averageFuelConsumption = 0.0;
            var overallFuelConsumption = 0.0;
            var totalDistanceInKm = 0.0;
            Object.values(trip_infos).forEach(info => {
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
        });

    },
};

export default Toyota_data;