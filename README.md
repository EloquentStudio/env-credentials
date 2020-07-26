### env-credentials

Encrypt applicattion envionment credentials manager.

#### How to use?

  Help command.
  
  ```shell
  npx env-credentials --help
  ```
  

  1. Generate master key
  
  ```shell
  npx env-credentials master-key
  
  8a44911940b02fbc659277d89af48cb2628b31f6bc63b87b433da46966af6aec

  To use 'export APP_MASTER_KEY=8a44911940b02fbc659277d89af48cb2628b31f6bc63b87b433da46966af6aec'
  ```

  2. Create / Update credentials
  
  Default environment is `development`
  
  ```shell
  APP_MASTER_KEY=8a44911940b02fbc659277d89af48cb2628b31f6bc63b87b433da46966af6aec npx env-credentials edit
  ```
 
  ```shell
  APP_MASTER_KEY=252949256031ababb811706b4dcf662577e1b19d1980ef0c8b1bdfef13feba36 npx env-credentials edit -e production
  ```

  3. Load credentials
  
  Export `APP_MASTER_KEY` and `NODE_ENV`. `NODE_ENV` is default to `development`.
  
  ```javascript
    require('env-credentials').load()
  ```
