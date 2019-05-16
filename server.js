const express = require('express');
const mongoose = require('mongoose');
const path =  require('path');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
var preFlight = require('./middlewares/preFlight.js');
var accountRouter = require('./routes/account.js');
var protectedRouter = require('./routes/protected.js');

const app = express();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/philo-alumni');


app.engine('html', require('ejs').__express);
app.set('view engine', 'html');

app.use('/static', express.static(path.join(__dirname, 'static')))

app.use(bodyParser.urlencoded({ parameterLimit: 100000, limit: '50mb', extended: true }));

app.use(bodyParser.json({ limit: '50mb' }))

app.use(cookieSession({
  name: 'local-session',
  keys: ['spooky'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.use(function(req, res, next){
  req.flash = function(type, message) {
    req.session.messages = [{ type, message }]
    res.locals.messages = req.session.messages
  }
  next();
});
app.use(function(req, res, next) {
  res.locals.user = req.session ? req.session.user : false;
  res.locals.messages = req.session.messages
  next();
})

app.get('/', (req, res) => {
  if (req.session.user && req.session.user.username.length > 0) {
    res.redirect('/protected');
  } else {
    res.render('index');
  }
});

app.get('/delete-message', function(req, res) {
  console.log('got del req');
  if (req.session.messages && req.session.messages.length > 0) {
    req.session.messages = [];
  }

  console.log('removed!');
  res.json({"success": "true"});
})
app.use('/account', accountRouter)
app.use('/protected', preFlight, protectedRouter)

app.use(function(err, req, res, next) {
  console.log(err);
  res.status(500)
  res.render('error', { error: err })
})

app.listen(process.env.PORT || 3000, () => {
  console.log('listening');
});
