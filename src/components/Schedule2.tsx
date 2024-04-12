import React from "react";
import "./Schedule2.css";
import Navbar from "./NavBar";
import {
  EventApi,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { createEventId, initialize_initial_events } from "./event-utils";
import { getLoadsByUserID } from "../frontend-services/loads.services";
import {
  createSchedule,
  deleteSchedule,
  getScheduleByLoadID,
} from "../frontend-services/schedule.services";
import { Schedule } from "../models/schedule";
import { Load } from "../models/loads";

const userId = JSON.parse(sessionStorage.getItem("user") || "{}")?.id || "";

interface ScheduleAppState {
  weekendsVisible: boolean;
  currentEvents: EventApi[];
  loadData: Load[];
  scheduleData: Schedule[];
  finishedLoading: boolean;
}

export default class Schedule2 extends React.Component<{}, ScheduleAppState> {
  async componentDidMount() {
    if (this.state.loadData.length > 0) {
      return;
    }
    // Make first two requests
    const [Loadresponse] = await Promise.all([getLoadsByUserID(userId)]);

    // Make third request using responses from the first two

    const loads = Loadresponse.loads;
    let allSchedules: any[] = [];
    const fetchSchedules: Promise<Schedule>[] = [];

    loads.forEach(async (load: Load) => {
      fetchSchedules.push(getScheduleByLoadID(load.Id));
    });

    allSchedules = await Promise.all(fetchSchedules);

    allSchedules = allSchedules
      .map((schedules) => schedules.schedule)
      .flatMap((val) => val)
      .map((schedule) => ({
        Id: schedule.Id,
        allDay: false,
        Dayofweek: schedule.dayofweek,
        editable: true,
        End: schedule.EndTime,
        StartRecur: schedule.StartRecur,
        EndRecur: schedule.EndRecur,
        Start: schedule.StartTime,
        loadConsumption: loads.filter(
          (load: Load) => load.Id === schedule.loadID._key.path.segments[6]
        )[0].Powerusage,
        Title: loads.filter(
          (load: Load) => load.Id === schedule.loadID._key.path.segments[6]
        )[0].Name,
      }));

    // Update state once with all 3 responses
    this.state.scheduleData = allSchedules;
    this.setState({ scheduleData: allSchedules, loadData: loads });
    this.state.finishedLoading = true;
  }
  state: ScheduleAppState = {
    weekendsVisible: true,
    currentEvents: [],
    scheduleData: [],
    loadData: [],
    finishedLoading: false,
  };
  render() {
    if (!this.state.finishedLoading) {
      return <div className="loading">Loading Calendar...</div>;
    }
    return (
      <body className="Body">
        <div className="Header">
          <Navbar />
        </div>
        <div className="Mainbody">
          <div className="Sidebar">{this.renderSidebar()}</div>
          <div className="Calendar">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "timeGridDay,timeGridWeek,dayGridMonth",
              }}
              initialView="timeGridWeek"
              editable={false}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={false}
              droppable={false}
              handleWindowResize={true}
              weekends={this.state.weekendsVisible}
              // initialEvents={initialize_initial_events(this.state.scheduleData)} // alternatively, use the `events` setting to fetch from a feed
              initialEvents={initialize_initial_events(this.state.scheduleData)}
              select={this.handleDateSelect}
              eventContent={renderEventContent} // custom render function
              eventClick={this.handleEventClick}
              eventsSet={this.handleEvents} // called after events are initialized/added/changed/removed
              eventChange={this.handleEventChange}
              /* you can update a remote database when these fire:
                              eventAdd={function(){}}
                              eventRemove={function(){}}
                              */
            />
          </div>
        </div>
      </body>
    );
  }

  renderSidebar() {
    return (
      <div className="Schedule-sidebar">
        <div className="Schedule-sidebar-section">
          <h2>Schedule Options</h2>
        </div>
        <div id="Container" className="Schedule-sidebar-section"></div>
        <button
          className="recur"
          id="recur"
          onClick={() =>
            (document.getElementById("modal") as HTMLDialogElement).showModal()
          }
        >
          Add Recurring Event
        </button>
        <button
          className="recur"
          id="changes"
          onClick={() => optimizeBattery(this.state.scheduleData)}
        >
          Optimize Calendar
        </button>
        <dialog id="modal" className="modal">
          <span className="Title">Add a Recurring Event</span>
          <button
            className="exit"
            id="closemodal"
            onClick={() =>
              (document.getElementById("modal") as HTMLDialogElement).close()
            }
          >
            X
          </button>
          <div className="info">
            <div className="q1">
              Please select what type of load this is:
              <select id="select-loads" className="loads">
                <>
                  {this.state.loadData.map((load: Load) => (
                    <option value={load.Id}>{load.Name}</option>
                  ))}
                  ;
                </>
              </select>
            </div>
            <div className="q2">
              Please enter what date you want the schedule to start:
              <input id="load-startdate" className="input1" type="date"></input>
            </div>
            <div className="q3">
              Please enter what date you want the schedule to end:
              <input id="load-enddate" className="input2" type="date"></input>
            </div>
            <div className="q2">
              Please enter what time you want the load to start:
              <input
                id="load-start"
                className="input3"
                onChange={LoadShift}
                type="time"
              ></input>
            </div>
            <div className="q3">
              Please enter what time you want the load to end:
              <input
                id="load-end"
                className="input4"
                onChange={LoadShift}
                type="time"
              ></input>
            </div>
            <div className="q4">
              Please specify what day(s) you want the event to run on
            </div>
            <div className="day">
              <div>
                <label>Mon</label>
                <label>Tue</label>
                <label>Wed</label>
                <label>Thu</label>
                <label>Fri</label>
                <label>Sat</label>
                <label>Sun</label>
              </div>
              <div>
                <input id="mo" value="mon" type="checkbox"></input>
                <input id="tu" value="tue" type="checkbox"></input>
                <input id="we" value="wed" type="checkbox"></input>
                <input id="th" value="thu" type="checkbox"></input>
                <input id="fr" value="fri" type="checkbox"></input>
                <input id="sa" value="sat" type="checkbox"></input>
                <input id="su" value="sun" type="checkbox"></input>
              </div>
            </div>
            <div id="message" className="msg"></div>
            <div>
              <button className="AddNewEvent" onClick={AddScheduleEvent}>
                Add New Recurring Event
              </button>
            </div>
          </div>
        </dialog>
        <div className="Optimized" id="optimizedisplay"></div>
      </div>
    );
  }

  handleWeekendsToggle = () => {
    this.setState({
      weekendsVisible: !this.state.weekendsVisible,
    });
  };
  handleDateSelect = (selectInfo: DateSelectArg) => {
    let title = prompt("Please enter a new title for your event");
    let calendarApi = selectInfo.view.calendar;

    calendarApi.unselect(); // clear date selection

    if (title) {
      calendarApi.addEvent({
        id: createEventId(),
        title,
        start: selectInfo.startStr,
        end: selectInfo.endStr,
        allDay: selectInfo.allDay,
      });
    }
  };

  handleEventClick = (clickInfo: EventClickArg) => {
    if (
      confirm(
        `Are you sure you want to delete the event '${clickInfo.event.title}'`
      )
    ) {
      deleteSchedule(clickInfo.event._def.publicId);
      window.location.reload();
    }
  };

  handleEvents = (events: EventApi[]) => {
    this.setState({
      currentEvents: events,
    });
  };

  handleEventChange = () => {};
}

