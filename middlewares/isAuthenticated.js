var isAuthenticated = function (req, res, next) {
  if (req.session.user && req.session.user.username.length > 0) {
    next()
  } else {
    res.redirect('/account/login')
  }
}

module.exports = isAuthenticated;
