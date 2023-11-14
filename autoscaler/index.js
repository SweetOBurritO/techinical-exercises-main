const RequestCountCollector = require('./RequestCountCollector')
const RequestCountReporter = require("./RequestCountReporter");
const startAutoScaler = require('./autoscaler');


const requestCollector = new RequestCountCollector();
const requestReporter = new RequestCountReporter({objectMode: true});

/*
Your code here
*/


// Do not change/remove the code below this line
startAutoScaler(requestCollector, requestReporter);
