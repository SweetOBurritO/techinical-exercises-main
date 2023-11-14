const EventEmitter = require('events');
const stream = require('stream');

class RequestCountReporter extends stream.Writable {
  constructor(options) {
    super(options);
    this._requestCountsBySecond = {};
    this._readyToReceive = false;
    this._readyInterval = setInterval(() => {
      this._readyToReceive = true;
      /**
       * @fires RequestCountReporter#readyToReceive
       */
      this.emit('readyToReceive');
      setTimeout(() => {
        this._readyToReceive = false;
      }, 400);
    }, 600);
  }

  _write(chunk, encoding, callback) {
    if (!chunk.secondPrecisionTime) {
      return callback(new Error('chunk.secondPrecisionTime is required'));
    }

    if (!this._readyToReceive) {
      return callback(new Error('Not ready to set'));
    }

    this._requestCountsBySecond[chunk.secondPrecisionTime] = chunk.count;
    return callback()
  }

  /**
   * Get the number of requests that occurred in a given second.
   *
   * @param {number} time - The epoch timestamp for which to get the request count. All requests that occurred within the second precision of this timestamp will be counted. For example,  a time of
   * 1670946352424 (2022-12-13T15:45:52.424Z) will return the number of requests that occurred between 1670946352000 (2022-12-13T15:45:52.000)  and 1670946352999 (2022-12-13T15:45:52.999Z).
   * @returns {number} - The number of requests that occurred within 1 second precision of the given timestamp.
   */
  getCountAtTime(time) {
    const secondPrecisionDate = new Date(time);
    secondPrecisionDate.setMilliseconds(0);
    const secondPrecisionTimestamp = secondPrecisionDate.getTime();
    return this._requestCountsBySecond[secondPrecisionTimestamp];
  }

  /**
   * Stop accepting request count data.
   */
  done() {
    this._readyToReceive = false;
    clearInterval(this._readyInterval);
  }
}

/**
 * @event RequestCountReporter#readyToReceive - Indicates that the reporter is ready to receive data
 */

module.exports = RequestCountReporter;
