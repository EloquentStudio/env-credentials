const child_process = require('child_process');
const fs = require('fs')
const path = require('path');
const tmp = require('tmp');
const {
  EnvCredentialsError
} = require('./errors');
const Encryptor = require('./encryptor');

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
    file
  }) {
    this.env = env;
    this.dir = dir;
    this.file = this.getFileName(file);
    this.encryptor = new Encryptor({
      env,
      masterKey: masterKey || process.env.APP_MASTER_KEY
    });
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
      this.encryptedData = fs.readFileSync(tmpFile.name).toString();
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

    this.encryptedData = fs.readFileSync(inputFile).toString();
    return this.file;
  }

  /**
   * Read encrypted credentials file.
   *
   * @return {string}
   */
  get encryptedData() {
    if (fs.existsSync(this.file)) {
      return fs.readFileSync(this.file);
    }

    return '';
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

      if (this.dir && !fs.existsSync(this.dir)) {
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

    if (this.dir) {
      return path.join(this.dir, name);
    }

    return name;
  }
}

module.exports = CredentialsManager;