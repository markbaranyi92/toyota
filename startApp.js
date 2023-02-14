import dotenv from 'dotenv';
dotenv.config('/.env');
import { server as startServer } from './server.js';

export default() => startServer();

export const errorHandler = (error) => {
    console.info(error);
    console.log('------------ EXIT ------------');
    process.exit(1);
  };