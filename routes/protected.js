var express = require('express')
var router = express.Router();
var isAuthenticated = require('../middlewares/isAuthenticated')
var User = require('../models/user.js')
var Alumni = require('../models/alumni.js');
var Corr = require('../models/correspondence.js');
var Tag = require('../models/tag.js');
var Log = require('../models/log.js');
var Donation = require('../models/donations.js');

router.use(isAuthenticated); // applies to everything!

router.get('/', (req, res) => {
  console.log(req.session.messages, res.locals.messages)
  res.redirect('/protected/view'); 
});

router.get('/logs', (req, res) => {
  Log.find({}, function(e, ls) {
    ls.sort((a, b) => b.time - a.time);
    res.render('view-logs', { logs: ls });
  })
})

router.get('/logs/view-log/:id', (req, res) => {
  Log.findById(req.params.id, function(e, ls) {
    res.render('view-log', { log: ls._doc });
  })
})

router.get('/view', (req, res) => {
  Alumni.find({}).populate('tags').exec(function(err, resp) {
    res.render('view', { people: resp }); 
  });
});

router.get('/alumni/:id', (req, res) => {
  Alumni.findById(req.params.id)
    .populate('correspondences')
    .populate('donations')
    .populate('tags')
    .exec(function (err, resp) {
      Tag.find({}, function(e2, r2) {
      resp.correspondences.sort((a, b) => Date.parse(b.dateCorresponded) - Date.parse(a.dateCorresponded));
      resp.donations.sort((a, b) => Date.parse(b.dateDonated) - Date.parse(a.dateDonated));
      res.render('alumnus', { person: resp, tags: r2 });
      })
  })
})

router.post('/alumni/:id/update-profile', (req, res) => {
  var link = req.body.link;

  Alumni.findById(req.params.id, function(err, resp) {
    resp.profilePic = link;
    resp.save(function(err2, r) {
      res.json({ 'success': true });
    })
  });
});

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

router.get('/alumni/:id/add-correspondence/:corrId?', (req, res) => {
  var e =  {};
  Alumni.findById(req.params.id, function(err, resp) {
    if (req.params.corrId) {
      Corr.findById(req.params.corrId, function(err, corr) {
        if (corr) { e = corr }
        return res.render('add-correspondence', { person: resp, e })
      })
    } else {
      res.render('add-correspondence', { person: resp, e })
    }
  });
})

router.post('/alumni/:id/add-correspondence/:corrId?', (req, res) => {
  let { corrTitle, text, dateCorresponded, attachmentLink } = req.body;
  if (!req.body.edit) {
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
          res.redirect('/protected/alumni/view-correspondence/' + res2._id)
        });
      })
    });
  } else {
    Corr.findById(req.body.edit, function(err, r) {
      r.corrTitle = corrTitle;
      r.text = text;
      r.dateCorresponded = dateCorresponded;
      r.attachmentLink = attachmentLink;
      r.save(function(err, s) {
        res.redirect('/protected/alumni/view-correspondence/' + s._id)
      });
    })
  }
})

router.get('/alumni/delete-correspondence/:id', (req, res) => {
  Corr.findById(req.params.id, function(e, r) {
    Alumni.findById(r.alumniId, function(e2, r2) {
      r2.correspondences.remove(r._id);
      r2.save(function(e3, r3) {
        r.remove(function(e4, r4) {
          res.redirect('/protected/alumni/' + r2._id);
        })
      })
    })
  })
})

router.get('/alumni/view-correspondence/:id', (req, res) => {
  Corr.findById(req.params.id).populate('alumniId')
    .exec(function(err, resp) {
      res.render('view-correspondence', { corr: resp });
  });
});

// donations...
//

router.get('/alumni/:id/add-donation/:corrId?', (req, res) => {
  var e =  {};
  Alumni.findById(req.params.id, function(err, resp) {
    if (req.params.corrId) {
      Donation.findById(req.params.corrId, function(err, corr) {
        if (corr) { e = corr }
        return res.render('add-donation', { person: resp, e })
      })
    } else {
      res.render('add-donation', { person: resp, e })
    }
  });
})

router.post('/alumni/:id/add-donation/:corrId?', (req, res) => {
  let { donationAmount, text, dateDonated, attachmentLink } = req.body;
  if (!req.body.edit) {
    var c = new Donation({
      alumniId: req.params.id,
      donationAmount: donationAmount,
      text,
      dateDonated,
      attachmentLink
    })
    Alumni.findById(req.params.id, function(err, resp) {
      c.save(function(err, res2) {
        resp.donations.push(res2._id);
        resp.save(function(e3, r4) {
        resp.recalculate(function(err, final) {
          res.redirect('/protected/alumni/view-donation/' + res2._id)
        });
        })
      })
    });
  } else {
    Donation.findById(req.body.edit, function(err, r) {
      r.donationAmount = donationAmount;
      r.text = text;
      r.dateDonated = dateDonated;
      r.attachmentLink = attachmentLink;
      r.save(function(err, s) {
        Alumni.findById(req.params.id, function(err, resp)  {
          resp.recalculate(function(e2, r2) {
            res.redirect('/protected/alumni/view-donation/' + s._id)
          })
        })
      });
    })
  }
})

router.get('/alumni/delete-donation/:id', (req, res) => {
  Donation.findById(req.params.id, function(e, r) {
    Alumni.findById(r.alumniId, function(e2, r2) {
      r2.donations.remove(r._id);
      r2.save(function(e5, r5) {
        r2.recalculate(function(e3, r3) {
          r.remove(function(e4, r4) {
            res.redirect('/protected/alumni/' + r2._id);
          })
        })
      })
    })
  })
})

router.get('/alumni/view-donation/:id', (req, res) => {
  Donation.findById(req.params.id).populate('alumniId')
    .exec(function(err, resp) {
      res.render('view-donation', { corr: resp });
  });
});

router.get('/alumni/:aid/remove-tag/:id', (req, res) => {
  Alumni.findById(req.params.aid, function(e, r) {
    r.tags.remove(req.params.id);
    r.save(function(e2, r2) {
      res.redirect('/protected/alumni/' + req.params.aid);
    })
  })
})

router.post('/alumni/:id/add-tag', (req, res) => {
  Alumni.findById(req.params.id, function(e ,r) {
    var tag = req.body.t
    console.log(req.body);
    if (tag) {
      var cleaned = tag.trim().toLowerCase();

      Tag.findOneAndUpdate({
        tagName: tag
      }, { tagName: tag }, { new: true, upsert: true, setDefaultsOnInert: true }, function(e2, t) {
        if (e2) { console.log(e2) }
        if (!r.tags) {
          r.tags = []
        }
        if (r.tags.indexOf(t._id) == -1 || r.tags.length == 0) {
          r.tags.push(t._id);
        }
        r.save(function(e3, r2) {
          res.json({ success: 'true' });
        })
      })
    } else {
      res.json({ success: 'failed' });
    }
  })  
})

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
