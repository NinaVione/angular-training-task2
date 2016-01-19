'use strict'

function scope() {
  this.$$watchers = []; // array of watchers
  this.$$asyncQueue = []; // adds an expressions to the asyncQueue (using $scope.$evalAsync())
  this.$$postDigestQueue = []; // array of functions
  this.$$phase = null; //  smth like a flag; if you try to $apply during a $digest an error appear
}

scope.prototype.$beginPhase = function(phase) {
  if (this.$$phase) {
    throw this.$$phase + ' already in progress.';
  }
  this.$$phase = phase;
};

scope.prototype.$clearPhase = function() {
  this.$$phase = null;
};


/**
* WATCH
* The listener is called whenever anything within the watchFn has changed
* The watchFn is called on every call to $digest()
**/
scope.prototype.$watch = function(watchFn, listenerFn, valueEq) {
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || function() {},
    valueEq: !!valueEq
  };
  this.$$watchers.push(watcher);
};

scope.prototype.$$areEqual = function(newValue, oldValue, valueEq) {
  if (valueEq) {
    return _.isEqual(newValue, oldValue);
  } else {
    return newValue === oldValue;
  }
};

scope.prototype.$$digestOnce = function() {
  var self  = this;
  var dirty;
  _.forEach(this.$$watchers, function(watch) {
    try {
      var newValue = watch.watchFn(self);
      var oldValue = watch.last;
      if (!self.$$areEqual(newValue, oldValue, watch.valueEq)) {
        watch.listenerFn(newValue, oldValue, self);
        dirty = true;
      }
      watch.last = (watch.valueEq ? _.cloneDeep(newValue) : newValue);
    } catch(e) {
      console.error(e);
    }
  });
  return dirty;
};

/**
* DIGEST
* Processes all of the watchers of the current scope
**/
scope.prototype.$digest = function(){
  var iteration = 3;
  var dirty;
  this.$beginPhase("$digest");
  do {
    while (this.$$asyncQueue.length) {
      try {
        var asyncTask = this.$$asyncQueue.shift();
        this.$eval(asyncTask.expression);
      } catch (e) {
        console.error(e);
      }
    }
    dirty = this.$$digestOnce();
    if (dirty && !(iteration--)) {
      this.$clearPhase();
      throw "3 digest iterations reached";
    }
  } while (dirty);
  this.$clearPhase();

  while (this.$$postDigestQueue.length) {
    try {
      this.$$postDigestQueue.shift()();
    } catch (e) {
      console.error(e);
    }
  }
};

/**
* EVAL
* Executes the expression on the current scope and returns the result
**/
scope.prototype.$eval = function(expr, locals) {
  return expr(this, locals);
};


/**
* APPLY
* it's used to execute an expression in angular from outside of the angular framework
**/
scope.prototype.$apply = function(expr) {
  try {
    this.$beginPhase("$apply");
    return this.$eval(expr);
  } finally {
    this.$clearPhase();
    this.$digest();
  }
};

/**
* EVAL ASYNC
* Executes the expression on the current scope at a later point in time.
**/
scope.prototype.$evalAsync = function(expr) {
  var self = this;
  if (!self.$$phase && !self.$$asyncQueue.length) {
    setTimeout(function() {
      if (self.$$asyncQueue.length) {
        self.$digest();
      }
    }, 0);
  }
  self.$$asyncQueue.push({scope: self, expression: expr});
};

/**
* POST DIGEST
* set of functions
**/
scope.prototype.$$postDigest = function(fn) {
  this.$$postDigestQueue.push(fn);
};

var scope = new scope();

/**
* setting up array of muffins
* calling the functions
**/
scope.muffins = ['Ocelot malkin kitten yet british shorthair.', 'Siberian mouser.'];

scope.counterValue = 0; // counts a number of values changing
scope.counterRef = 0; //counts a number of references changing

scope.$watch(
  function(scope) {
    return scope.muffins;
  },
  function(newValue, oldValue, scope) {
    scope.counterRef++;
  }
);

scope.$watch(
  function(scope) {
    return scope.muffins;
  },
  function(newValue, oldValue, scope) {
    scope.counterValue++;
  },
  true //valueEq = true in $watch
);

console.log('WATCH, NO DIGEST: counterRef: ' + scope.counterRef); //0
console.log('WATCH, NO DIGEST: counterValue: ' + scope.counterValue); //0

scope.$digest();
console.log('DIGEST: counterRef: ' + scope.counterRef); //1
console.log('DIGEST: counterValue: ' + scope.counterValue); //1

scope.muffins[1] = ('Nom-nom.');
scope.$digest();
console.log('DIGEST: counterRef: ' + scope.counterRef); //1 (reference is the same)
console.log('DIGEST: counterValue: ' + scope.counterValue); //2

scope.muffins = 'Ocicat. Havana brown malkin.';

scope.$digest();
console.log('DIGEST: counterRef: ' + scope.counterRef); //2
console.log('DIGEST: counterValue: ' + scope.counterValue); //3

scope.$apply(function(scope) {
  scope.muffins = 'Manx maine coon, but tiger for egyptian mau.';
});
console.log('APPLY: counterValue: ' + scope.counterValue); //4

scope.asyncEvaled = false;

scope.$watch(
  function(scope) {
    scope.$evalAsync(function(scope) {
      throw "async error";
    });
    return scope.muffins;
  },
  function(newValue, oldValue, scope) {
    scope.counterValue++;
    scope.$evalAsync(function(scope) {
      scope.asyncEvaled = true;
    });
    console.log("INSIDE LISTENER: asyncEvaled: " + scope.asyncEvaled); // false
  }
);

scope.muffins = 'Cougar ocicat and malkin and lynx or american bobtail, american shorthair.';
scope.$digest();
console.log("DIGEST: asyncEvaled: " + scope.asyncEvaled); //true

scope.$evalAsync(function(scope) {
  scope.asyncEvaled = false;
});

setTimeout(function() {
  console.log("setTimeout: asyncEvaled: " + scope.asyncEvaled); //true
}, 1000);

var postDigestInvoked = false;

scope.$$postDigest(function() {
  postDigestInvoked = true;
});

scope.$digest();
console.log('postDigestInvoked: ' + postDigestInvoked); //true

scope.muffins = 'Sphynx munchkin tomcat.';

scope.$watch(
  function(scope) {
    return scope.counterValue;
  },
  function(newValue, oldValue, scope) {
    scope.counterRef++;
  }
);

scope.$watch(
  function(scope) {
    return scope.counterRef;
  },
  function(newValue, oldValue, scope) {
    scope.counterValue++;
  }
);

scope.$digest(); // should be an error because of watchers look each other

