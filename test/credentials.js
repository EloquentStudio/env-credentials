const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  generateKey,
} = require('../src');
const Credentials = require('../src/credentials');

describe('Credentials', () => {
  let masterKey, credentials;

  function cleanupFiles() {
    fs.rmdirSync('credentials', {
      recursive: true
    });
  }

  beforeEach(() => {
    cleanupFiles();
    delete process.env.NODE_ENV;
    delete process.env.APP_MASTER_KEY;

    masterKey = generateKey()
    credentials = new Credentials({
      env: 'test',
      masterKey
    });
  });

  afterEach(cleanupFiles);

  describe('initialize', () => {
    it('should set defaults', () => {
      process.env.APP_MASTER_KEY = masterKey

      credentials = new Credentials({})

      assert.strictEqual(credentials.env, 'development');
      assert.strictEqual(
        credentials.file,
        path.join('credentials', 'credentials.dev.json.enc')
      );
      assert.ok(credentials.encryptor);
    });

    it('should set envionment value from NODE_ENV', () => {
      process.env.NODE_ENV = 'production'

      credentials = new Credentials({
        masterKey
      })

      assert.strictEqual(credentials.env, 'production');
      assert.strictEqual(
        credentials.file,
        path.join('credentials', 'credentials.prod.json.enc')
      );
      assert.ok(credentials.encryptor)
    });

    it('should set custom credentials directory', () => {
      credentials = new Credentials({
        masterKey,
        dir: 'test'
      })

      assert.strictEqual(credentials.env, 'development')
      assert.strictEqual(credentials.dir, 'test')
      assert.strictEqual(
        credentials.file,
        path.join('test', 'credentials.dev.json.enc')
      );
      assert(credentials.encryptor);
    });

    it('should set credentials file', () => {
      credentials = new Credentials({
        masterKey,
        file: 'credentials.ci-test.json.enc'
      })

      assert.strictEqual(credentials.env, 'development')
      assert.strictEqual(
        credentials.file,
        path.join('credentials', 'credentials.ci-test.json.enc')
      );
      assert(credentials.encryptor);
    });

    it('should thow an error if master key not provided', () => {
      assert.throws(() => {
        new Credentials({})
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
        credentials = new Credentials({
          env
        });
        assert.strictEqual(credentials.getFileName(), path.join('credentials', file));
      }
    });
  });

  describe('update', () => {
    it('should create credentials file', () => {
      credentials = new Credentials({
        masterKey
      });
      const secrets = {
        "KEY1": "VALUE1",
        "PASSWOES": "12345"
      };

      credentials.update(secrets);

      const file = path.join('credentials', 'credentials.dev.json.enc');
      assert.ok(fs.existsSync(file));

      const data = fs.readFileSync(file);
      assert.ok(data.length > 0);

      assert.deepEqual(credentials.read(), secrets);
    });

    it('should update credentials file', () => {
      credentials = new Credentials({
        masterKey
      });
      const secrets = {
        "KEY1": "VALUE1",
        "PASSWOES": "12345"
      };

      credentials.update(secrets);
      assert.deepEqual(credentials.read(), secrets);

      secrets["PORT"] = 9090;

      credentials.update(secrets);
      const updatedSecrets = credentials.read();
      assert.deepEqual(updatedSecrets, secrets);
      assert.strictEqual(updatedSecrets.PORT, 9090);
    });

    it('should throw error if invalid JSON data.', () => {
      credentials = new Credentials({
        masterKey
      });
      const secrets = {
        "KEY1": "VALUE1",
        "PASSWOES": "12345"
      };

      credentials.update(secrets);
      assert.deepEqual(credentials.read(), secrets);

      const newSecrets = `{"KEY1": "VALUE1", "V":}`;

      assert.throws(() => {
        credentials.update(newSecrets);
      }, {
        message: /Invalid JSON data format./
      });
      assert.deepEqual(credentials.read(), secrets);
    });
  });

  describe('read', () => {
    it("should return empty object if credentials file not present", () => {
      const obj = credentials.read()
      assert.deepEqual(obj, {})
    });
  });
});