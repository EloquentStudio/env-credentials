const crypto = require('crypto');
const CredentialsManager = require('./credentials_manager');

/**
 * Load credentials from encrypted file and set credentials as
 * environment variables.
 *
 * @param {Object} options
 * @param {string} [options.credentialsDir=credentials] - Directory of stored encrypted credentials.
 * @param {string} [options.credentialsFile] - Custom encrypted credentials file.
 * @param {string} [options.env=development] - App environment. Default 'development'.
 * @param {string} [options.masterKey] - Master key for decryption. Default value loaded
 *  from environment variable 'APP_MASTER_KEY'
 * @return {object} Decrypted credentials.
 *
 */
function load({
  credentialsDir,
  credentialsFile,
  env,
  masterKey
} = {}) {
  const secrets = new CredentialsManager({
    env,
    masterKey,
    dir: credentialsDir,
    file: credentialsFile
  }).read()

  for (const [key, value] of Object.entries(secrets)) {
    process.env[key] = value
  }

  return secrets;
}

function edit({
  credentialsDir,
  credentialsFile,
  env,
  masterKey,
} = {}) {
  new CredentialsManager({
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