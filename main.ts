// this is the main entry point of the application
import * as dotenv from './dotenv';
dotenv.loadEnv();
import * as http from 'http';
import * as migrator from './migrator';
import * as logic from './logic';
import logger from './logger';

// listen for unhandled rejection
['unhandledRejection', 'uncaughtException'].forEach((event) =>
  process.on(event, async (error) => {
    logger.errorLogger(error);
  })
);

async function main() {
  // migrate the database
  await migrator.migrate();

  let timeoutId: NodeJS.Timeout;

  // register the post capture processing
  logic.postCaptureProcessing();

  // capture events
  logic
    .captureEvents()
    .catch((error) => {
      logger.errorLogger(error);
    })
    .finally(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // this process simulates a repeatedly scheduled process with long polling intervals
      // an alternative would be to use lambda functions or a cron job
      timeoutId = setTimeout(() => {
        main();
      }, 1000 * 30); // this can be configured as necessary
    });
}

// block the runtime
http
  .createServer((req, res) => {
    main();
    res.writeHead(200);
  })
  .listen(3000);

// send a request to the server to start the process
http.get('http://localhost:3000', (res) => {
  logger.info('Process triggered');
});
