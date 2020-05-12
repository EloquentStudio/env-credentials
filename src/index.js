const path = require('path');
const CredentialsManager = require('./credentials_manager');
const VaultEncryptor = require('./vault_encryptor');
const {
  isPromise
} = require('./util');

/**
 * Default envionment name.
 *
 * @private
 * @type {string}
 */
const DEFAULT_ENV = 'development';

/**
 * Default credentials files directory.
 *
 * @private
 * @type {string}
 */
const DEFAULT_CREDENTIALS_DIR = 'credentials';

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
 * @param {object|undefined} override - Override env variables.
 * @return {object} Decrypted credentials.
 *
 */
function load({
  credentialsDir,
  credentialsFile,
  env,
  masterKey,
  override,
  kms
} = {}) {
  [env, credentialsDir] = setDefaultOptions({
    env,
    credentialsDir
  });

  const resp = new CredentialsManager({
    env,
    masterKey,
    dir: credentialsDir,
    file: credentialsFile,
    kms: kms
  }).read()

  if (isPromise(resp)) {
    return new Promise((resolve, reject) => {
      resp.then(secrets => {
        setEnv(secrets, override);
        resolve(secrets);
      }).catch(reject);
    });
  }

  return setEnv(resp, override);
}

function setEnv(secrets, override) {
  for (const [key, value] of Object.entries(secrets)) {
    process.env[key] = value
  }

  if (override) {
    for (const [key, value] of Object.entries(override)) {
      process.env[key] = value;
      secrets[key] = value;
    }
  }

  return secrets;
}

function edit({
  credentialsDir,
  credentialsFile,
  env,
  masterKey,
  kms: kms
} = {}) {
  [env, credentialsDir] = setDefaultOptions({
    env,
    credentialsDir
  });

  new CredentialsManager({
    env,
    masterKey,
    dir: credentialsDir,
    file: credentialsFile,
    kms: kms
  }).update();
}

function encryptFile({
  inFile,
  outFile,
  masterKey,
  credentialsDir,
}) {
  if (!outFile) {
    outFile = `${path.basename(inFile)}.enc`;
  }

  return new CredentialsManager({
    masterKey,
    file: outFile,
    dir: credentialsDir
  }).encryptFile(inFile);
}

/**
 * Read encrypted file.
 *
 * @param {Object} options
 * @param {string|undefined} options.masterKey - Encryption master key.
 *  Default value loaded from environment variable 'APP_MASTER_KEY'.
 * @param {string} options.file - A encrypted file name or file path.
 * @param {string|undefined} options.credentialsDir - Folder of stored encrypted
 *  files.
 * @return {Object} Decrypted key-values.
 */
function read({
  masterKey,
  file,
  credentialsDir,
}) {
  return new CredentialsManager({
    masterKey,
    dir: credentialsDir,
    file: file
  }).read();
}

function generateKey() {
  return require('crypto').randomBytes(32).toString('hex');
}

function setDefaultOptions({
  env,
  credentialsDir
}) {
  env = env || process.env.NODE_ENV || DEFAULT_ENV;

  if (credentialsDir === undefined) {
    credentialsDir = DEFAULT_CREDENTIALS_DIR;
  }

  return [env, credentialsDir];
}

module.exports = {
  load,
  edit,
  encryptFile,
  read,
  generateKey,
  VaultEncryptor
};