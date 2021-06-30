'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/inkstone.cjs.prod.js')
} else {
  module.exports = require('./dist/inkstone.cjs.js')
}
