import React, { useState, useEffect } from "react";
import Chart from "chart.js/auto";
// @ts-ignore
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import "./Dashboard.css";
import NavBar from "../components/NavBar";
import {
  createBattery,
  getAllBatteries,
  simulateData,
} from "../frontend-services/dashboard.service.ts";
import { Battery } from "../models/battery.ts";
import BatteryHeader from "../components/Header/BatteryHeader.tsx";

// type Measurements = {
//   chargeRate: number;
//   current: number;
//   dischargeRate: number;
//   powerConsumption: number;
//   powerGeneration: number;
//   temperature: number;
//   time: Date;
//   voltageConsumption: number;
//   voltageGeneration: number;
// };

type BatteriesState = {
  batteryId: string;
  description?: string;
  name: string;
  type: string;
  measurements: [];
};

const Dashboard: React.FC = () => {
  const userId = JSON.parse(sessionStorage.getItem("user") || "{}")?.id || "";
  const [isModalOpen, setModalOpen] = useState(false);
  const [addedNewMeasurement, setAddedNewMeasurement] = useState(false);
  const [batteryInfo, setBatteryInfo] = useState({
    name: "",
    type: "",
    description: "",
    userId,
  });
  const [isBatteryAdded, setIsBatteryAdded] = useState(false);
  const [batteries, setBatteries] = useState<BatteriesState[]>([]);
  const [infoIconHovered, setInfoIconHovered] = useState(-1);

  useEffect(() => {
    getAllBatteries(userId).then((response) => {
      setBatteries(response.batteries);
    });
    setIsBatteryAdded(false);
    setAddedNewMeasurement(false);
  }, [isBatteryAdded, addedNewMeasurement]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setBatteryInfo((prevInfo) => ({ ...prevInfo, [name]: value }));
  };

  // const handleInfoIconClick = (index: number) => {
  //   setInfoIconClicked(infoIconClicked === index ? -1 : index);
  // };

  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setBatteryInfo({ name: "", type: "", description: "" }); // Reset input fields
  };

  const addBattery = () => {
    closeModal();
    createBattery(batteryInfo);
    setIsBatteryAdded(true);
  };

  const simulateMeasurements = (batteryId: string, userId: string) => {
    simulateData(batteryId, true, 1, userId);
    setAddedNewMeasurement(true);
  };

  useEffect(() => {
    batteries.forEach((battery, index) => {
      const canvas = document.getElementById(
        `powerChart${index}`
      ) as HTMLCanvasElement;
      const ctx = canvas?.getContext("2d");

      if (ctx && Chart.getChart(ctx)) {
        Chart.getChart(ctx).destroy();
      }

      if (ctx) {
        new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Power Consumption", "Power Generation"],
            datasets: [
              {
                label: "Power (W)",
                backgroundColor: ["#52eb97", "#98f679"],
                data: [
                  battery?.measurements[0]?.powerConsumption ?? 0,
                  battery?.measurements[0]?.powerGeneration ?? 0,
                ],
                barThickness: 30,
              },
            ],
          },
          options: {
            indexAxis: "y",
            scales: {
              x: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Power (W)",
                  font: {
                    family: "'Jost', sans-serif",
                    weight: "bold",
                  },
                },
                ticks: {
                  font: {
                    family: "'Jost', sans-serif",
                    weight: "bold",
                  },
                },
              },
              y: {
                ticks: {
                  font: {
                    family: "'Jost', sans-serif",
                    weight: "bold",
                  },
                },
              },
            },
            plugins: {
              legend: {
                display: false,
              },
            },
            responsive: true,
            maintainAspectRatio: false,
          },
        });
      }
    });
  }, [batteries]);

  return (
    <>
      <NavBar />
      <div className="bg"></div>
      <div className="dashboard">
        <h1>Battery Dashboard</h1>
        {/* <h2>Hi, Name!</h2> */}
        <p className="dashboard-text">
          Welcome to the Dashboard, the central hub for your energy journey. In
          real-time, monitor critical metrics such as State of Charge (SoC),
          State of Health (SoC), temperature, charge ratings, and power dynamics
          to gain a comprehensive analysis of your battery storage system.
        </p>
        <div>
          <button className="add-battery-button" onClick={openModal}>
            <span className="plus-icon">
              <i className="fas fa-plus" style={{ color: "white" }}></i>
            </span>{" "}
            Add Battery
          </button>
          {batteries.map((battery: Battery, index: number) => (
            <>
              <div className="button-container">
                <BatteryHeader battery={battery} />
                <button
                  className="measurements-button"
                  onClick={() =>
                    simulateMeasurements(battery.batteryId, userId)
                  }
                >
                  <i className="fas fa-sync"></i> Simulate Measurements
                </button>
              </div>
              <div className="card-container">
                <div className="card">
                  <div
                    className="info-icon"
                    onMouseEnter={() => setInfoIconHovered(index)}
                    onMouseLeave={() => setInfoIconHovered(-1)}
                  >
                    <i className="fas fa-info-circle"></i>
                  </div>
                  <div
                    className={
                      infoIconHovered === index ? "info-tag" : "info-tag hidden"
                    }
                  >
                    <p>
                      The State of Charge (SoC) indicates the current charge
                      level in your battery relative to its maximum capacity. A
                      higher SoC means more available energy.
                    </p>
                  </div>
                  <h3>State of Charge</h3>
                  <div className="progress-bar">
                    <CircularProgressbar
                      value={parseFloat(
                        (battery?.measurements[0]?.stateOfCharge ?? 0).toFixed(
                          2
                        )
                      )}
                      text={`${(
                        battery?.measurements[0]?.stateOfCharge ?? 0
                      ).toFixed(2)}%`}
                      className="progress-bar-state-of-charge"
                      strokeWidth={8}
                      styles={buildStyles({
                        textColor: "#333",
                        pathTransition: "none",
                        trailColor: "#eee",
                        backgroundColor: "#b19cd9",
                      })}
                    />
                  </div>
                  {/* <h4>HEALTH INDICATOR</h4> */}
                  {/* <p>The battery is in a moderate state</p> */}
                </div>
                <div className="card">
                  <div
                    className="info-icon"
                    onMouseEnter={() => setInfoIconHovered(index)}
                    onMouseLeave={() => setInfoIconHovered(-1)}
                  >
                    <i className="fas fa-info-circle"></i>
                  </div>
                  <div
                    className={
                      infoIconHovered === index ? "info-tag" : "info-tag hidden"
                    }
                  >
                    <p>
                      Temperature refers to the current temperature of your
                      battery. Extreme temperatures, either too high or too low,
                      can affect battery efficiency and lifespan.
                    </p>
                  </div>
                  <h3>Temperature</h3>
                  <div className="metric">
                    <p className="metric-value">
                      {parseFloat(
                        (battery?.measurements[0]?.temperature ?? 0).toFixed(2)
                      )}
                      K
                    </p>
                    <div className="temperature-icon">
                      <i className="fas fa-thermometer-half"></i>{" "}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div
                    className="info-icon"
                    onMouseEnter={() => setInfoIconHovered(index)}
                    onMouseLeave={() => setInfoIconHovered(-1)}
                  >
                    <i className="fas fa-info-circle"></i>
                  </div>
                  <div
                    className={
                      infoIconHovered === index ? "info-tag" : "info-tag hidden"
                    }
                  >
                    <p>
                      The Charge Rate indicates how quickly your battery
                      charges, while the Discharge Rate shows how rapidly it
                      supplies power.
                    </p>
                  </div>
                  <h3>Charge Rating</h3>
                  <div className="metric">
                    {/* <h4>• Charge Rate •</h4> */}
                    <p className="metric-value">
                      {battery?.measurements[0]?.chargeRate ?? 0}A
                    </p>
                    <div className="lightning-icon">
                      {" "}
                      {/* Corrected class name */}
                      <i className="fas fa-bolt"></i>
                    </div>
                  </div>
                  <div className="metric"></div>
                </div>

                <div className="card">
                  <div
                    className="info-icon"
                    onMouseEnter={() => setInfoIconHovered(index)}
                    onMouseLeave={() => setInfoIconHovered(-1)}
                  >
                    <i className="fas fa-info-circle"></i>
                  </div>
                  <div
                    className={
                      infoIconHovered === index ? "info-tag" : "info-tag hidden"
                    }
                  >
                    <p>
                      The State of Health (SoH) assesses your battery's overall
                      health and capacity compared to its original design, with
                      a higher SoH indicating better performance.
                    </p>
                  </div>
                  <h3>State of Health</h3>
                  <div className="progress-bar">
                    <CircularProgressbar
                      value={battery?.measurements[0]?.stateOfHealth ?? 0}
                      text={`${battery?.measurements[0]?.stateOfHealth ?? 0}%`}
                      className="progress-bar-soh"
                      strokeWidth={9}
                      styles={buildStyles({
                        textColor: "#333",
                        pathTransition: "none",
                        trailColor: "#eee",
                      })}
                    />
                  </div>
                  {/* <h4>CURRENT TEMPERATURE</h4> */}
                  {/* <p>The battery is in a normal state</p> */}
                </div>
                {/* Power generation/consumption chart card */}
              </div>
              <div className="card">
                <div
                  className="info-icon"
                  onMouseEnter={() => setInfoIconHovered(index)}
                  onMouseLeave={() => setInfoIconHovered(-1)}
                >
                  <i className="fas fa-info-circle"></i>
                </div>
                <div
                  className={
                    infoIconHovered === index ? "info-tag" : "info-tag hidden"
                  }
                >
                  <p>The power generation is. the power consumption is.</p>
                </div>
                <h3>Power Metrics</h3>
                <div>
                  <canvas
                    id={`powerChart${index}`}
                    style={{ width: "750px", height: "150px" }}
                  ></canvas>
                </div>
                {/* <div className="efficiency-status">
                  <p>The system is operating efficiently</p>
                </div> */}
              </div>
            </>
          ))}

          {isModalOpen && (
            <div className="modal-overlay">
              <div className="modal">
                <span className="close" onClick={closeModal}>
                  &times;
                </span>
                <h2>Add Battery</h2>
                <label htmlFor="batteryName">Battery Name:</label>
                <input
                  type="text"
                  id="batteryName"
                  name="name"
                  value={batteryInfo.name}
                  onChange={handleInputChange}
                />
                <label htmlFor="batteryType">Battery Type:</label>
                <input
                  type="text"
                  id="batteryType"
                  name="type"
                  value={batteryInfo.type}
                  onChange={handleInputChange}
                />
                <label htmlFor="batteryDescription">Description:</label>
                <input
                  type="text"
                  id="batteryDescription"
                  name="description"
                  value={batteryInfo.description}
                  onChange={handleInputChange}
                />
                <button onClick={addBattery}>Add Battery</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
export default Dashboard;
