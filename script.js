"use strict";

$(document).ready(function(){
  var timer = null;
  $('input').keydown(function(){
         clearTimeout(timer); 
         timer = setTimeout(apply, 1000)
  });
});

var scope = {};

function apply() {
  scope.input = $('input[type="text"]').val();
  console.log(scope.input);
}