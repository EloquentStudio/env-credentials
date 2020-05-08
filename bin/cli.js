#!/usr/bin/env node

const {
  generateKey,
  edit
} = require('../src');

require('yargs')
  .command('master-key', 'Generate master encryption key', () => {}, (_a) => {
    const key = generateKey()

    console.log('\n  ', key, '\n')
    console.log(`   To use 'export APP_MASTER_KEY=${key}'\n`)
  })
  .command('edit [environment] [credentials] [masterkey]', 'Edit credentials', (yargs) => {
    yargs.positional('environment', {
        type: 'string',
        default: (process.env.NODE_ENV || 'development'),
        describe: 'The name of the application environment. i.e production.'
      })
      .positional('credentials', {
        type: 'string',
        describe: 'The name of the credentials file.'
      })
      .positional('masterkey', {
        type: 'string',
        default: process.env.APP_MASTER_KEY,
        describe: 'Credentials encryption masterkey.'
      })
      .alias('e', 'environment')
      .alias('c', 'credentials')
      .alias('m', 'masterkey')
  }, (argv) => {
    edit({
      credentialsFile: argv.credentials,
      env: argv.environment,
      masterKey: argv.masterkey
    })
  })
  .help()
  .argv
