"use strict";

function scope() {
  this.watchGroup = []; // array of watchers
  this.postDigestGroup = []; // array of functions
  this.phase = null; //  smth like a flag; if you try to $apply during a $digest an error appear
}

/**
* APPLY
* it's used to execute an expression in angular from outside of the angular framework
**/
scope.prototype.apply = function(expression) {
  try {
    this.startPhase("APPLY");
    return this.eval(expression);
  } catch(e) {
    console.error(e);
  } finally {
    this.endPhase("APPLY");
    this.digest();
  }
};

/**
* EVAL
* Executes the expression on the current scope and returns the result
**/
scope.prototype.eval = function(expression, locals) {
  return expression(this, locals);
};

/**
* WATCH
* The listener is called whenever anything within the watchFn has changed
* The watchFn is called on every call to $digest()
**/
scope.prototype.watch = function(watchFn, listenerFn, valueEq) {
  var w = {
    watchFn: watchFn,
    listenerFn: listenerFn,
    valueEq: valueEq
  }
  this.watchGroup.push(w);
};

/**
* DIGEST
* Processes all of the watchers of the current scope
**/
scope.prototype.digest = function() {
  var thisRef = this;
  var dirty;
  this.startPhase("DIGEST");
  var oldValue;
  var newValue;
  var interation = 3;
  _.forEach(this.watchGroup, function(watch) {
    try {
      interation--;
      oldValue = watch.oldValue;
      newValue = watch.watchFn(thisRef);
      console.log("oldValue: " + oldValue);
      console.log("newValue: " + newValue);
      if(oldValue != newValue) {
        watch.listenerFn(newValue, oldValue, thisRef);
        dirty = true;
      }
      if (dirty && !interation) {
        throw "3 interations are already made";
      }
      watch.oldValue = (watch.valueEq ? _.cloneDeep(newValue) : newValue);
    } catch(e) {
      console.error(e);
    }
  });
  this.endPhase("DIGEST");

  var len = this.postDigestGroup.length;
  for (var i = 0; i < len; i++) {
      this.postDigestGroup.shift()();
  }
};


scope.prototype.startPhase = function(phase) {
  this.phase = phase;
  console.log(phase + " phase is started");
};

scope.prototype.endPhase = function(phase) {
  this.phase = null;
  console.log(phase + " phase is ended");
};

/**
* POST DIGEST
* set of functions
**/
scope.prototype.postDigest = function(func) {
  console.log("----- post digest start -----");
  this.postDigestGroup.push(func);
  console.log("----- post digest end -----");
};

/*************************************************************************/

/**
* creating a SCOPE
**/
var scope = new scope();

scope.muffins = "Ocelot malkin kitten yet british shorthair.";
scope.counter = 0;

/**
* running a WATCH function
**/

scope.watch(
  function(scope) {
    return scope.muffins;
  },
  function(newValue, oldValue, scope) {
    scope.counter++;
  }
);

/**
* counter will not change because of no DIGEST
**/
console.log(scope.counter);

/**
* running a DIGEST, changing the counter
**/
scope.digest();
console.log(scope.counter);

scope.muffins = "Manx maine coon, but tiger for egyptian mau.";
scope.digest();
console.log(scope.counter);

/**
* calling an APPLY function that will call a DIGEST, so the counter will be changed
**/
scope.apply(function(scope) {
  scope.muffins = "Cougar ocicat and malkin and lynx or american bobtail, american shorthair.";
});
console.log(scope.counter);


/**
* POST DIGEST
**/
var catnip = "";
scope.postDigest(function() {
  catnip = "Cornish rex tiger.";
});
console.log("catnip: " + catnip);

scope.digest();
console.log("catnip: " + catnip);

/**
* disable watch function
**/
scope.catIpsum = "Ocicat. Havana brown malkin.";
var removeWatch = scope.watch(
  function(scope) {
    return scope.catIpsum;
  },
  function(newValue, oldValue, scope) {
    scope.counter++;
  }
);

scope.catIpsum = "Cheetah american bobtail.";
scope.digest();
console.log(scope.counter);

scope.stop = function() {
  removeWatch();
};

scope.digest();
console.log(scope.counter);

/**
* infinity loop
* watchers look each other
**/
scope.value = 0;

scope.watch(
  function(scope) {
    return scope.counter;
  },
  function(newValue, oldValue, scope) {
    scope.value++;
  }
);

scope.watch(
  function(scope) {
    return scope.value;
  },
  function(newValue, oldValue, scope) {
    scope.counter++;
  }
);

scope.digest();