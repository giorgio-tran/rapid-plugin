/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from "react";
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
import worker from "./worker/script";
import { createWebWorker } from "./worker/webWorker";
import { useWebWorker } from "./worker/useWebWorker";
import LoadingSpinner from "./components/LoadingSpinner";

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
      text: "Mesonet Temperature vs. Sage Node Temperature",
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: "Time (MM/DD/YY HH:MM AM/PM)",
      },
      // ticks: {
      //   autoSkip: true,
      //   maxTicksLimit: 20,
      // }
    },
    y: {
      title: {
        display: true,
        text: "Temperature (C)",
      },
    },
  },
};

function App() {
  const [mesonetData, setMesonetData] = useState<any>(null);
  const workerInstance = useMemo(() => createWebWorker(worker), []);

  const { result, startProcessing } = useWebWorker(workerInstance);

  async function getMesonetData() {
    const res = await fetch(
      `https://api.synopticdata.com/v2/stations/timeseries?&stid=004HI&units=metric,speed|kph,pres|mb&recent=1440&24hsummary=1&qc_remove_data=off&qc_flags=on&qc_checks=all&hfmetars=1&showemptystations=1&precip=1&token=07dfee7f747641d7bfd355951f329aba
      `
    );
    // console.log("mesonet token", import.meta.env.VITE_MESONET_PUBLIC_TOKEN);
    const data = await res.json();
    //console.log("mesonet data", data);

    const date_time = data?.STATION[0].OBSERVATIONS?.date_time?.map(
      (date: string) => {
        return new Date(date).toLocaleTimeString([], {
          month: "2-digit",
          day: "2-digit",
          year: "2-digit",
          minute: "2-digit",
          hour: "2-digit",
        });
      }
    );

    const air_temp = data?.STATION[0].OBSERVATIONS?.air_temp_set_1?.map(
      (temp: number) => {
        return temp;
      }
    );

    if (date_time?.length !== air_temp?.length) {
      console.log("date_time and air_temp are not the same length");
      return;
    }

    const formattedData = date_time?.map((date: string, index: number) => {
      return {
        x: date,
        y: air_temp[index],
      };
    });

    setMesonetData(formattedData);
  }

  function getDatesForPast24Hours() {
    const dates = [];
    const now = new Date();
    now.setMinutes(Math.floor(now.getMinutes() / 5) * 5); // Round down to nearest 5 minutes
    now.setSeconds(0); // Reset seconds and milliseconds
    now.setMilliseconds(0);
    for (let i = 0; i <= 24 * 60; i += 5) {
      const date = new Date(now.getTime() - i * 60 * 1000);
      const formattedDate = date.toLocaleTimeString([], {
        month: "2-digit",
        day: "2-digit",
        year: "2-digit",
        minute: "2-digit",
        hour: "2-digit",
      });
      dates.push(formattedDate);
    }
    //console.log("dates", dates);
    return dates.reverse();
  }

  useEffect(() => {
    getMesonetData();
    startProcessing({ num: 10 });
  }, [startProcessing]);

  return (
    <div>
      {/* <button
        onClick={() => {
          startProcessing({ num: 10 });
        }}
      >
        START PROCESSING
      </button> */}
      {mesonetData && result ? (
        <Line
          options={options}
          data={{
            labels: getDatesForPast24Hours(),
            datasets: [
              {
                label: "Mesonet",
                data: mesonetData,
                borderColor: "rgb(255, 99, 132)",
                backgroundColor: "rgba(255, 99, 132, 0.5)",
              },
              {
                label: "Sage Node",
                data: (result as [])?.map((data: any) => {
                  //console.log("sage node date", data.timestamp);
                  return {
                    x: new Date(data.timestamp).toLocaleTimeString([], {
                      month: "2-digit",
                      day: "2-digit",
                      year: "2-digit",
                      minute: "2-digit",
                      hour: "2-digit",
                    }),
                    y: data.value,
                  };
                }),
                borderColor: "rgb(99, 255, 132)",
                backgroundColor: "rgba(99, 255, 132, 0.5)",
              },
            ],
          }}
        />
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );
}

export default App;
