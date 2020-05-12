const crypto = require('crypto');
const {
  EnvCredentialsError
} = require('../../src/errors');
const ALGORITHM = 'aes-256-cbc';

class DummyKmsEncryptor {
  constructor({
    env,
    masterKey
  }) {
    if (!masterKey) {
      throw new EnvCredentialsError({
        env: env,
        message: 'APP_MASTER_KEY is not provided.'
      });
    }
    this.masterKey = Buffer.from(masterKey, 'hex');
  }

  encrypt(data) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const value = this.encryptSync(data);
        resolve(value);
      }, 200);
    });
  }

  decrypt(encryptedData) {
    const resp = new Promise((resolve) => {
      setTimeout(() => {
        const value = this.decryptSync(encryptedData);
        resolve(value);
      }, 200);
    });

    return resp;
  }

  encryptSync(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);

    let encrypted = cipher.update(data)
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${encrypted.toString('base64')}--${iv.toString('base64')}`;
  }

  decryptSync(encryptedDataWithIV) {
    if (!encryptedDataWithIV.length) {
      return {
        data: ''
      };
    }

    try {
      const [encryptedData, iv] = encryptedDataWithIV
        .toString('utf8')
        .split('--')
        .map(v => Buffer.from(v, 'base64'))
      const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv);
      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return {
        iv,
        data: decrypted.toString()
      }
    } catch (err) {
      throw new EnvCredentialsError({
        env: this.env,
        message: 'Invalid encryption key or encrypted data is corrupted.',
        origMessage: err.message
      })
    }
  }
}

module.exports = DummyKmsEncryptor;