var express = require('express')
var router = express.Router();
var Log = require('../models/log.js');

router.get('/', (req, res) => {
  Log.find({}, function(e, ls) {
    ls.sort((a, b) => b.time - a.time);
    res.render('view-logs', { logs: ls });
  })
})

router.get('/view-log/:id', (req, res) => {
  Log.findById(req.params.id, function(e, ls) {
    res.render('view-log', { log: ls._doc });
  })
})

module.exports = router
