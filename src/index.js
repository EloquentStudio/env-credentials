const crypto = require('crypto');
const Credentials = require('./credentials');

function load({
  credentialsDir,
  credentialsFile,
  env,
  masterKey
} = {}) {
  const secrets = new Credentials({
    env,
    masterKey,
    dir: credentialsDir,
    file: credentialsFile
  }).read()

  for (const [key, value] of Object.entries(secrets)) {
    process.env[key] = value
  }
}

function edit({
  credentialsDir,
  credentialsFile,
  env,
  masterKey
} = {}) {
  new Credentials({
    env,
    masterKey,
    dir: credentialsDir,
    file: credentialsFile
  }).update()
}

function generateKey() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  load,
  edit,
  generateKey
}
