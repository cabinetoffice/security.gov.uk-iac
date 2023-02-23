require('source-map-support/register');
const serverlessExpress = require('@vendia/serverless-express');

const { KMSClient, DecryptCommand } = require('@aws-sdk/client-kms');

const functionName = process.env['AWS_LAMBDA_FUNCTION_NAME'];
const sssEnc = process.env['SESSION_SECRET'];

let initialised = false;
let SESSION_SECRET = "";
let serverlessExpressInstance;

async function setup (event, context) {
  if (!initialised) {
    // Decrypt code should run once and variables stored outside of the
    // function handler so that these are decrypted once per container
    const kms = new KMSClient({region: 'eu-west-2'});
    
    try {
      const sssReq = {
        CiphertextBlob: Buffer.from(sssEnc, 'base64'),
        EncryptionContext: { LambdaFunctionName: functionName },
      };
      const command = new DecryptCommand(sssReq);
      const sssData = await kms.send(command);
      const sssDecrypted = sssData.Plaintext.toString('ascii');
      if (typeof(sssDecrypted) == "string") {
        SESSION_SECRET = sssDecrypted;
      }
    } catch (err) {
      console.log('Decrypt error:', err);
    }

    initialised = true;
  }

  if (SESSION_SECRET.length == 0) { return false; }

  process.env['SESSION_SECRET'] = SESSION_SECRET;
  const app = require('./app');
  app.SESSION_SECRET = SESSION_SECRET;

  serverlessExpressInstance = serverlessExpress({ app });
  return serverlessExpressInstance(event, context);
}

function handler (event, context) {
  if (serverlessExpressInstance) {
    return serverlessExpressInstance(event, context);
  }
  return setup(event, context);
}

exports.handler = handler;
