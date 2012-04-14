$(document).ready(function() {
  $('button.cancel').click(function(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    navigator.id && navigator.id.raiseAuthenticationFailure();
  });
});
