const toSecondPrecision = require("./utils/toSecondPrecision");

const SERVICE_NAME = "[RequestCountHandler]";

class RequestCountHandler {
  aggregatedData = {};
  constructor(requestReporter) {
    this.requestReporter = requestReporter;
  }

  collect = ({ timestamp, count }) => {
    console.log(SERVICE_NAME, "': data aggregated ", { timestamp, count });
    const secondPrecisionTimestamp = toSecondPrecision(timestamp);

    if (this.aggregatedData[secondPrecisionTimestamp]) {
      this.aggregatedData[secondPrecisionTimestamp] += count;
      return;
    }

    this.aggregatedData[secondPrecisionTimestamp] = count;
  };

  report = () => {
    Object.entries(this.aggregatedData).forEach(
      ([secondPrecisionTime, count]) => {
        const currentSecond = toSecondPrecision(Date.now());

        if (currentSecond === Number(secondPrecisionTime)) {
          console.log(
            SERVICE_NAME,
            ": skipping report, second is not complete"
          );
          return;
        }

        console.log(SERVICE_NAME, ": Reporting: ", {
          secondPrecisionTime,
          count,
        });

        this.requestReporter.write({
          secondPrecisionTime,
          count,
        });
        delete this.aggregatedData[secondPrecisionTime];
      }
    );
  };
}

module.exports = RequestCountHandler;