const AddScheduleEvent = () => {
  const loadId = (document.getElementById("select-loads") as HTMLSelectElement)
    .value;
  const starttime = (document.getElementById("load-start") as HTMLInputElement)
    .value;
  const endtime = (document.getElementById("load-end") as HTMLInputElement)
    .value;
  const startday = (
    document.getElementById("load-startdate") as HTMLInputElement
  ).value;
  const endday = (document.getElementById("load-enddate") as HTMLInputElement)
    .value;

  const daysOfWeek: boolean[] = [];
  daysOfWeek[1] = (document.getElementById("mo") as HTMLInputElement).checked;
  daysOfWeek[2] = (document.getElementById("tu") as HTMLInputElement).checked;
  daysOfWeek[3] = (document.getElementById("we") as HTMLInputElement).checked;
  daysOfWeek[4] = (document.getElementById("th") as HTMLInputElement).checked;
  daysOfWeek[5] = (document.getElementById("fr") as HTMLInputElement).checked;
  daysOfWeek[6] = (document.getElementById("sa") as HTMLInputElement).checked;
  daysOfWeek[0] = (document.getElementById("su") as HTMLInputElement).checked;

  const scheduleData: Schedule = {
    Id: "",
    Start: starttime,
    StartRecur: startday,
    End: endtime,
    EndRecur: endday,
    Dayofweek: daysOfWeek,
    Title: "",
    loadConsumption: 0,
    Repeat: true,
  };

  createSchedule(loadId, scheduleData);
  window.location.reload();
};

