
import initapp from './app.js';

export const port = 8081;

export const server = async () => {
    const app = initapp();
    app.listen(port, listenMessage);
};

export const listenMessage = () => {
    const env = process.env.NODE_ENV || 'development';
    console.log(`🚀 Server started on port ${port} (${env})`);
  };