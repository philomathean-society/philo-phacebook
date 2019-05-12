const express = require('express');
const mongoose = require('mongoose');
const path =  require('path');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');

var isAuthenticated = require('./middlewares/isAuthenticated.js');
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

app.get('/', (req, res) => {
  if (req.session.user && req.session.user.length > 0) {
    res.redirect('/protected');
  } else {
    res.render('index');
  }
});

app.use('/account', accountRouter)
app.use('/protected', protectedRouter)

app.listen(process.env.PORT || 3000, () => {
  console.log('listening');
});
