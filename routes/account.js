var express = require('express')
var router = express.Router();
var isAuthenticated = require('../middlewares/isAuthenticated')
var User = require('../models/user.js')
var bcrypt = require('bcrypt');
var sg = require('@sendgrid/mail');
if (!process.env.SENDGRID_API_KEY) {
  var conf = require('../config');
}

router.get('/signup', function (req, res) {
  res.render('signup')
})

router.post('/signup', function (req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  var u = new User({ username: username, password: password })
  u.save(function (err, result) { 
    if (err) {
      next(err)
    }
    if (!err) {
      res.redirect('/account/login')
    }
  })
})

router.get('/login', function (req, res) {
  res.render('login')
})

router.post('/login', function (req, res) {
  var username = req.body.username;
  var password = req.body.password;
  User.findOne({ username: username }, function (err, result) { 
    if (err || !result) {
      req.flash('warning', 'Invalid credentials');
      res.render('login')
      return;
    }
    result.comparePassword(password, function(e, r) {
      if (!e && !err && r == true) {
        var { username } = result
        req.session.user = { username };
        req.flash('success', 'You have logged in');
        res.redirect('/protected')
      } else {
        req.flash('warning', 'Invalid credentials');
        res.render('login')
      }
    })
  })
})

router.get('/logout', isAuthenticated, function (req, res) {
  req.session.user = '';
  req.flash('success', "You've been logged out");
  res.redirect('/')
})

router.get('/req-reset-password', (req, res) => {
  res.render('req-reset-password', { message: false });
})

router.post('/req-reset-password', (req, res) => {
  var username = req.body.username
  User.findOne({ username: username }, function (e, r) {
    var d = new Date();
    d.setMinutes(d.getMinutes() + 30);
    d = +d
    if (e || !r) {
      return res.render('req-reset-password', { message: `Could not find user` });
    }
    bcrypt.genSalt(10, function(e2, salt) {
      bcrypt.hash(`${r.username}${r.password}${d}seecret`, salt, function(e3, hash) {
        if (e3) { console.log(e3) }
        var token = hash;
        var url = `${req.protocol}://${req.get('host')}${req.baseUrl}/reset-password?username=${r.username}&exp=${d}&token=${token}`
        sg.setApiKey(process.env.SENDGRID_API_KEY || conf.sgKey) 
        const msg = {
          to: `${r.username}`,
          from: 'technojoy@philomathean.org',
          subject: 'Phlumni App-Password Reset',
          text: `Paste this into your browser: ${url}` ,
          html: `Click or Paste this into your browser: <a href="${url}">${url}</a>` ,
        };
        sg.send(msg)

        console.log(url);
        res.render('req-reset-password', { message: `Sent email to ${r.username}` });
      })
    })
  })
})

router.get('/reset-password', function (req, res) {
  res.render('reset-password', { email: req.query.username });
})

router.post('/reset-password', function(req, res) {
  if (req.session.user) {
    User.findOne({ username: req.session.user.username }, function(e, u) {
      u.password = req.body.password;
      u.save(function(e2, u2) {
        req.flash('Set new password = Done :)')
        res.redirect('/protected');
      })
    })
  }
  if (req.query.username && req.query.exp && req.query.token) {
    var d = new Date();
    d.setMinutes(d.getMinutes() -30);
    d = +d;
    if (d < req.query.exp) {
      User.findOne({ username: req.query.username }, function(e, r) {
        console.log(r);
        bcrypt.compare(`${req.query.username}${r.password}${req.query.exp}seecret`, req.query.token, function(err, m) {
          if (m == true && !err) {
            r.password = req.body.password;
            r.save(function(e2, r2) {
              req.flash('success', 'Reset password complete');
              res.redirect('/account/login');
            })
          } else {
            req.flash('danger', 'Bad url, please try resetting again');
            res.redirect('/account/login');

          }
        })
      })
    } else {
      req.flash('Bad url, please try resetting again');
      res.redirect('/account/login');
    }
  }
})

router.get('/manage-users', isAuthenticated, (req, res) => {
  User.findOne({ isAdmin: true }, function(err, r) {
    if (!r || r.length == 0) {
      User.findOne({ username: req.session.user.username }, function(e2, r2) {
        if (!r2) {
          res.redirect('/account/logout');
          return;
        }
        r2.isAdmin = true;
        r2.save(function(e3, r3) {
          req.flash('success', 'You are the first admin on this system');
          res.redirect('/protected/alumni/view');
          return;
        })
      })
    } else {
      User.findOne({ username: req.session.user.username, isAdmin: true }, function(e2, r2) {
        if (!r2 || r2.length == 0) {
          req.flash('danger', 'You are not an admin');
          res.redirect('/protected/alumni/view');
        } else {
          User.find({}, function(e3, r3) {
            res.render('manage-users', { users: r3 });
          })
        }
      });
    }
  })
});

router.get('/manage-users/:id/delete', (req, res) => {
      User.findOne({ username: req.session.user.username, isAdmin: true }, function(e2, r2) {
        if (!r2 || r2.length == 0) {
          req.flash('danger', 'Not admin');
        } else {
          User.findById(req.params.id, function(e3, r3) {
            r3.remove(function(e, r) {
              req.flash('success', 'Removed user');
              res.redirect('/account/manage-users');
            })
          })
        }
      });
})

router.get('/manage-users/:id/toggle-admin', (req, res) => {
      User.findOne({ username: req.session.user.username, isAdmin: true }, function(e2, r2) {
        if (!r2 || r2.length == 0) {
          req.flash('danger', 'Not admin');
        } else {
          User.findById(req.params.id, function(e3, r3) {
            r3.isAdmin = !r3.isAdmin
            r3.save(function(e, r) {
              req.flash('success', 'Toggled Admin perms for user');
              res.redirect('/account/manage-users');
            })
          })
        }
      });
})

module.exports = router;
