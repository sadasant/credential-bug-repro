const express = require('express');
const identity = require('@azure/identity');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello world!');
});

// Fails: explicitly set AZURE_CLIENT_ID
app.get('/repro1', async (req, res) => {

  const cred = new identity.DefaultAzureCredential({
    managedIdentityClientId: process.env.AZURE_CLIENT_ID
  });

  // This call will take ~120s and ultimately throw
  await cred.getToken('https://management.azure.com/.default'); 
  res.send('OK!');
});

// Fails: let DefaultAzureCredential handle it via env var
app.get('/repro2', async (req, res) => {

  const cred = new identity.DefaultAzureCredential();

  // This call will take ~120s and ultimately throw
  await cred.getToken('https://management.azure.com/.default');
  res.send('OK!');
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


app.listen(80, '0.0.0.0');
console.log('started server');