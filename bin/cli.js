#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  generateKey,
  edit,
  encryptFile
} = require('../src');

function writeKey(credentialsDir, file, key) {
  const keyFile = path.join(credentialsDir, file);

  if (fs.existsSync(keyFile)) {
    throw new Error(`\n error: ${keyFile} file is already exist. \n`);
  }

  if (!fs.existsSync(credentialsDir)) {
    fs.mkdirSync(credentialsDir);
  }

  fs.writeFileSync(keyFile, key);

  const gitignoreLine = `${credentialsDir}/*.key`;
  let gitignoreContent;

  if (fs.existsSync('.gitignore')) {
    gitignoreContent = fs.readFileSync('.gitignore').toString();

    if (!gitignoreContent.includes(gitignoreLine)) {
      fs.appendFileSync('.gitignore', `\n${gitignoreLine}\n`);
    }
  } else {
    fs.writeFileSync('.gitignore', `${gitignoreLine}\n`);
  }
}

require('yargs')
  .command('master-key [credentials] [environment] [save]', 'Generate master encryption key', (yargs) => {
    yargs.positional('credentials', {
        type: 'string',
        default: 'credentials',
        describe: 'Path of the credentials where key will be saved. (i.e credentials)'
      })
      .positional('environment', {
        type: 'string',
        default: (process.env.NODE_ENV || 'development'),
        describe: 'The name of the application environment. i.e production.'
      })
      .positional('save', {
        type: 'boolean',
        default: true,
        describe: 'Flag to save into file'
      })
      .alias('c', 'credentials')
      .alias('e', 'environment')
      .alias('s', 'save')
  }, (argv) => {
    const key = generateKey();

    if (argv.save) {
      writeKey(argv.credentials, `${argv.environment}.key`, key);
      console.log(`\n    Saved in a credentials directory ${argv.credentials}/${argv.environment}.key\n`);
    }

    console.log('\n   ', key, '\n');
    console.log(`
    To use 'export APP_MASTER_KEY=${key}'
    OR Save in a credentials directory i.e credentials/${argv.environment}.key\n `);
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
  .command('encrypt-file [in] [out] [masterkey]', 'Encrypt file and place in credentials directory.', (yargs) => {
    yargs.positional('input', {
        type: 'string',
        describe: 'Input file.'
      })
      .positional('output', {
        type: 'string',
        describe: 'Encrypted output file.'
      })
      .alias('i', 'in')
      .alias('o', 'out')
      .alias('m', 'masterkey')
  }, (argv) => {
    const outFilePath = encryptFile({
      inFile: argv.in,
      outFile: argv.out,
      masterKey: argv.masterkey
    });

    console.log(`
    $ {
      argv.in
    }
    file encrypted and placed in '${outFilePath}'
    `);
  })
  .help()
  .argv