const child_process = require('child_process');
const fs = require('fs')
const path = require('path');
const tmp = require('tmp');
const {
  EnvCredentialsError
} = require('./errors');
const Encryptor = require('./encryptor');
const {
  isPromise
} = require('./util');

/**
 * Read encrypted credentials file and update encrypted credentials.
 *
 * @private
 */
class CredentialsManager {
  constructor({
    env,
    masterKey,
    dir,
    file,
    kms
  }) {
    this.env = env;
    this.dir = dir;
    this.file = this.getFileName(file);

    if (kms) {
      this.encryptor = kms;
    } else {
      this.encryptor = new Encryptor({
        env,
        masterKey: masterKey || process.env.APP_MASTER_KEY
      });
    }
  }

  /**
   * Read encrypted credentials file and decrypt.
   *
   * @return {object|Promise}
   * @throws {EnvCredentialsError} If invalid encryption key or
   *  invalid JSON format.
   */
  read() {
    const encryptedData = this.getEncryptedData();
    const resp = this.encryptor.decrypt(encryptedData);

    if (isPromise(resp)) {
      return new Promise((resolve, reject) => {
        resp.then(v => resolve(this.parseJSON(v.data))).catch(reject);
      });
    }

    return this.parseJSON(resp.data);
  }

  parseJSON(data) {
    if (!data) {
      return {};
    }

    try {
      return JSON.parse(data);
    } catch (err) {
      throw new EnvCredentialsError({
        env: this.env,
        message: 'Invalid JSON format in decrypted data.',
        origMessage: err.message
      })
    }
  }

  /**
   *  Update credentials file.
   *
   * @param {object|undefined|Promise} secrets
   */
  async update(secrets = null) {
    // Direct update if credentials data is provided, without using editor.
    if (secrets) {
      await this.setEncryptedData(secrets);
      return;
    }

    const obj = await this.read();
    const tmpFile = tmp.fileSync();

    fs.writeFileSync(tmpFile.name, JSON.stringify(obj, null, 4));

    const editor = process.env.EDITOR || 'vi';
    const child = child_process.spawn(editor, [tmpFile.name], {
      stdio: 'inherit'
    });

    child.on('exit', async () => {
      await this.setEncryptedData(
        fs.readFileSync(tmpFile.name).toString('utf8')
      );
      tmpFile.removeCallback();
    });
  }

  /**
   * Encrypt file.
   *
   * @param {string} inputFile
   */
  encryptFile(inputFile) {
    if (!fs.existsSync(inputFile)) {
      throw new EnvCredentialsError({
        env: '',
        message: `'${inputFile}' is not exists.`,
      })
    }

    this.setEncryptedData(fs.readFileSync(inputFile).toString('utf8'));
    return this.file;
  }

  /**
   * Read encrypted credentials file.
   *
   * @return {string}
   */
  getEncryptedData() {
    if (fs.existsSync(this.file)) {
      return fs.readFileSync(this.file).toString('utf8');
    }

    return '';
  }

  /**
   * Write encrypted credentials to file.
   *
   * @param {object|string} data
   * @throws {EnvCredentialsError} If invalid JSON data format.
   */
  setEncryptedData(data) {
    try {
      if (typeof data === 'string') {
        JSON.parse(data);
      } else {
        data = JSON.stringify(data, null, 4)
      }

      if (this.dir && !fs.existsSync(this.dir)) {
        fs.mkdirSync(this.dir);
      }

      const resp = this.encryptor.encrypt(data);

      if (isPromise(resp)) {
        return new Promise((resolve, reject) => {
          resp.then(data => {
            fs.writeFileSync(this.file, data);
            resolve();
          }).catch(reject);
        });
      }

      fs.writeFileSync(this.file, resp);
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

    if (this.dir) {
      return path.join(this.dir, name);
    }

    return name;
  }
}

module.exports = CredentialsManager;