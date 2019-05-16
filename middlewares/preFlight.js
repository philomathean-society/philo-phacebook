var Log = require('../models/log.js');
var preFlight = function (req, res, next) {
  if (req.url.indexOf('update') > -1 || req.url.indexOf('add') > -1 ||
      req.url.indexOf('delete') > -1 || req.url.indexOf('remove') > -1) {
    var l = new Log({
                    type: req.method,
                    author: req.session.user.username,
                    url: req.url,
                    body: req.method == 'POST' ? 
                    JSON.stringify(req.body) : ''
    })
    l.save(function(e, r) {
      console.log('added!');
      next();
    })
  } else {
    next();
  }
}

module.exports = preFlight;
