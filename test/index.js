const assert = require("assert");
const fs = require('fs')

const {
  load,
  edit,
  generateKey,
} = require("../src");
const CredentialsManager = require('../src/credentials_manager');
const TEST_ENV_VAR_PREFIX = 'TEST_EC0000';
const TEST_APP_MASTER_KEY = 'a246298f0f5fac1ea4f9f59fd017d026e87253a353913716b9288bdedcee3ce0';

describe("env-credentials", () => {
  function cleanupResources() {
    fs.rmdirSync('credentials', {
      recursive: true
    });

    for (const [key] of Object.entries(process.env)) {
      if (key.includes(TEST_ENV_VAR_PREFIX)) {
        delete process.env[key]
      }
    }

    delete process.env.NODE_ENV;
    delete process.env.APP_MASTER_KEY;
    delete process.env.EDITOR;
  }

  let masterKey, credentials, secrets;

  beforeEach(() => {
    cleanupResources()
    delete process.env.NODE_ENV;
    delete process.env.APP_MASTER_KEY;

    masterKey = generateKey()
    credentials = new CredentialsManager({
      masterKey
    });
    secrets = {
      'TEST_EC0000_SECRET_KEY': 'SECRET-1234',
      'TEST_EC0000_API_KEY': 'API-KEY-1234'
    };
  });

  afterEach(cleanupResources);

  describe("generateKey", () => {
    it("should generate new encryption key", () => {
      const key = generateKey();
      assert(typeof key === "string");
    });
  });

  describe("load", () => {
    it("should load credentials with default options", () => {
      credentials.update(secrets)
      load({
        masterKey
      })

      assert.strictEqual(process.env.TEST_EC0000_SECRET_KEY, 'SECRET-1234');
      assert.strictEqual(process.env.TEST_EC0000_API_KEY, 'API-KEY-1234');
    });

    it("should load credentials for given envionment", () => {
      credentials = new CredentialsManager({
        env: 'test',
        masterKey
      });

      secrets = {
        'TEST_EC0000_SECRET_KEY': 'SECRET-1234-L1',
        'TEST_EC0000_API_KEY': 'API-KEY-1234-L1'
      };

      credentials.update(secrets)
      load({
        env: 'test',
        masterKey
      });

      assert.strictEqual(process.env.TEST_EC0000_SECRET_KEY, 'SECRET-1234-L1');
      assert.strictEqual(process.env.TEST_EC0000_API_KEY, 'API-KEY-1234-L1');
    });

    it("should load credentials using NODE_ENV env variable", () => {
      process.env.NODE_ENV = 'test-env';
      credentials = new CredentialsManager({
        masterKey
      });

      secrets = {
        'TEST_EC0000_SECRET_KEY': 'SECRET-1234-L2',
        'TEST_EC0000_API_KEY': 'API-KEY-1234-L2'
      };
      credentials.update(secrets)
      load({
        masterKey
      });

      assert.strictEqual(process.env.TEST_EC0000_SECRET_KEY, 'SECRET-1234-L2');
      assert.strictEqual(process.env.TEST_EC0000_API_KEY, 'API-KEY-1234-L2');
    });

    it("should load credentials using NODE_ENV and APP_MASTER_KEY env variables", () => {
      process.env.NODE_ENV = 'test-env-1';
      process.env.APP_MASTER_KEY = masterKey;

      secrets = {
        'TEST_EC0000_SECRET_KEY': 'SECRET-1234-L3',
        'TEST_EC0000_API_KEY': 'API-KEY-1234-L3'
      };
      credentials = new CredentialsManager({});
      credentials.update(secrets)
      load({});

      assert.strictEqual(process.env.TEST_EC0000_SECRET_KEY, 'SECRET-1234-L3');
      assert.strictEqual(process.env.TEST_EC0000_API_KEY, 'API-KEY-1234-L3');
    });

    it("should load credentials from provided file.", () => {
      load({
        credentialsDir: `${process.cwd()}/test/fixtures`,
        env: 'test',
        masterKey: TEST_APP_MASTER_KEY
      });

      assert.strictEqual(process.env.TEST_EC0000_SECRET_KEY, 'SECRET-1234-1');
      assert.strictEqual(process.env.TEST_EC0000_API_KEY, 'API-KEY-1234-1');
    });

    it("should load credentials and override", () => {
      credentials.update(secrets)

      const override = {
        TEST_EC0000_SECRET_KEY: 'OVERRIDE-SECRET-1234',
        TEST_EC0000_NEW_KEY: 'NEW-KEY'
      };

      load({
        masterKey,
        override
      })

      assert.strictEqual(process.env.TEST_EC0000_SECRET_KEY, 'OVERRIDE-SECRET-1234');
      assert.strictEqual(process.env.TEST_EC0000_API_KEY, 'API-KEY-1234');
      assert.strictEqual(process.env.TEST_EC0000_NEW_KEY, 'NEW-KEY');
    });
  });

  describe("edit", () => {
    it("should edit credentials with default options", () => {
      secrets = {
        'TEST_EC0000_SECRET_KEY': 'SECRET-1234-E1',
        'TEST_EC0000_API_KEY': 'API-KEY-1234-E1'
      };
      credentials.update(secrets);

      process.env.EDITOR = 'cat';
      edit({
        masterKey
      });

      load({
        masterKey
      });
      assert.strictEqual(process.env.TEST_EC0000_SECRET_KEY, 'SECRET-1234-E1');
      assert.strictEqual(process.env.TEST_EC0000_API_KEY, 'API-KEY-1234-E1');
    });

    it("should edit credentials from provided file", () => {
      process.env.APP_MASTER_KEY = TEST_APP_MASTER_KEY;
      process.env.EDITOR = 'cat';
      process.env.NODE_ENV = 'test';

      edit({
        credentialsDir: `${process.cwd()}/test/fixtures`
      });

      load({
        credentialsDir: `${process.cwd()}/test/fixtures`
      });

      assert.strictEqual(process.env.TEST_EC0000_SECRET_KEY, 'SECRET-1234-1');
      assert.strictEqual(process.env.TEST_EC0000_API_KEY, 'API-KEY-1234-1');
    });
  });
});