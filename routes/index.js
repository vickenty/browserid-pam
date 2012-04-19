const unixlib = require('unixlib')
    , jwcert = require('jwcrypto/jwcert')
    , jwk = require('jwcrypto/jwk')
    ;

function set_session_from_ssl(req) {
  if (req.client.authorized && !req.session.username) {
    var cert = req.client.getPeerCertificate();
    req.session.username = cert.subject.CN;
  }
}

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
    var requested = req.query.email;

    set_session_from_ssl(req);

    if (requested && requested == req.session.username)
      res.render('auth_ok', { title: 'Authenticated', username: req.session.username });
    else
      res.render('auth', { title: 'Authenticate', username: req.session.username, requested: requested });
  },

  do_auth: function(req, res) {
    var service = req.app.set('pam.service')
      , username = (req.body.username || req.body.requested)
      , password = req.body.password
      , requested = req.body.requested
      , domain = req.app.set('domain');

    var atpos = username.indexOf('@');
    if (atpos > 0) {
      domain = username.slice(atpos + 1);
      username = username.slice(0, atpos);
    }

    unixlib.pamauth(service, username, password, function(result) {
      if (result && domain == req.app.set('domain')) {
        req.session.username = username + '@' + domain;
        req.flash('success', 'Authentication successful.');
        res.render('auth_ok', { title: 'Authenticated', username: username });
      } else {
        req.flash('error', 'Authentication failed.');
        res.render('auth', { title: 'Authenticate', username: username, requested: req.body.requested });
      }
    });
  },

  prov: function(req, res) {
    set_session_from_ssl(req);
    res.render('prov', { title: '', email: req.session.username, prov_url: req.app.set('url.prov') });
  },

  sign: function(req, res) {
    var expiration = new Date().getTime() + req.app.set('cert.lifetime');
    var cert = new jwcert.JWCert(
      req.app.set('domain')
    , expiration
    , new Date()
    , jwk.PublicKey.fromSimpleObject(req.body)
    , { email: req.session.username }).sign(req.app.set('key.secretkey'));

    res.json(cert);
  }
};
