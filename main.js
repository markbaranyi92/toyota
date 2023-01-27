import { request } from "https";
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

const trip_param = {
    today: "0",
    last_week: "1",
    last_month: "2",
    last_year: "3"
};

const body_authenticate = {
    "username" : process.env.username,
    "password" : process.env.password
}
const my_vin = "SB1Z93BE10E261393";

console.log(body_authenticate);

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

var uuid = "";
var token = "";
var vin = "";
var resp_auth = {};

const getres_auth = async () => { 
    try {
        const result = await post_authenticate(body_authenticate);
        return result;
      } catch(error) {
        // handle error
      }

};

const promise_auth = getres_auth().then(value =>{
    resp_auth = JSON.parse(value);
    uuid = resp_auth.customerProfile.uuid;
    token = resp_auth.token;
    console.log(resp_auth);
    console.log(uuid);
    console.log(token);
});

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

const tripIds = [];

const promise_trip_list = get_trip_list(trip_param.last_week).then((data) => {
    //console.log(data);
    data.recentTrips.forEach(obj => {
        tripIds.push(obj.tripId);
    });
});

await Promise.all([promise_trip_list]);

const get_one_trip = async (tripId) => {
    try
    {
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

const trip_infos = [];
const promises_trip = [];
tripIds.forEach(tripId => {
    promises_trip.push(get_one_trip(tripId).then((data) =>{
        trip_infos[tripId] = data.statistics;
    }));
});

await Promise.all(promises_trip);
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
