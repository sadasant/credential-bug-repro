const express = require('express');
const identity = require('./identity');
const app = express();
const child_process = require("child_process");

app.get('/', (req, res) => {
  res.send('Hello world!');
});

app.get('/curl1', async (req, res) => {
  const IDENTITY_ENDPOINT = process.env.IDENTITY_ENDPOINT;
  const IDENTITY_HEADER = process.env.IDENTITY_HEADER;
  const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
  const MSI_ENDPOINT = process.env.MSI_ENDPOINT;
  const MSI_SECRET = process.env.MSI_SECRET;

  let message = [
    `IDENTITY_ENDPOINT ${IDENTITY_ENDPOINT}`,
    `IDENTITY_HEADER ${IDENTITY_HEADER}`,
    `AZURE_CLIENT_ID ${AZURE_CLIENT_ID}`,
    `MSI_ENDPOINT ${MSI_ENDPOINT}`,
    `MSI_SECRET ${MSI_SECRET}`
  ];

  let response = child_process.execSync(`echo "test"`, { encoding: "utf-8" });
  message.push(`RESPONSE test: ${response}`)

  response = child_process.execSync(`curl --insecure "${IDENTITY_ENDPOINT}?client_id=${AZURE_CLIENT_ID}&api-version=2019-08-01&resource=https://vault.azure.net/" -H "X-IDENTITY-HEADER: ${IDENTITY_HEADER}"`, { encoding: "utf-8" });
  message.push(`RESPONSE1: ${response}`)

  response = child_process.execSync(`curl --insecure "${MSI_ENDPOINT}?clientid=${AZURE_CLIENT_ID}&api-version=2017-09-01&resource=https://vault.azure.net/" -H "secret: ${MSI_SECRET}"`, { encoding: "utf-8" });
  message.push(`RESPONSE2: ${response}`)

  const env = process.env;

  message.push(`fabricMsi`, Boolean(env.IDENTITY_ENDPOINT && env.IDENTITY_HEADER && env.IDENTITY_SERVER_THUMBPRINT));
  message.push(`appServiceMsi2019`, Boolean(env.IDENTITY_ENDPOINT && env.IDENTITY_HEADER));
  message.push(`appServiceMsi2017`, Boolean(env.MSI_ENDPOINT && env.MSI_SECRET));
  message.push(`cloudShellMsi`, Boolean(process.env.MSI_ENDPOINT));

  res.send(message.join("\n<br/>\n"));
});

app.get('/fabric-curl', async (req, res) => {
  const IDENTITY_ENDPOINT = process.env.IDENTITY_ENDPOINT;
  const IDENTITY_HEADER = process.env.IDENTITY_HEADER;
  const IDENTITY_SERVER_THUMBPRINT = process.env.IDENTITY_SERVER_THUMBPRINT;

  let message = [
    `IDENTITY_ENDPOINT ${IDENTITY_ENDPOINT}`,
    `IDENTITY_HEADER ${IDENTITY_HEADER}`,
    `IDENTITY_SERVER_THUMBPRINT ${IDENTITY_SERVER_THUMBPRINT}`
  ];

  let response = child_process.execSync(`echo "test"`, { encoding: "utf-8" });
  message.push(`RESPONSE test: ${response}`)

  response = child_process.execSync(`curl --insecure "${IDENTITY_ENDPOINT}?client_id=${AZURE_CLIENT_ID}&api-version=2019-07-01-preview&resource=https://vault.azure.net/" -H "Secret: ${IDENTITY_HEADER}"`, { encoding: "utf-8" });
  message.push(`RESPONSE1: ${response}`)

  const env = process.env;

  message.push(`fabricMsi`, Boolean(env.IDENTITY_ENDPOINT && env.IDENTITY_HEADER && env.IDENTITY_SERVER_THUMBPRINT));
  message.push(`appServiceMsi2019`, Boolean(env.IDENTITY_ENDPOINT && env.IDENTITY_HEADER));
  message.push(`appServiceMsi2017`, Boolean(env.MSI_ENDPOINT && env.MSI_SECRET));
  message.push(`cloudShellMsi`, Boolean(process.env.MSI_ENDPOINT));

  res.send(message.join("\n<br/>\n"));
});

// Fails: explicitly set AZURE_CLIENT_ID
app.get('/repro1', async (req, res) => {
  try {
    const cred = new identity.DefaultAzureCredential({
      managedIdentityClientId: process.env.AZURE_CLIENT_ID
    });
    // This call will take ~120s and ultimately throw
    await cred.getToken('https://management.azure.com/.default'); 
    res.send('OK!');
  } catch(e) {
    res.send(e.message);
  }
});

// Fails: let DefaultAzureCredential handle it via env var
app.get('/repro2', async (req, res) => {
  try {
    const cred = new identity.DefaultAzureCredential();
    // This call will take ~120s and ultimately throw
    await cred.getToken('https://management.azure.com/.default');
    res.send('OK!');
  } catch(e) {
    res.send(e.message);
  }
});

// Works: explicitly use ManagedIdentityCredential w/ clientId param
// Negative dev experience, can't test locally
app.get('/workaround1', async (req, res) => {

  const cred = new identity.ManagedIdentityCredential(process.env.AZURE_CLIENT_ID);
  await cred.getToken('https://management.azure.com/.default');
  res.send('OK!');
});

// Works: explicitly use ChainedTokenCredential + ManagedIdentityCredential w/ clientId param
// Works in both dev/prod, but we're just reinventing DefaultAzureCredential w/o the bug
app.get('/workaround2', async (req, res) => {

  const cred = new identity.ChainedTokenCredential(
    new identity.EnvironmentCredential(),
    new identity.ManagedIdentityCredential(process.env.AZURE_CLIENT_ID),
    new identity.AzureCliCredential(),
  );
  await cred.getToken('https://management.azure.com/.default');
  res.send('OK!');
});

// For bug 11595:
// - Use port 8080.
// - docker build --no-cache -t ghcr.io/sadasant/credential-bug-repro .
// - docker push ghcr.io/sadasant/credential-bug-repro:latest
// app.listen(8080);

// For service fabric, use 80.
app.listen(80);

console.log('started server');