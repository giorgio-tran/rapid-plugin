import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: true,
      text: "Chart.js Line Chart",
    },
  },
};

function App() {
  const [sageData, setSageData] = useState<any>(null);
  const [mesonetData, setMesonetData] = useState<any>(null);

  async function getMesonetData() {
    const res = await fetch(
      `https://api.synopticdata.com/v2/stations/timeseries?&stid=004HI&units=metric,speed|kph,pres|mb&recent=1440&24hsummary=1&qc_remove_data=off&qc_flags=on&qc_checks=all&hfmetars=1&showemptystations=1&precip=1&token=07dfee7f747641d7bfd355951f329aba
      `
    );
    // console.log("mesonet token", import.meta.env.VITE_MESONET_PUBLIC_TOKEN);
    const data = await res.json();
    // console.log("mesonet data", data);
    setMesonetData(data);
  }

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
    setSageData(filteredParsedData);
  }

  useEffect(() => {
    getMesonetData();
    getSageNodeData();
  }, []);
  return (
    <div>
      {mesonetData && (
        <Line
          options={options}
          data={{
            labels: mesonetData?.STATION[0].OBSERVATIONS?.date_time?.map(
              (date: string) => {
                return new Date(date).toLocaleTimeString();
              }
            ),
            datasets: [
              {
                label: "Mesonet",
                data: mesonetData?.STATION[0].OBSERVATIONS?.air_temp_set_1?.map(
                  (temp: number) => {
                    return temp;
                  }
                ),
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.5)",
              },
            ],
          }}
        />
      )}
      {sageData && (
        <Line
          options={options}
          data={{
            labels: sageData?.map((data: any) => {
              return new Date(data.timestamp).toLocaleTimeString();
            }),
            datasets: [
              {
                label: "Sage Node",
                data: sageData?.map((data: any) => {
                  return data.value;
                }),
                borderColor: "rgb(99, 255, 132)",
                backgroundColor: "rgba(99, 255, 132, 0.5)",
              },
            ],
          }}
        />
      )}
    </div>
  );
}

export default App;
