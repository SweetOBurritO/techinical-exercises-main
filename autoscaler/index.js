const RequestCountCollector = require("./RequestCountCollector");
const RequestCountReporter = require("./RequestCountReporter");
const RequestCountHandler = require("./RequestCountHandler");
const startAutoScaler = require("./autoscaler");

const requestReporter = new RequestCountReporter({ objectMode: true });
const requestCollector = new RequestCountCollector();
const requestHandler = new RequestCountHandler(requestReporter);

requestCollector.on("data", requestHandler.collect);

requestReporter.on("readyToReceive", requestHandler.report);

// Do not change/remove the code below this line
startAutoScaler(requestCollector, requestReporter);
