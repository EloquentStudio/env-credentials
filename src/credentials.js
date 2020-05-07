const child_process = require('child_process');
const fs = require('fs')
const path = require('path');
const tmp = require('tmp');
const {
  EnvCredentialsError
} = require('./errors');
const Encryptor = require('./encryptor');

/**
 * Default envionment name.
 *
 * @type {string}
 */
const DEFAULT_ENV = 'development';

/**
 * Default credentials files directory.
 *
 * @type {string}
 */
const DEFAULT_CREDENTIALS_DIR = 'credentials'

/**
 * Read encrypted credentials file and update encrypted credentials.
 *
 * @class
 */
class Credentials {
  constructor({
    env,
    masterKey,
    dir,
    file
  }) {
    this.env = env || process.env.NODE_ENV || DEFAULT_ENV;
    this.masterKey = masterKey || process.env.APP_MASTER_KEY;

    if (!this.masterKey) {
      throw new EnvCredentialsError({
        env: this.env,
        message: 'APP_MASTER_KEY is not provided.'
      });
    }

    this.dir = dir || DEFAULT_CREDENTIALS_DIR;
    this.file = this.getFileName(file);
    this.encryptor = new Encryptor(this.masterKey);
  }

  /**
   * Read encrypted credentials file and decrypt.
   *
   * @return {object}
   * @throws {EnvCredentialsError} If invalid encryption key.
   */
  read() {
    try {
      const encryptedData = this.encryptedData;

      if (!encryptedData.length) {
        return {};
      }

      const {
        data
      } = this.encryptor.decrypt(encryptedData);

      return JSON.parse(data)
    } catch (e) {
      throw new EnvCredentialsError({
        env: this.env,
        message: 'Invalid encryption key or encrypted data is corrupted.',
        origMessage: e.message
      })
    }
  }

  /**
   *  Update credentials file.
   *
   * @param {object|undefined} secrets
   */
  update(secrets = null) {
    // Direct update if credentials data is provided, without using editor.
    if (secrets) {
      this.encryptedData = secrets
      return
    }

    const obj = this.read();
    const tmpFile = tmp.fileSync();

    fs.writeFileSync(tmpFile.name, JSON.stringify(obj, null, 4));

    const editor = process.env.EDITOR || 'vi';
    const child = child_process.spawn(editor, [tmpFile.name], {
      stdio: 'inherit'
    });

    child.on('exit', () => {
      this.encryptedData = fs.readFileSync(tmpFile.name)
      tmpFile.removeCallback();
    });
  }

  /**
   * Read encrypted credentials file.
   *
   * @return {string}
   */
  get encryptedData() {
    if (fs.existsSync(this.file)) {
      return fs.readFileSync(this.file)
    }

    return ''
  }

  /**
   * Write encrypted credentials to file.
   *
   * @param {object=|string=} data
   * @throws {EnvCredentialsError} If invalid JSON data format.
   */
  set encryptedData(data) {
    try {
      if (typeof data === 'string') {
        JSON.parse(data);
      } else {
        data = JSON.stringify(data, null, 4)
      }

      if (!fs.existsSync(this.dir)) {
        fs.mkdirSync(this.dir);
      }

      fs.writeFileSync(this.file, this.encryptor.encrypt(data));
    } catch (e) {
      throw new EnvCredentialsError({
        env: this.env,
        message: 'Invalid JSON data format.',
        origMessage: e.message
      })
    }
  }

  /**
   * Get encrypted credentials file name based on environment.
   *
   * @param {string|undefined} name - File name. Optional.
   * @return {string}
   */
  getFileName(name) {
    const names = {
      development: 'dev',
      production: 'prod',
      test: 'test',
      stage: 'stage'
    }

    if (!name) {
      name = `credentials.${names[this.env] || this.env}.json.enc`
    }

    return path.join(this.dir, name);
  }
}

module.exports = Credentials;