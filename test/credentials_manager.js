const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  generateKey,
} = require('../src');
const CredentialsManager = require('../src/credentials_manager');

describe('Credentials', () => {
  let masterKey, credentialsMgr;
  const credentialsDir = 'credentials';

  function cleanupFiles() {
    fs.rmdirSync(credentialsDir, {
      recursive: true
    });
  }

  beforeEach(() => {
    cleanupFiles();
    delete process.env.NODE_ENV;
    delete process.env.APP_MASTER_KEY;

    masterKey = generateKey()
    credentialsMgr = new CredentialsManager({
      env: 'test',
      dir: credentialsDir,
      masterKey
    });
  });

  afterEach(cleanupFiles);

  describe('initialize', () => {
    it('should set values', () => {
      process.env.APP_MASTER_KEY = masterKey

      credentialsMgr = new CredentialsManager({
        dir: credentialsDir,
        env: 'test'
      });

      assert.strictEqual(credentialsMgr.env, 'test');
      assert.strictEqual(
        credentialsMgr.file,
        path.join(credentialsDir, 'credentials.test.json.enc')
      );
      assert.ok(credentialsMgr.encryptor);
    });

    it('should set custom credentials directory', () => {
      credentialsMgr = new CredentialsManager({
        masterKey,
        dir: 'test',
        env: 'development'
      })

      assert.strictEqual(credentialsMgr.dir, 'test')
      assert.strictEqual(
        credentialsMgr.file,
        path.join('test', 'credentials.dev.json.enc')
      );
      assert(credentialsMgr.encryptor);
    });

    it('should set credentials file', () => {
      credentialsMgr = new CredentialsManager({
        masterKey,
        file: 'credentials.ci-test.json.enc',
        env: 'development'
      });

      assert.strictEqual(credentialsMgr.env, 'development');
      assert.strictEqual(credentialsMgr.file, 'credentials.ci-test.json.enc');
      assert(credentialsMgr.encryptor);
    });

    it('should thow an error if master key not provided', () => {
      assert.throws(() => {
        new CredentialsManager({})
      }, {
        message: /APP_MASTER_KEY is not provided./
      });
    });
  });

  describe('getFileName', () => {
    it('should return file name based on env name', () => {
      process.env.APP_MASTER_KEY = masterKey;

      const envFiles = {
        'development': 'credentials.dev.json.enc',
        'production': 'credentials.prod.json.enc',
        'test': 'credentials.test.json.enc',
        'stage': 'credentials.stage.json.enc',
        'stage-ci': 'credentials.stage-ci.json.enc'
      }

      for (const [env, file] of Object.entries(envFiles)) {
        credentialsMgr = new CredentialsManager({
          env
        });
        assert.strictEqual(credentialsMgr.getFileName(), file);
      }
    });
  });

  describe('update', () => {
    it('should create credentials file', () => {
      credentialsMgr = new CredentialsManager({
        masterKey,
        env: 'development',
        dir: credentialsDir
      });
      const secrets = {
        "KEY1": "VALUE1",
        "PASSWOES": "12345"
      };

      credentialsMgr.update(secrets);

      const file = path.join('credentials', 'credentials.dev.json.enc');
      assert.ok(fs.existsSync(file));

      const data = fs.readFileSync(file);
      assert.ok(data.length > 0);

      assert.deepEqual(credentialsMgr.read(), secrets);
    });

    it('should update credentials file', () => {
      credentialsMgr = new CredentialsManager({
        masterKey,
        dir: credentialsDir,
        env: 'development'
      });
      const secrets = {
        "KEY1": "VALUE1",
        "PASSWOES": "12345"
      };

      credentialsMgr.update(secrets);
      assert.deepEqual(credentialsMgr.read(), secrets);

      secrets["PORT"] = 9090;

      credentialsMgr.update(secrets);
      const updatedSecrets = credentialsMgr.read();
      assert.deepEqual(updatedSecrets, secrets);
      assert.strictEqual(updatedSecrets.PORT, 9090);
    });

    it('should throw error if invalid JSON data.', () => {
      credentialsMgr = new CredentialsManager({
        masterKey,
        env: 'development',
        dir: credentialsDir
      });
      const secrets = {
        "KEY1": "VALUE1",
        "PASSWOES": "12345"
      };

      credentialsMgr.update(secrets);
      assert.deepEqual(credentialsMgr.read(), secrets);

      const newSecrets = `{"KEY1": "VALUE1", "V":}`;

      assert.throws(() => {
        credentialsMgr.update(newSecrets);
      }, {
        message: /Invalid JSON data format./
      });
      assert.deepEqual(credentialsMgr.read(), secrets);
    });
  });

  describe('read', () => {
    it('should return empty object if credentials file not present.', () => {
      const obj = credentialsMgr.read()
      assert.deepEqual(obj, {})
    });
  });

  describe('encryptFile', () => {
    const inFileName = 'test_credentials.json';
    let inFile;

    beforeEach(() => {
      inFile = path.join(process.cwd(), 'test', 'fixtures', inFileName);
    });

    it('should encrypt file.', () => {
      const outFileName = `${inFileName}.enc`;

      credentialsMgr = new CredentialsManager({
        masterKey,
        file: outFileName,
        dir: credentialsDir,
        env: 'development'
      });

      const outFile = credentialsMgr.encryptFile(inFile);

      assert.strictEqual(path.join(credentialsDir, outFileName), outFile);
      assert.ok(fs.readFileSync(outFile).length > 0);

      const decryptedSecrets = credentialsMgr.read();
      const secrets = JSON.parse(fs.readFileSync(inFile).toString());
      assert.deepEqual(decryptedSecrets, secrets);
    });

    it('should thow an error if inout file not exits.', () => {
      assert.throws(() => {
        new CredentialsManager({
          masterKey,
          file: 'test.json.enc'
        }).encryptFile('file-not-exits.json');
      }, {
        message: /'file-not-exits.json' is not exists./
      });
    });
  });
});