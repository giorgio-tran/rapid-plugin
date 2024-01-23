 

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
    console.log("parsed data", parsedData);
    const filteredParsedData = parsedData.filter((data) => data !== undefined);
    return filteredParsedData;
  }

  self.addEventListener("message", async (e: MessageEvent) => {
    try {
      // const { num } = e.data;
      console.log("e", e);

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
