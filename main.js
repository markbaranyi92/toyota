import { request } from 'https';
import fetch from 'node-fetch';

const trip_param = {
  today: '0',
  last_week: '1',
  last_month: '2',
  last_year: '3',
};

const body_authenticate = {
  username: process.env.my_username,
  password: process.env.my_password,
};

const post_authenticate = async (data) => {
  const url_authenticate = `https://ssoms.toyota-europe.com/authenticate`;
  const options_authenticate = {
    method: 'POST',
    headers: {
      'x-tme-lc': 'hu-hu',
      'x-tme-brand': 'TOYOTA',
      'content-type': 'application/json',
    },
  };
  return new Promise((resolve, reject) => {
    const req = request(url_authenticate, options_authenticate, (res) => {
      //console.log('STATUS: ' + res.statusCode);
      //console.log('HEADERS: ' + JSON.stringify(res.headers));
      res.setEncoding('utf8');
      const body = [];
      res.on('data', function (chunk) {
        //console.log('BODY: ' + chunk);
        body.push(chunk);
      });
      res.on('end', () => {
        //const resString = Buffer.concat(body).toString()
        resolve(body);
      });
    });

    req.on('error', (e) => {
      console.error(e);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request time out'));
    });

    req.write(JSON.stringify(data));

    req.end();

    //console.log(req.getHeaders());
  });
};

const get_trip_list = async (params) => {
  try {
    const res = await fetch(
      `https://cpb2cs.toyota-europe.com/api/user/${params.uuid}/cms/trips/v2/history/vin/${params.vin}/${params.time_param}`,
      {
        method: 'GET',
        headers: {
          'x-tme-lc': 'hu-hu',
          'x-tme-brand': 'TOYOTA',
          'content-type': 'application/json',
          'x-tme-token': params.token,
        },
      },
    );
    const data = await res.json();
    //console.log(res);
    //console.log(data);
    return data;
  } catch (error) {
    console.log('Error during trip list request!');
    console.log(error);
    // handle error
  }
};

const get_one_trip = async (params) => {
  try {
    const res = await fetch(
      `https://cpb2cs.toyota-europe.com/api/user/${params.uuid}/cms/trips/v2/${params.tripID}/events/vin/${params.vin}`,
      {
        method: 'GET',
        headers: {
          'x-tme-lc': 'hu-hu',
          'x-tme-brand': 'TOYOTA',
          'content-type': 'application/json',
          'x-tme-token': params.token,
        },
      },
    );
    const data = await res.json();
    return data;
  } catch (error) {
    console.log('Error during one trip request!');
    console.log(error);
    // handle error
  }
};

export const toyotaData = {
  uuid: '',
  token: '',
  collect: async (body) => {
    const dataAuth = {
      username: body.username,
      password: body.password,
    };
    //const tripIds = [];
    const tripInfos = [];
    const tripPromises = [];
    return new Promise((resolve, reject) => {
      post_authenticate(dataAuth)
        .then((value) => {
          const resp_auth = JSON.parse(value);
          toyotaData.uuid = resp_auth.customerProfile.uuid;
          toyotaData.token = resp_auth.token;
          //console.log(resp_auth);
          get_trip_list({
            uuid: toyotaData.uuid,
            vin: body.my_vin,
            time_param: body.time_param,
            token: toyotaData.token,
          })
            .then(async (dataTripList) => {
              const tripIds = dataTripList.recentTrips.map((obj) => obj.tripId);
              const tripList = dataTripList.recentTrips.reduce((acc, cur) => {
                acc[cur.tripId] = cur;
                return acc;
              }, {});
              //console.log(tripList);
              //console.log(tripIds);
              tripIds.forEach((tripId) => {
                tripPromises.push(
                  get_one_trip({
                    tripID: tripId,
                    uuid: toyotaData.uuid,
                    vin: body.my_vin,
                    token: toyotaData.token,
                  })
                    .then((dataOneTrip) => {
                      tripInfos[tripId] = {
                        tripData: tripList[tripId],
                        statistics: dataOneTrip.statistics,
                      };
                      //console.log(tripInfos[tripId]);
                    })
                    .catch((error) => {
                      new Error(
                        `Error during collecting the trip info for ${tripId}`,
                      );
                    }),
                );
              });
              await Promise.all(tripPromises);
              resolve(tripInfos);
            })
            .catch((error) => {
              new Error('Error during collecting the trip list!');
            });
        })
        .catch((error) => {
          new Error('Error during authentication!');
        });
    });
    //end of collect data
  },
};

export default toyotaData;
