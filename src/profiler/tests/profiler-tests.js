YUI.add('profiler-tests', function(Y) {

    var Assert = Y.Assert;
    var Profiler = Y.Profiler;
    
    //-------------------------------------------------------------------------
    // Information needed to run tests
    //-------------------------------------------------------------------------

    var testObject = {
    
        factorial : function (num){
            if (num > 1) {
                return num * testObject.factorial(num-1);
            } else {
                return 1;
            }
        },
        
        add : function (iterations){
            var sum = 0;
            for (var i=0; i < iterations; i++){
                sum++;
            }
        }    
    };
    
    var root = {};
    root.SuperType = function(){
        this.name = "SuperType";
    }
    
    root.SuperType.prototype.getName = function(){
        return this.name;
    };
    
    root.SubType = function(){
        this.age = 29;
        root.SubType.superclass.constructor.call(this);
    }
    
    Y.extend(root.SubType, root.SuperType, {    
        getAge : function (){
            return this.age;
        }
    });
    
    
    //-------------------------------------------------------------------------
    // Base Test Suite
    //-------------------------------------------------------------------------
    
    var suite = new Y.Test.Suite("Profiler Tests");
    
    //-------------------------------------------------------------------------
    // Test Case for basic function profiling
    //-------------------------------------------------------------------------
    
    suite.add(new Y.Test.Case({
    
        name : "Profiler Registration Tests",
        
        tearDown: function(){
            Profiler.clear();
        },
        
        //---------------------------------------------------------------------
        // Special assertions for profiler
        //---------------------------------------------------------------------
    
        assertFunctionIsRegistered : function (fullFuncName, shortFuncName, owner, originalFunction, newFunction){
            var containerFunc = Profiler.getOriginal(fullFuncName);
            Assert.areNotEqual(originalFunction, newFunction, fullFuncName + " function was not replaced.");
            Assert.areEqual(originalFunction, containerFunc, "Original " + fullFuncName + " function was not stored.");
            Assert.areEqual(originalFunction.prototype, containerFunc.prototype, fullFuncName + " prototype was not copied.");
            Assert.areEqual(shortFuncName, containerFunc.__yuiFuncName, fullFuncName + " function name was not stored.");
            Assert.areEqual(owner, containerFunc.__yuiOwner, "Owner for " + fullFuncName + "was not stored.");
            Assert.isObject(Profiler.getReport(fullFuncName), "Report for " + fullFuncName + " function was not created.");
        
        },
        
        assertFunctionIsNotRegistered : function(fullFuncName, shortFuncName, owner, originalFunction, newFunction){
            Assert.areEqual(originalFunction, newFunction, "Original " + fullFuncName + " function was not placed back on owner.");
            Assert.isUndefined(Profiler.getOriginal(fullFuncName), "Container for original " + fullFuncName + " function was not destroyed.");        
        },
        
        //---------------------------------------------------------------------
        // Tests
        //---------------------------------------------------------------------
    
        testInstrument: function(){
            var original = function() { return "Hello"; };
            var instrumented = Profiler.instrument("hello", original);
            
            this.assertFunctionIsRegistered("hello", "hello", null, original, instrumented);
        
        
        },
    
        testRegisterFunction : function (){
        
            var originalFunction = testObject.factorial;
            var fullFuncName = "testObject.factorial";
            
            Profiler.registerFunction(fullFuncName, testObject);
            
            this.assertFunctionIsRegistered(fullFuncName, "factorial", testObject, originalFunction, testObject.factorial);

            Profiler.unregisterFunction(fullFuncName);
            
            this.assertFunctionIsNotRegistered(fullFuncName, "factorial", testObject, originalFunction, testObject.factorial);
        
        },
        
        testRegisterGlobalFunction : function (){
        
            var originalFunction = getMessage;
            var fullFuncName = "getMessage";
            
            Profiler.registerFunction(fullFuncName, window);
            
            this.assertFunctionIsRegistered(fullFuncName, "getMessage", window, originalFunction, getMessage);

            Profiler.unregisterFunction(fullFuncName);
            
            this.assertFunctionIsNotRegistered(fullFuncName, "getMessage", window, originalFunction, getMessage);
        
        },
        
        testRegisterGlobalFunctionOnGlobalObject : function (){
        
            var originalFunction = myObject.getName;
            var fullFuncName = "myObject.getName";
            
            Profiler.registerFunction(fullFuncName);
            
            this.assertFunctionIsRegistered(fullFuncName, "getName", myObject, originalFunction, myObject.getName);

            Profiler.unregisterFunction(fullFuncName);
            
            this.assertFunctionIsNotRegistered(fullFuncName, "getName", myObject, originalFunction, myObject.getName);
        
        },
        
        testRegisterObject : function (){
            
            var funcNames = [];
            var originalFuncs = {};
        
            //get all methods
            for (var propName in testObject){
                if (typeof propName == "function"){
                    funcNames.push(propName);
                    originalFuncs[propName] = testObject[propName];
                }
            }
            
            Profiler.registerObject("testObject", testObject);
            
            Assert.isObject(Profiler.getOriginal("testObject"), "Object was not added to container.");
            
            //check each method
            for (var i=0; i < funcNames.length; i++){
                var fullFuncName = "testobject." + funcNames[i];
                var originalFunction = originalFuncs[funcNames[i]];
                this.assertFunctionIsRegistered(fullFuncName, funcNames[i], testObject, originalFunction, testObject[funcNames[i]]);
            }
            
            Profiler.unregisterObject("testObject");
            
            //check each method
            for (var i=0; i < funcNames.length; i++){
                var fullFuncName = "testobject." + funcNames[i];
                var originalFunction = originalFuncs[funcNames[i]];
                this.assertFunctionIsNotRegistered(fullFuncName, funcNames[i], testObject, originalFunction, testObject[funcNames[i]]);
            }            
            
            Assert.isUndefined(Profiler.getOriginal("testObject"), "Object was not removed from container.");
        
        },
        
        testRegisterConstructor : function (){
        
            var originalConstructor = root.SuperType;
            
            //gather stuff on the prototype
            var funcNames = [];
            var originalFuncs = {};
            
            for (var prop in root.SuperType.prototype){
                if (Y.Lang.isFunction(root.SuperType.prototype)){
                    funcNames.push(prop);
                    originalFuncs[prop] = root.SuperType.prototype[prop];
                }
                
            }
            
            Profiler.registerConstructor("root.SuperType", root);            
            this.assertFunctionIsRegistered("root.SuperType", "SuperType", root, originalConstructor, root.SuperType);
        
            //check each method
            for (var i=0; i < funcNames.length; i++){
                var fullFuncName = "root.SuperType.prototype." + funcNames[i];
                var originalFunction = originalFuncs[funcNames[i]];
                this.assertFunctionIsRegistered(fullFuncName, funcNames[i], root.SuperType.prototype, originalFunction, root.SuperType.prototype[funcNames[i]]);
            }                               
        
            Profiler.unregisterConstructor("root.SuperType");
                 
            //check each method
            for (var i=0; i < funcNames.length; i++){
                var fullFuncName = "root.SuperType.prototype." + funcNames[i];
                var originalFunction = originalFuncs[funcNames[i]];
                this.assertFunctionIsNotRegistered(fullFuncName, funcNames[i], root.SuperType.prototype, originalFunction, root.SuperType.prototype[funcNames[i]]);
            }    
            
            this.assertFunctionIsNotRegistered("root.SuperType", "SuperType", root, originalConstructor, root.SuperType);
        },
        
        testRegisterConstructorWithInheritance : function (){
        
            var originalConstructor = root.SubType;
            
            //gather stuff on the prototype
            var funcNames = [];
            var originalFuncs = {};
            
            for (var prop in root.SubType.prototype){
                if (Y.Lang.isFunction(root.SubType.prototype)){
                    funcNames.push(prop);
                    originalFuncs[prop] = root.SubType.prototype[prop];
                }
                
            }
            
            Profiler.registerConstructor("root.SubType", root);            
            this.assertFunctionIsRegistered("root.SubType", "SubType", root, originalConstructor, root.SubType);
        
            //check the superclass property
            Assert.isObject(root.SubType.superclass, "SubType superclass should be an object.");
            Assert.areEqual(root.SuperType, root.SubType.superclass.constructor, "SubType superclass constructor should be SuperType.");
        
            //check each method
            for (var i=0; i < funcNames.length; i++){
                var fullFuncName = "root.SubType.prototype." + funcNames[i];
                var originalFunction = originalFuncs[funcNames[i]];
                this.assertFunctionIsRegistered(fullFuncName, funcNames[i], root.SubType.prototype, originalFunction, root.SubType.prototype[funcNames[i]]);
            }                               
        
            Profiler.unregisterConstructor("root.SubType");
                 
            //check each method
            for (var i=0; i < funcNames.length; i++){
                var fullFuncName = "root.SubType.prototype." + funcNames[i];
                var originalFunction = originalFuncs[funcNames[i]];
                this.assertFunctionIsNotRegistered(fullFuncName, funcNames[i], root.SubType.prototype, originalFunction, root.SubType.prototype[funcNames[i]]);
            }    
            
            this.assertFunctionIsNotRegistered("root.SubType", "SubType", root, originalConstructor, root.SubType);
        },

        testFunctionAccuracy1 : function (){
        
            Profiler.registerFunction("testObject.factorial", testObject);
            
            var result = testObject.factorial(10);
            
            Profiler.unregisterFunction("testObject.factorial");
            
            Assert.areEqual(3628800, result, "Factorial result was incorrect.");
        
        
        },
        
        testFunctionAccuracy2 : function (){
        
            Profiler.registerConstructor("root.SubType", root);
            
            var o = new root.SubType();
            var age = o.getAge();
            var name = o.getName();
            
            Assert.areEqual(29, age, "o.age was incorrect.");
            Assert.areEqual("SuperType", name, "o.name was incorrect");
            
            var o2 = new root.SubType();
            age = o2.getAge();
            name = o2.getName();

            Assert.areEqual(29, age, "o2.Age was incorrect.");
            Assert.areEqual("SuperType", name, "o2.Name was incorrect");

            Profiler.unregisterConstructor("root.SubType");
        
        
        }    
    }));

    //-------------------------------------------------------------------------
    // Test Case for stopwatch functions
    //-------------------------------------------------------------------------
    
    suite.add(new Y.Test.Case({
    
        name : "Profiler Stopwatch Tests",
        
        
        tearDown: function(){
            Profiler.clear();
        },
        
        testStartStop: function (){
        
            Profiler.start("random.entry");
            
            for (var i=0; i < 10000; i++){}
            
            Profiler.stop("random.entry");

            var report = Profiler.getReport("random.entry");

            Assert.isObject(report, "Report should be an object.");
            Assert.areEqual(1, report.calls, "Call count should be 1.");
            Assert.isNumber(report.max, "Max should be a number.");
            Assert.isNumber(report.min, "Min should be a number.");
            Assert.isNumber(report.avg, "Average should be a number.");        
        },
        
        testStartStopPause : function (){
        
            Profiler.start("random.entry");
            
            for (var i=0; i < 10000; i++){}
            
            Profiler.pause("random.entry");

            for (var i=0; i < 10000; i++){}

            Profiler.start("random.entry");

            for (var i=0; i < 10000; i++){}

            Profiler.stop("random.entry");

            var report = Profiler.getReport("random.entry");

            Assert.isObject(report, "Report should be an object.");
            Assert.areEqual(1, report.calls, "Call count should be 1.");
            Assert.isNumber(report.max, "Max should be a number.");
            Assert.isNumber(report.min, "Min should be a number.");
            Assert.isNumber(report.avg, "Average should be a number.");   
      
        },
        
        testStartTwice : function () {
        
            Profiler.start("random.entry");
            
            for (var i=0; i < 10000; i++){}
            
            Profiler.stop("random.entry");

            Profiler.start("random.entry");

            for (var i=0; i < 10000; i++){}

            Profiler.stop("random.entry");

            var report = Profiler.getReport("random.entry");

            Assert.isObject(report, "Report should be an object.");
            Assert.areEqual(2, report.calls, "Call count should be 2.");
            Assert.isNumber(report.max, "Max should be a number.");
            Assert.isNumber(report.min, "Min should be a number.");
            Assert.isNumber(report.avg, "Average should be a number."); 
        }
    
        
    
    }));        
    
    //-------------------------------------------------------------------------
    // Test Case for report data
    //-------------------------------------------------------------------------
    
    suite.add(new Y.Test.Case({
    
        name : "Profiler Report Data Tests",

        testGetReport : function (){
        
            Profiler.registerFunction("testObject.factorial", testObject);
            
            testObject.factorial(10);
            
            var report = Profiler.getReport("testObject.factorial");
            Profiler.unregisterFunction("testObject.factorial");

            Assert.isObject(report, "Report should be an object.");
            Assert.isNumber(report.calls, "Call count should be a number.");
            Assert.isNumber(report.max, "Max should be a number.");
            Assert.isNumber(report.min, "Min should be a number.");
            Assert.isNumber(report.avg, "Average should be a number.");        
        },
        
        testGetCallCount : function (){
        
            Profiler.registerFunction("testObject.factorial", testObject);
            
            testObject.factorial(10);
            
            var report = Profiler.getReport("testObject.factorial");
            var callCount = Profiler.getCallCount("testObject.factorial");
            Profiler.unregisterFunction("testObject.factorial");

            Assert.isObject(report, "Report should be an object.");
            Assert.areEqual(10, report.calls, "Report.calls is incorrect.");
            Assert.areEqual(10, callCount, "Call count is incorrect.");
      
        },

        testGetMath: function() {
            //No Asserts, just syntax checking..

            Profiler.registerFunction("testObject.factorial", testObject);
            
            testObject.factorial(10);
            
            Profiler.getReport("testObject.factorial");
            Profiler.getFunctionReport("testObject.factorial");
            Profiler.getAverage("testObject.factorial");
            Profiler.getMax("testObject.factorial");
            Profiler.getMin("testObject.factorial");
            Profiler.unregisterFunction("testObject.factorial");
            

        },
        
        testGetReport : function () {
        
            Profiler.registerConstructor("root.SubType", root);
            
            var o = new root.SubType();
            o.getAge();
            o.getName();
            
            var o2 = new root.SubType();
            o2.getAge();
            o2.getName();
            o2.getAge();
            o2.getName();
            o2.getName();
            
            var report = Profiler.getFullReport();
            
            Profiler.unregisterConstructor("root.SubType");
            
            Assert.isObject(report, "Report should be an object.");
            Assert.isObject(report["root.SubType"], "There should be an entry for root.SubType.");
            Assert.areEqual(2, report["root.SubType"].calls, "root.SubType should have a call count of 2.");
            //Assert.isObject(report["root.SubType.prototype"], "There should be an entry for root.SubType.prototype.");
            Assert.isObject(report["root.SubType.prototype.getAge"], "There should be an entry for getAge()");
            Assert.areEqual(3, report["root.SubType.prototype.getAge"].calls, "getAge() should have a call count of 3.");
            Assert.isObject(report["root.SubType.prototype.getName"], "There should be an entry for getName()");
            Assert.areEqual(4, report["root.SubType.prototype.getName"].calls, "getName() should have a call count of 4.");
        }
    
        
    
    }));    
    
    Y.Test.Runner.add(suite);

});
