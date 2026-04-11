import { useState, useEffect, useRef } from 'react';
import { getCookie } from '../credentialValidation.jsx'
import './Calendar.css';

export const Calendar = () =>{
  const currentDate = new Date(); 
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [taskDates, setTaskDates] = useState([]);
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [isWindowOpen, setIsWindowOpen] = useState(false);

  const hasFetched = useRef(false);

  useEffect(() => {
    if(hasFetched.current) return;
    hasFetched.current = true;

    const id = localStorage.getItem("id");
    async function get_tasks(){
      const resTasks = await fetch(`http://localhost:8000/get_tasks?id=${id}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        }
      });
      const tasksData = await resTasks.json();
      setCalendarTasks(tasksData);
    }
    get_tasks();
  },[]);
  useEffect(() => {
    if (!calendarTasks) return;
    const dates = calendarTasks.map((task) => { return task.date; })
    setTaskDates(dates);
  },[calendarTasks]);
  /*
  useEffect(() => {
    console.log(selectedMonth,selectedYear);
  },[selectedMonth]) */
  const month_days = [31,28,31,30,31,30,31,31,30,31,30,31];
  const makeDate = ( year,month,day ) => {
    let dateMonth = month;
    let dateDay = day;
    if (month < 10){
      dateMonth = `0${month}`;
    }
    if (day < 10){
      dateDay = `0${day}`;
    }
    let selectedDate = `${year}-${dateMonth}-${dateDay}`;
    return selectedDate;
  }
  const PlaceMonthButtons = () => {
    return (
    <div className="calendar-grid">
      {Array.from({ length: month_days[selectedMonth] }, (_, i) => {
          return <button key={i} className={taskDates.includes(makeDate(selectedYear,selectedMonth+1,i+1)) 
            ? "has-task-info" : ""} onClick={() => { setIsWindowOpen(true) }}>{i+1}</button>
          })
        }
      { isWindowOpen && (
            <div className="window-overlay">
                <div className="window-modal">
                  <h2>Test</h2>
                  <button onClick={() => { setIsWindowOpen(false); }}>Close</button>
                </div>
            </div>
          )}
    </div>
    )
  }
  const setNewMonth = ( newMonth ) => {
  if (newMonth <= -1){
    setSelectedYear(selectedYear-1);
    setSelectedMonth(11);
  }
  else if (newMonth >= 11){
    setSelectedYear(selectedYear+1);
    setSelectedMonth(0);
  }
  else {
      setSelectedMonth(newMonth);
    }
  }

  const MoveMonthArrow = ( { state } ) => {
    if (state === "left"){
      return <button onClick={() => { setNewMonth(selectedMonth-1) }  }>{"<--"}</button>
    }
    else {
      return <button onClick={() => { setNewMonth(selectedMonth+1) }  }>{"-->"}</button>
    }
  }
  //console.log(calendarTasks, taskDates);
  return <div className="center-calendar">
    <div><MoveMonthArrow state="left"/> {selectedMonth+1} {selectedYear} <MoveMonthArrow state="right"/></div>
    <PlaceMonthButtons/>
  </div>
} 
