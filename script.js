"use strict";

var scope = {};
var temp;
var applyRun = false;
var digestRun = false;
var enable = true;

$(document).ready(function(){
  var timer = null;
  $('input').keydown(function(){
    clearTimeout(timer);
    temp = scope.input;  // previous INPUT value
    timer = setTimeout(apply, 1000);
  });
});

function printById(id, string) {
  document.getElementById(id).textContent += string;
  document.getElementById(id).textContent += "\n";
}

function apply() {
  printById("textarea", "----- apply start -----")
  scope.input = $('input[type="text"]').val();
  printById("textarea", scope.input);
  printById("textarea", "----- apply end -----");
  applyRun = true;
  digest();
}

function watch(watchFn, valueEq) {
  if(enable) {
    printById("textarea", "----- watch start -----");
    var print;
    if(temp !== valueEq) {
      print = "scope was changed [" + temp + "] --> [" + valueEq + "]";
      temp = valueEq;
    } else {
      print = "scope wasn't changed [" + temp + "] --> [" + valueEq + "]";
    }
    printById("textarea", print);
    printById("textarea", "----- watch end -----");
    return true;
  } else {
      return false;
  }
}

function digest() {
  printById("textarea", "----- digest start -----");
  watch(apply, scope.input);
  printById("textarea", "----- digest end -----");
  digestRun = true;
  phases();
  postDigest();
}

function phases() {
  printById("textarea", "----- phases start -----");
  var print;
  if (applyRun && digestRun) {
    applyRun = false;
    digestRun = false;
    print = "clear";
  } else {
    print = "not clear";
  }
  printById("textarea", print);
  printById("textarea", "----- phases end -----");
}

function postDigest() {
  printById("textarea", "----- post digest start -----");
  document.getElementById("h5").textContent = scope.input;
  printById("textarea", "----- post digest end -----");
  printById("textarea", "\n");

}

function disableEnableWatch() {
  var print;
  var value;
  if (enable) {
    enable = false;
    print = "----- watch is disabled -----";
    value = "enable watch";
  } else {
    enable = true;
    print = "----- watch is enabled -----";
    value = "disable watch";
  }
  document.getElementById("button").innerHTML = value;
  printById("textarea", print);
  printById("textarea", "\n");
}