const crypto = require('crypto');

function generateMasterKey(){
  return crypto.randomBytes(32).toString('base64');
}

module.exports = {
  generateMasterKey
}
