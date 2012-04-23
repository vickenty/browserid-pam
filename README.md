About
-----

This is Mozilla Identity (formerly known as BrowserID) primary authority implementation with PAM and SSL client certificates support.

For more information on BrowserID see http://en.wikipedia.org/wiki/BrowserID.

Installation
------------

Have a working installation of a recent version of Node.js, preferably version 0.6.x.

Download and extract browserid-pam archive, or check out the repository.

From the package directory execute `npm install` to download and install dependencies. Modules will be installed under the current directory.

Configuration
-------------
Copy `config-example.ini` to a different name and location of your choice (e.g. `config.ini`).

Edit the file and set `domain` to the domain name of your email addresses, and `secret` to a longish string of random characters. In `ssl` section change `cert` and `key` to point to your SSL certificate and private key.

Execute the following command to generate public and secret keys for signing user's certificates:

    node_modules/.bin/generate-keypair

This will generate `key.publickey` and `key.secretkey` files in the current directory. Please secure your secret key well:

    chmod 0600 key.secretkey

See comments in the configuration for more options.

Running
-------
You can run browserid-pam server with the following command:

    node app.js --config config.ini

To operate it as a system service, install Forever (https://github.com/nodejitsu/forever)

    npm install forever

and run

    forver start app.js --config config.js

Client SSL certificates
-----------------------
In addition to password authentication, `browserid-pam` can authenticate users via SSL certificates. Set `ca` parameter in your configuration file to the certificate of the authority used to issue certificates. Common name (CN) part of the user's certificate has to match the email address he is authenticating for.
