var express = require('express')
var router = express.Router();
var isAuthenticated = require('../middlewares/isAuthenticated')
var User = require('../models/user.js')
var Alumni = require('../models/alumni.js');
var Corr = require('../models/correspondence.js');

router.use(isAuthenticated); // applies to everything!

router.get('/', (req, res) => {
  res.render('protected'); 
});

router.get('/view', (req, res) => {
  Alumni.find({}, function(err, resp) {
    res.render('view', { people: resp }); 
  });
});

router.get('/alumni/:id', (req, res) => {
  Alumni.findById(req.params.id)
    .populate('correspondences')
    .exec(function (err, resp) {
      resp.correspondences.sort((a, b) => Date.parse(a.dateCorresponded) - Date.parse(b.dateCorresponded));
      console.log(resp);
      res.render('alumnus', { person: resp });
  })
})

router.post('/alumni/:id/update-comments', (req, res) => {
  Alumni.findById(req.params.id, function (err, resp) {
    resp.genComments = req.body.comment;
    if (err) {
      return res.json({ 'status':'fails' });
    }
    resp.save(function (err2, resp2) {
      if (err2) { 
        console.log(err2);
        return res.json({ 'status':'fails' });
      }
      return res.json({ 'status':'success' });
    })
  })
})

router.get('/alumni/:id/add-correspondence', (req, res) => {
  Alumni.findById(req.params.id, function(err, resp) {
    res.render('add-correspondence', { person: resp })
  });
})

router.post('/alumni/:id/add-correspondence', (req, res) => {
  let { corrTitle, text, dateCorresponded, attachmentLink } = req.body;
  var c = new Corr({
    alumniId: req.params.id,
    corrTitle, 
    text,
    dateCorresponded,
    attachmentLink
  })
  Alumni.findById(req.params.id, function(err, resp) {
    c.save(function(err, res2) {
      resp.correspondences.push(res2._id);
      resp.save(function(err, final) {
        res.render('add-correspondence', { person: resp })
      });
    })
  });
})

router.get('/alumni/view-correspondence/:id', (req, res) => {
  Corr.findById(req.params.id).populate('alumniId')
    .exec(function(err, resp) {
      res.render('view-correspondence', { corr: resp });
  });
});

router.get('/update', (req, res) => {
  res.render('update'); 
});

router.post('/update-sheet', (req, res) => {
  console.log(req.body);
  var alum = ({
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
  Alumni.findOneAndUpdate({ 
    firstName: req.body.FirstName, 
    middleName: req.body['Middle Name(s)'],
    lastName: req.body['Last Name (at Admission)'],
    admitYear: req.body['Year Admitted']
  }, alum, { new: true, upsert: true, setDefaultsOnInsert: true }, function(err, userUpdate) {
    if (err) { console.log(err) };
    return res.json(userUpdate);
  })
});

module.exports = router;
