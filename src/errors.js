class EnvCredentialsError extends Error {
  constructor({
    message,
    env,
    origMessage
  }) {
    super(`Environment(${env}) - ${message} ${origMessage || ''}`)
    this.origMessage = origMessage
  }
}


module.exports = {
  EnvCredentialsError
}