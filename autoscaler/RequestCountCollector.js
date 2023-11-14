const EventEmitter = require('events');


class RequestCountCollector extends EventEmitter {
  constructor() {
    super();
    this._requestsBySecond = {};
    this._countInterval = setInterval(() => {
      const currentCount = {
        timestamp: Date.now(), count: Math.floor(Math.random() * 10) * 100,
      };

      const secondPrecisionDate = new Date(currentCount.timestamp);
      secondPrecisionDate.setMilliseconds(0);
      const secondPrecisionTimestamp = secondPrecisionDate.getTime();

      if (this._requestsBySecond[secondPrecisionTimestamp]) {
        this._requestsBySecond[secondPrecisionTimestamp].count += currentCount.count;
      } else {
        this._requestsBySecond[secondPrecisionTimestamp] = {count: currentCount.count}
      }

      /**
       *@fires RequestCountCollector#data
       */
      this.emit('data', currentCount);
      console.log("[RequestCountCollector]: received data", {...currentCount});
    }, 125);

    setTimeout(() => {
      clearInterval(this._countInterval);

      /**
       * @fires RequestCountCollector#end
       */
      this.emit('end', this._requestsBySecond);
    }, 5000)
  }
}

module.exports = RequestCountCollector;

/**
 * Data event.
 *
 * @event RequestCountCollector#data
 * @type {object}
 * @property {number} timestamp - The epoch timestamp for when the request count was collected.
 * @property {boolean} count - The number of requests that occurred at that timestamp.
 */

/**
 * End Event
 * @event RequestCountCollector#end
 * @type {object}
 * @property {object} requestsBySecond - Number of requests keyed by a timestamp which represents the second in which the requests were collected
 */