const LoadShift = () => {
  const endtime = (document.getElementById("load-end") as HTMLInputElement)
    .value;
  const starttime = (document.getElementById("load-start") as HTMLInputElement)
    .value;
  if (
    (starttime <= "07:00" || starttime >= "19:00") &&
    (endtime <= "07:00" || endtime >= "19:00")
  ) {
    //7 to 7
    (document.getElementById("message") as HTMLDivElement).textContent =
      "Thank you for using the load during low peak hours";
  } else if (
    starttime > "11:00" &&
    starttime <= "17:00" &&
    endtime > "11:00" &&
    endtime <= "17:00"
  ) {
    //11 to 5
    (document.getElementById("message") as HTMLDivElement).textContent =
      "Please consider using this load during low peak hours (7pm - 7am) on weekdays";
  } else {
    //7am - 11am + 5pm - 7am
    (document.getElementById("message") as HTMLDivElement).textContent =
      "Please consider using this load during low or mid peak hours (7pm - 7am) or (11am - 5pm) on weekdays";
  }
};

const optimizeBattery = (Loadschedule: Schedule[]) => {
  let capacity = 100000; //grab from database capacitance
  let batchargespeed = 5; //grab from database energyGeneration
  let loadusetimes = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]; //Measures how much electricity was used by a load at that hour

  //Grab today's date and tomorrow's date
  let datdate = new Date();
  let dateTime = new Date().toISOString();
  datdate.setDate(datdate.getDate() + 1);
  let tomorrowTime = datdate.toISOString();
  let today = dateTime.split("T")[0];
  let tomorrow = tomorrowTime.split("T")[0];
  let tomorrowDate = datdate.toDateString().split(" ")[0];

  //Check tomorrow's day
  let day = -1;
  if (tomorrowDate == "Sat") {
    day = 6;
  } else if (tomorrowDate == "Sun") {
    day = 0;
  } else if (tomorrowDate == "Mon") {
    day = 1;
  } else if (tomorrowDate == "Tue") {
    day = 2;
  } else if (tomorrowDate == "Wed") {
    day = 3;
  } else if (tomorrowDate == "Thu") {
    day = 4;
  } else if (tomorrowDate == "Fri") {
    day = 5;
  }

  //Loop through schedule and find every schedule which is running tomorrow
  Loadschedule.forEach((schedule) => {
    if (
      schedule.StartRecur <= today &&
      schedule.EndRecur > tomorrow &&
      schedule.Dayofweek[day]
    ) {
      let hour = schedule.Start.split(":")[0];
      let min = schedule.Start.split(":")[1];
      let endhour = schedule.End.split(":")[0];
      let endminute = schedule.End.split(":")[1];

      //Adjustments for first hour (if start not rounded to a xx:00)
      let difference = 60 - parseInt(min);
      loadusetimes[parseInt(hour)] =
        loadusetimes[parseInt(hour)] +
        (difference / 60) * schedule.loadConsumption;
      hour = (parseInt(hour) + 1).toString();

      //Until we reach the last hour
      while (parseInt(hour) < parseInt(endhour)) {
        loadusetimes[parseInt(hour)] =
          loadusetimes[parseInt(hour)] + schedule.loadConsumption;
        hour = (parseInt(hour) + 1).toString();
      }

      //Adjustments for last hour (if end not rounded to a xx:00)
      difference = parseInt(endminute);
      loadusetimes[parseInt(hour)] =
        loadusetimes[parseInt(hour)] +
        (difference / 60) * schedule.loadConsumption;

      //Display the values of the array
      //console.log(loadusetimes)
    }
  });
  //Maria's algorithm here
  const batterySoC: number[] = new Array(24).fill(0); //battery state of charge
  const chargingStatus: number[] = new Array(24).fill(0); //charging status

  // Charging schedule
  const chargingTimes: [number, number][] = [
    [0, 7],
    [19, 24],
  ];

  // Iterate over each hour and calculate battery state of charge
  for (let hour = 0; hour < 24; hour++) {
    const withinChargingTimes = chargingTimes.some(([start, end]) => {
      // Check if the current hour falls within the charging times
      return (
        (hour >= start && hour < end) ||
        (start > end && (hour >= start || hour < end))
      );
    });
    // Calculate energy consumed by loads at this hour
    let energyConsumed = loadusetimes[hour] || 0; // Calculate energy consumed by loads at this hour

    let newSoC = batterySoC[(hour === 0 ? 24 : hour) - 1]; // Update battery state of charge for this hour & initialize with previous SoC
    let isCharging = 0;

    if (withinChargingTimes) {
      newSoC = Math.min(
        0.8 * capacity,
        newSoC + (batchargespeed / 100) * capacity
      ); // Charge to 80% if within charging times
      isCharging = 1;
    } else {
      if (newSoC < 0.3 * capacity) {
        // If not within charging times and SoC falls below 30%, charge another 5%
        newSoC = Math.min(
          0.8 * capacity,
          newSoC + (batchargespeed / 100) * capacity
        );
        isCharging = 1;
      }
    }
    newSoC = Math.max(0, newSoC - energyConsumed); // Subtract energy consumed
    newSoC = Math.min(0.8 * capacity, Math.max(0.2 * capacity, newSoC)); // Ensure battery SoC stays between 20% to 80%

    // Update battery state of charge for this hour
    batterySoC[hour] = newSoC;
    chargingStatus[hour] = isCharging;
  }

  //Code for adding the new schedules for charging
  let x = 0;
  let starttime = -1;
  let endtime = -1;
  let start = true; //Start not set yet
  let message = "Charge Schedule: <br>";
  while (x < 24) {
    if (chargingStatus[x] == 1 && x != 23) {
      //Check if charge status is true
      if (starttime == -1 && start) {
        //Check if we set a start time yet

        starttime = x; //Set starttime
        start = false; //Set state = set
      }
    } else if (!start || x == 23) {
      //If start was set and charging status was false, we have a charge cycle
      endtime = x;
      let startstring = "";
      let endstring = "";
      if (starttime < 10) {
        startstring = "0" + starttime.toString() + ":00";
      } else {
        startstring = starttime.toString() + ":00";
      }
      if (endtime < 10) {
        endstring = "0" + endtime.toString() + ":00";
      } else {
        endstring = endtime.toString() + ":00";
      }

      message = message + startstring + " - " + endstring + "<br>";

      //Reset variables
      starttime = -1;
      endtime = -1;
      start = true;
    }
    x = x + 1;
  }
  (document.getElementById("optimizedisplay") as HTMLDivElement).innerHTML =
    message;
};

function renderEventContent(eventContent: EventContentArg) {
  return (
    <>
      <i>{eventContent.event.title}</i>
    </>
  );
}
