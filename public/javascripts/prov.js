function prov(authName) {
  navigator.id.beginProvisioning(function(email) {
    window.console && console.log(['prov', email, authName]);
    if (authName != email) {
      navigator.id.raiseProvisioningFailure('user is not authenticated as target user')
    } else {
      navigator.id.genKeyPair(function(pubkey) {
        $.ajax("/.browserid/prov", {
          type: 'post',
          cache: false,
          data: pubkey,
          dataType: 'json',
          success: function(cert) { navigator.id.registerCertificate(cert); },
          error: function(xhr, msg) { navigator.id.raiseProvisioningFailure(msg); }
        });
      });
    }
  });
}
