# env-credentials

Application environment credentials manager.

Store application environment credentials in encrypted JSON file, load, and export as environment variables.

## How to use?

[![asciicast](https://asciinema.org/a/351199.svg)](https://asciinema.org/a/351199)

Help command.

```shell
npx env-credentials --help
```

### Generate master key and save into environment specific file.

Default environment is development.

```shell
npx env-credentials master-key

Saved in a credentials directory credentials/development.key

8a44911940b02fbc659277d89af48cb2628b31f6bc63b87b433da46966af6aec

To use 'export APP_MASTER_KEY=8a44911940b02fbc659277d89af48cb2628b31f6bc63b87b433da46966af6aec'
OR Save in a credentials directory i.e credentials/development.key
```

Generate environment specific key and save.
```shell
npx env-credentials master-key -e production

Saved in a credentials directory credentials/production.key

48260a6dbe1bc8173e1ef5486ae30805e024500e7142ee8c7096536eab319bf7

To use 'export APP_MASTER_KEY=48260a6dbe1bc8173e1ef5486ae30805e024500e7142ee8c7096536eab319bf7'
OR Save in a credentials directory i.e credentials/production.key
```

Generate key without saving it.

```shell
npx env-credentials master-key -e production -s false
```


### Create / Update credentials

Default environment is `development`

```shell
npx env-credentials edit # loads app master key from 'credentials/development.key' file.
```

```shell
APP_MASTER_KEY=8a44911940b02fbc659277d89af48cb2628b31f6bc63b87b433da46966af6aec npx env-credentials edit
```

Edit by environment option.

```shell
npx env-credentials edit -e production # loads app master key from 'credentials/production.key' file.
```

```shell
APP_MASTER_KEY=252949256031ababb811706b4dcf662577e1b19d1980ef0c8b1bdfef13feba36 npx env-credentials edit -e production
```

### Load credentials

If `APP_MASTER_KEY` environment variable is not exported then key will be loaded from key file.

Export `APP_MASTER_KEY` and `NODE_ENV`. `NODE_ENV` is default to `development`.

```javascript
  require('env-credentials').load()
```

If do not want to export `APP_MASTER_KEY` for development or other env, put key as a file in `credentials` directory.
This will be helpful in development environment.

i.e `credentials/development.key` or  `credentials/production.key` or `credentials/staging.key`
