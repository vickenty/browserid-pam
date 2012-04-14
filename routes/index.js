const unixlib = require('unixlib')
    , jwcert = require('jwcrypto/jwcert')
    , jwk = require('jwcrypto/jwk')
    ;

module.exports = {
  index: function(req, res){
    res.render('index', { title: 'BrowserID', username: req.session.username })
  },

  support: function(req, res) {
    res.header('cache-control', 'max-age=0');
    res.header('pragma', 'no-cache');
    res.json({
      'public-key': req.app.set('key.publickey')
    , 'authentication': req.app.set('url.auth')
    , 'provisioning': req.app.set('url.prov')
    });
  },

  auth: function(req, res) {
    var requested;
    if (req.query.email) {
      var parsedEmail = req.query.email.split('@');
      if (parsedEmail[1] == req.app.set('domain')) {
        requested = parsedEmail[0];
      }
    }
    res.render('auth', { title: 'Authenticate', username: req.session.username, requested: requested });
  },

  do_auth: function(req, res) {
    var service = req.app.set('pam.service')
      , username = req.body.username
      , password = req.body.password;

    unixlib.pamauth(service, username, password, function(result) {
      if (result) {
        req.session.username = username;
        req.flash('success', 'Authentication successful.');
        res.render('auth', { title: 'Authenticate', username: username });
      } else {
        req.flash('error', 'Authentication failed.');
        res.render('auth', { title: 'Authenticate' });
      }
    });
  },

  prov: function(req, res) {
    var email;
    if (req.session.username)
      email = req.session.username + '@' + req.app.set('domain');
    res.render('prov', { title: '', email: email });
  },

  sign: function(req, res) {
    var email = req.session.username + '@' + req.app.set('domain');
    var expiration = new Date().getTime() + req.app.set('cert.lifetime');
    var cert = new jwcert.JWCert(
      req.app.set('domain')
    , expiration
    , new Date()
    , jwk.PublicKey.fromSimpleObject(req.body)
    , { email: email }).sign(req.app.set('key.secretkey'));

    res.json(cert);
  }
};
