const assert = require('assert');

const {
  generateKey,
} = require('../src');
const Encryptor = require('../src/encryptor');

describe('Encryptor', () => {
  let masterKey, encryptor;

  beforeEach(() => {
    masterKey = generateKey();
    encryptor = new Encryptor(masterKey);
  });

  it('should encrypt and descrypt data', () => {
    const creds = {
      'KEY1': 'VALUE1',
      'KEY2': 'VALUE2',
      'KEY3': 3,
    };

    const encryptedData = encryptor.encrypt(JSON.stringify(creds));
    assert.ok(typeof encryptedData === 'string');

    const {
      iv,
      data
    } = encryptor.decrypt(encryptedData);
    assert.ok(typeof data === 'string');
    assert.ok(iv);

    const decryptedCreds = JSON.parse(data);
    assert.strictEqual(decryptedCreds.KEY1, 'VALUE1');
    assert.strictEqual(decryptedCreds.KEY2, 'VALUE2');
    assert.strictEqual(decryptedCreds.KEY3, 3);
  });

  it('should throw an error for invalid encryption key', () => {
    const creds = {
      'KEY1': 'VALUE1'
    };

    const encryptedData = (new Encryptor(generateKey())).encrypt(JSON.stringify(creds));
    assert.ok(typeof encryptedData === 'string');

    assert.throws(() => {
      encryptor.decrypt(encryptedData)
    });
  });
});