
/**
 * Module dependencies.
 */

var express = require('express')
  , nconf = require('nconf')
  , fs = require('fs')
  , jwk = require('jwcrypto/jwk')
  , ini = require('ini')
  , routes = require('./routes');

// Load configuration

nconf.argv().env();

if (nconf.get('config')) {
  nconf.file({file: nconf.get('config'), format: ini});
}

nconf.defaults({
    url: {
      auth: '/browserid/auth'
    , prov: '/browserid/prov'
  }
  , port: 3000
  , key: {
      publickey: 'key.publickey'
    , secretkey: 'key.secretkey'
  }
  , pam: {
    service_name: 'browserid'
  }
  , cert: {
    lifetime: 43200000
  }
  , browserid_host_defaults: {
      development: 'dev.diresworb.org'
    , staging: 'diresworb.org'
    , production: 'browserid.org'
  }
});

// Create application

var server_options = [];
if (nconf.get('ssl:cert')) {
  server_options.push({
    cert: fs.readFileSync(nconf.get('ssl:cert'))
  , key: fs.readFileSync(nconf.get('ssl:key'))
  });
}

var app = module.exports = express.createServer.apply(express, server_options);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({secret: nconf.get('secret')}));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));

  app.dynamicHelpers({
    flash: function(req, res) {
      return function(className) {
        return req.flash(className);
      }
    }
  , auth_api_js: function(req, res) {
      return req.app.set('js.auth_api');
    }
  , prov_api_js: function(req, res) {
      return req.app.set('js.prov_api');
    }
  });

  app.set('key.publickey', JSON.parse(fs.readFileSync(nconf.get('key:publickey'))));
  app.set('key.secretkey', jwk.SecretKey.deserialize(fs.readFileSync(nconf.get('key:secretkey'))));
  app.set('cert.lifetime', nconf.get('cert:lifetime'));
  app.set('pam.service', nconf.get('pam:service'));
  app.set('domain', nconf.get('domain'));
  app.set('url.auth', nconf.get('url:auth'));
  app.set('url.prov', nconf.get('url:prov'));

  var browserid_host = nconf.get('browserid_host');
  if (!browserid_host) {
    browserid_host = nconf.get('browserid_host_defaults:' + app.settings.env);
  }
  app.set('js.auth_api', 'https://' + browserid_host + '/authentication_api.js');
  app.set('js.prov_api', 'https://' + browserid_host + '/provisioning_api.js');

  console.log(app.set('js.auth_api'));
  console.log(app.set('js.prov_api'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get('/.well-known/browserid', routes.support);
app.get(nconf.get('url:auth'), routes.auth);
app.post(nconf.get('url:auth'), routes.do_auth);
app.get(nconf.get('url:prov'), routes.prov);
app.post(nconf.get('url:prov'), routes.sign);

// Launch

app.listen(nconf.get('port'), nconf.get('bind'), function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
