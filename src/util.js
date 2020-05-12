function isPromise(obj) {
  return obj.constructor.name === 'Promise';
}

module.exports = {
  isPromise
}