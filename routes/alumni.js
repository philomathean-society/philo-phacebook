var express = require('express')
var router = express.Router();
var Alumni = require('../models/alumni.js');
var Corr = require('../models/correspondence.js');
var Tag = require('../models/tag.js');
var Donation = require('../models/donations.js');

router.get('/view', (req, res) => {
  Alumni.find({}).populate({ path: 'tags', select: 'tagName -_id'})
    .select('admitYear firstName middleName lastName gradYear pennCareer postPennCareer')
    .exec(function(err, resp) {
    Tag.find({}, function(e2, r) {
      res.render('view', { people: resp, tags: r }); 
    })
  });
});

router.get('/:id', (req, res) => {
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

router.post('/:id/update-profile', (req, res) => {
  var link = req.body.link;

  Alumni.findById(req.params.id, function(err, resp) {
    resp.profilePic = link;
    resp.save(function(err2, r) {
      res.json({ 'success': true });
    })
  });
});

router.post('/:id/update-comments', (req, res) => {
  Alumni.findById(req.params.id, function (err, resp) {
    console.log(req.body);
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

router.post('/:id/update-penn', (req, res) => {
  Alumni.findById(req.params.id, function (err, resp) {
    console.log(req.body);
    resp.pennCareer = req.body.comment;
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

router.post('/:id/update-post', (req, res) => {
  Alumni.findById(req.params.id, function (err, resp) {
    console.log(req.body);
    resp.postPennCareer = req.body.comment;
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
router.get('/:id/add-correspondence/:corrId?', (req, res) => {
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

router.post('/:id/add-correspondence/:corrId?', (req, res) => {
  let { corrTitle, text, dateCorresponded, attachmentLink, tag, sticky } = req.body;
  console.log(sticky);
  if (!req.body.edit) {
    sticky = sticky == 'Yes' ? true : false
    var c = new Corr({
      alumniId: req.params.id,
      corrTitle, 
      text,
      dateCorresponded,
      attachmentLink,
      tag,
      sticky
    })
    Alumni.findById(req.params.id, function(err, resp) {
      c.save(function(e2, res2) {
        if (e2) { console.log(e2) }
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
      r.tag = tag;
      r.sticky = sticky == 'Yes';
      r.save(function(err, s) {
        res.redirect('/protected/alumni/view-correspondence/' + s._id)
      });
    })
  }
})

router.get('/delete-correspondence/:id', (req, res) => {
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

router.get('/view-correspondence/:id', (req, res) => {
  Corr.findById(req.params.id).populate('alumniId')
    .exec(function(err, resp) {
      res.render('view-correspondence', { corr: resp });
  });
});

// donations...
//

router.get('/:id/add-donation/:corrId?', (req, res) => {
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

router.post('/:id/add-donation/:corrId?', (req, res) => {
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

router.get('/delete-donation/:id', (req, res) => {
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

router.get('/view-donation/:id', (req, res) => {
  Donation.findById(req.params.id).populate('alumniId')
    .exec(function(err, resp) {
      res.render('view-donation', { corr: resp });
  });
});

router.get('/:aid/remove-tag/:id', (req, res) => {
  Alumni.findById(req.params.aid, function(e, r) {
    r.tags.remove(req.params.id);
    r.save(function(e2, r2) {
      res.redirect('/protected/alumni/' + req.params.aid);
    })
  })
})

router.get('/remove-tag-from-all/:id', (req, res) => {
  Alumni.updateMany({tags: { $in: req.params.id }}, { $pull: { tags: req.params.id }}, function(e, r) {
    Tag.findByIdAndRemove(req.params.id, function(e2, r2) {
      res.redirect('/protected/alumni/view');
    })
  })
})

router.post('/:id/add-tag', (req, res) => {
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

module.exports = router;
