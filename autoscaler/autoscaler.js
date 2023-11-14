const assert = require("assert");
const AUTOSCALE_THRESHOLD = 3000;

let queryTimeout;

module.exports = function startAutoScaler(requestCollector, requestReporter) {

  const reportedCountsBySecond = {};
  /**
   * @listens RequestCountCollector#end
   * @param {Object} collectedRequestsBySecond -  Object where the values are of type 'RequestCountCollector#data', keyed by a timestamp which represents the second in which all the counted requests were made
   * @param {Object} collectedRequestsBySecond.timestamp
   * @param {Object} collectedRequestsBySecond.count
   */
  requestCollector.on('end', (collectedRequestsBySecond) => {
    setTimeout(() => {
      clearInterval(queryTimeout);
      requestReporter.done();
      console.log('[Autoscaler]: Requests collected by RequestCountCollector - by second', collectedRequestsBySecond);
      console.log('[Autoscaler]: Requests reported by RequestCountReported  - by second', reportedCountsBySecond);
      assert(Object.values(reportedCountsBySecond).length);
      for (const reportedCountsByTimeKey in reportedCountsBySecond) {
        if (collectedRequestsBySecond[reportedCountsByTimeKey]) {
          assert.strictEqual(reportedCountsBySecond[reportedCountsByTimeKey] || 0, collectedRequestsBySecond[reportedCountsByTimeKey].count,
            `Reported vs collected request counts do not match for timestamp ${reportedCountsByTimeKey} (${new Date(Number(reportedCountsByTimeKey)).toISOString()}). Reported: ${reportedCountsBySecond[reportedCountsByTimeKey] || 0}. Collected: ${collectedRequestsBySecond[reportedCountsByTimeKey].count}`);
        }
      }
      console.log("[Autoscaler]: Congratulations, the autoscaler is working as expected!");
    }, 3500);
  })
  setTimeout(() => {
    queryTimeout = setInterval(() => {
      const twoSecondsAgo = Math.round((Date.now() - 2500) / 1000) * 1000;
      const count2SecondsAgo = requestReporter.getCountAtTime(twoSecondsAgo);
      reportedCountsBySecond[twoSecondsAgo] = count2SecondsAgo;
      if (count2SecondsAgo > AUTOSCALE_THRESHOLD) {
        console.log(`[Autoscaler]: Scaling up! Number of requests at ${twoSecondsAgo}: ${count2SecondsAgo} (Threshold=${AUTOSCALE_THRESHOLD})`);
      }
    }, 1000);
  }, 1000)
}
