var express = require('express')
var router = express.Router();
var Alumni = require('../models/alumni.js');

var isAuthenticated = require('../middlewares/isAuthenticated')
var logs = require('./logs');
var alumni = require('./alumni');

router.use(isAuthenticated); // applies to everything!
router.use('/logs', logs); 
router.use('/alumni', alumni); 

router.get('/', (req, res) => {
  console.log(req.session.messages, res.locals.messages)
  res.redirect('/protected/alumni/view'); 
});

router.get('/update', (req, res) => {
  res.render('update'); 
});

router.post('/update-sheet', (req, res) => {
  var newAlum = ({
    admitYear: req.body['Year Admitted'],
    firstName: req.body['FirstName'],
    middleName: req.body['Middle Name(s)'],
    lastName: req.body['Last Name (at Admission)'],
    gradYear: req.body['Grad Year'],
    pennCareer: req.body['Philo/Penn Career'],
    postPennCareer: req.body['Post-Philo Career'],
    genComments: '',
    profilePic: '',
    tag: ''
  })

  Alumni.findOneOrCreate({ 
    firstName: req.body.FirstName, 
    middleName: req.body['Middle Name(s)'],
    lastName: req.body['Last Name (at Admission)'],
    admitYear: req.body['Year Admitted']
  }, newAlum, function(err, userUpdate) {
    if (err) { console.log(err) };
    return res.json(userUpdate);
  })
});

module.exports = router;
