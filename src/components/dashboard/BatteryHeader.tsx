import React from "react";
import { Battery } from "../../models/battery";

interface IBatteryHeader {
  battery: Battery;
}

const BatteryHeader = ({ battery }: IBatteryHeader) => {
  return (
    <div className="battery-info">
      <div>
        <h3>{battery.name}</h3>
        {battery.type ? <p>Type: {battery.type}</p> : null}
        {battery.description ? <p>Description: {battery.description}</p> : null}
      </div>
      <div className="battery-buttons">
        <button>Edit</button>
        <button>Delete</button>
      </div>
    </div>
  );
};

export default BatteryHeader;