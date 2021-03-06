const crypto = require('crypto');
const {
  EnvCredentialsError
} = require('./errors');
const ALGORITHM = 'aes-256-cbc';

/**
 * @private
 */
class Encryptor {
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
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);

    let encrypted = cipher.update(data)
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${encrypted.toString('base64')}--${iv.toString('base64')}`;
  }

  decrypt(encryptedDataWithIV) {
    const [encryptedData, iv] = encryptedDataWithIV
      .toString()
      .split('--')
      .map(v => Buffer.from(v, 'base64'))
    const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return {
      iv,
      data: decrypted.toString()
    }
  }
}

module.exports = Encryptor