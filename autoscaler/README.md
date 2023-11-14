# Technical Exercise: Help us write an autoscaler for our rest APIs

# The scenario

You have joined just the Synatic team, right in time to assist us with optimising for the cost/performance of our rest
API.
We have built the API to be highly scalable, which allows us to easily add more instances as required depending on
the amount of incoming traffic. We currently do this by keeping a close eye on a dashboard that shows the number of
requests we are serving at any given time and if the number of requests goes above a certain threshold, we
manually spin up more instances. This works _okay_ for the most part, but we want to automate this process so that
we are not always watching the dashboard and can instead focus on building new features for our customers. Luckily,
we have you to help us with that.

## The RequestCountCollector class

You and 2 other team members will be working on an autoscaler. There are 3 main parts to it and these will be split
among the 3 of you. One of your teammates has just finished work on the `RequestCountCollector` class, which is
responsible for collecting the number of requests that are being served by all the API instances at any given time.
The `RequestCountCollector` is responsible for passing that information to the other parts of the autoscaler. Everytime
an API instance reports the number of requests it is serving, the `RequestCountCollector` will fire off a `data` event
that conveys that information. The `data` event takes the following form:

```json
 {
  "timestamp": 1670956945383,
  "count": 4
}
```

* `timestamp {number}`  - the time at which the API instance sent the request count, as a unix epoch
* `count {number}` - the number of requests that were served by the API instance at that time

## The RequestCountReporter class

Your other teammate has also just finished his part, the `RequestCountReporter` class, which is responsible for
reporting the aggregated number of requests that have been served in a particular timeframe by all API instances - on
demand. One can query the `RequestCountReporter` for this information by calling the `getCountAtTime` method. This
method takes a timestamp as an argument and returns the number of requests that were served at that time, with _second_
precision. Second precision time is a timestamp that has been rounded down to the nearest second, by setting the
millisecond portion to 0. For example, if the timestamp is `1670956945383` (`2022-09-01T12:02:25.383Z`), the second
precision time would be `1670956945000` (`2022-09-01T12:02:25.000Z`). Likewise, the second precision time for
both`1670956946512` (`2022-09-01T12:02:26.512Z`) and `1670956946900` (`2022-09-01T12:02:26.900Z`)
would be `1670956946000` (`2022-09-01T12:02:26.000Z`). Before we can query the `RequestCountReporter` however, we need
to pass the data collected from the `RequestCountCollector` to the`RequestCountReporter`. This is where you come in.

### Writing to the RequestCountReporter

The `RequestCountReporter` is a [node stream](https://nodejs.org/api/stream.html), which means we can easily write the
data from the `RequestCountCollector` directly to it. Be careful though, the `RequestCountReporter` is often preoccupied
with other internal tasks and is not always ready to receive data. Luckily, it emits a `readyToReceive` event when it
is. Whenever the `readyToRecieve` event is fired, you have a window of about 400-500ms to write any
data to the stream. If you try to write data outside this window, the `RequestCountReporter` will
throw an error, and you will have to wait for the next `readyToReceive` event to write any data.
The `RequestCountReporter`expects the data written to it to be in the form:

```json
{
  "secondPrecisionTime": 1670956945000,
  "count": 4
}
```

* `secondPrecisionTime {number}` - the time at which the event was fired as a unix epoch, with _seconds_ precision
* `count {number}` - the number of requests that were served by the API instances during the secondPrecisionTime

Because the `RequestCountReporter` only reports request counts with one second precision, you will have to aggregate the
data and group all request counts that happened within the same second together, before feeding it to
the `RequestCountReporter`. For example, imagine you have the following 3 pieces of data coming in form the
`RequestCountCollector`:

```json5
{
  "timestamp": 1670956945383,
  // 2022-12-13T18:42:25.383Z
  "count": 4
}
```

```json5
{
  "timestamp": 1670956945402,
  // 2022-12-13T18:42:25.402Z
  "count": 2
}
```

```json5
{
  "timestamp": 1670956946112,
  // 2022-12-13T18:42:26.112Z
  "count": 1
}
```

To pass this data to the `RequestCountReporter` correctly, you will have to aggregate and group it by the
secondPrecisionTime:

```json5
{
  "secondPrecisionTime": 1670956945000,
  // 2022-12-13T18:42:25.000Z
  "count": 6
}
```

```json5
{
  "secondPrecisionTime": 1670956946000,
  // 2022-12-13T18:42:26.000Z
  "count": 1
}
```

If you do not group the data correctly, the `RequestCountReporter` is likely to report incorrect request counts when
queried.

### Your task

Update the `index.js` file to read data from the `RequestCountCollector` and write it to the `RequestCountReporter`.    
When the program starts, the autoscaler (`autscaler.js`) will be running in the background, constantly querying
the `RequestCountReporter` for the number of requests that were served at a particular time. You should make sure that
this data exists and is correct. The autoscaler will always ask for data that is at least 2 seconds old. This means,
from the time that the  `RequestCountCollector` fire off a `data` event, you will have about 2 seconds to write that
data to the `RequestCountReporter` before the autoscaler queries it. This gives you 1 second to wait for all the
data for that second to come in and another 1 second to commit it to the `RequestCountReporter`. You can assume that
within a given second, the `RequestCountReporter` will fire off at least 2 `readyToReceive` events. This means you
will have at least 2 chances every second to write data to the stream.

The program will run for 15 seconds. At the end of that 15 seconds, the `RequestCountCollector` will emit an `end` event
which carries with it an aggregated summary of all the data that was collected. The autoscaler will compare this summary
to what was reported by the `RequestCountReporter` to make sure that the data matches. If there is a mismatch, it will
throw an error of the form:

```
 Reported vs collected counts do not match for timestamp 1671025278000. Reported: 0. Collected: 100
```

Your solution should have no dependence on the `end` event emitted by the `RequestCountCollector`. It is only there to
help us see if all the data that left the`RequestCountCollector` made it to the `RequestCountReporter`.

### Some general notes

* If you want to install any external dependencies from npm, feel free to do so.
* Do not modify any other files except for package.json and index.js. You may create new files if you want.
* Automated tests are not requirement for this exercise, but feel free to add them you like.
* You will need at least nodejs to run the exercise
* To run the program, execute: `node index.js`
* If the program works as it should, this will be printed to the console:
  ```
  "[Autoscaler]: Congratulations, the autoscaler is working as expected!" 
  ```

Enjoy!
