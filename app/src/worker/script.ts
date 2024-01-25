/**
 * Uses web worker to send API call to prevent main thread from lagging.
 */
export default () => {
  async function getSageNodeData() {
    const res = await fetch("https://data.sagecontinuum.org/api/v1/query", {
      method: "POST",
      // headers: {
      //   "Content-Type": "application/json",
      // },
      body: JSON.stringify({
        start: "-24h",
        filter: {
          name: "env.temperature",
          vsn: "W097",
        },
      }),
    });

    const data = await res.text();
    // console.log("text data", data);
    const parsedData = data.split("\n").map((line) => {
      // console.log("line", line);
      if (line !== "") {
        return JSON.parse(line);
      }
    });
    // console.log("parsed data", parsedData);
    // const filteredParsedData = parsedData.filter((data) => data !== undefined);

    // Filter data to keep only the first point in each 5-minute interval
    let lastTimestamp =
      new Date(parsedData[0].timestamp).getTime() - 5 * 60 * 1000; // Initialize to 5 minutes before the first data point
    const filteredParsedData = parsedData.filter((dataPoint) => {
      if (dataPoint === undefined) return false;
      const currentTimestamp = new Date(dataPoint.timestamp).getTime();
      if (currentTimestamp - lastTimestamp >= 5 * 60 * 1000) {
        // 5 minutes in milliseconds
        const date = new Date(dataPoint.timestamp);
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        if (minutes % 5 === 0 && Math.abs(seconds - 0) < 60) {
          // Closest to the 5-minute mark
          lastTimestamp = currentTimestamp;
          return true;
        }
      }
      return false;
    });
    //console.log("filtered parsed data", filteredParsedData);

    return filteredParsedData;
  }

  self.addEventListener("message", async (e: MessageEvent) => {
    try {
      // const { num } = e.data;
      // TODO: Use event to pass query to API
      //console.log("e", e);
      console.log(e);

      console.time("Worker run");
      // const result = num;
      const result = await getSageNodeData();
      console.timeEnd("Worker run");
      return postMessage({ result });
    } catch (error) {
      return postMessage({ error });
    }
  });
};
