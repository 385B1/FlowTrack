import { useState, useEffect, useRef } from 'react';
import { getCookie } from '../credentialValidation.jsx'
import './Calendar.css';

const ShowCalendarTasks = ( { calendarTasks, currentDate, setIsWindowOpen } ) => {
  console.log(calendarTasks, currentDate)
  const filteredTasks = calendarTasks.filter((task)=>{
    return task.date === currentDate;
  })
  return (
    <div>
      <div className="modal-header">
        <div className="modal-header-text">
        <h2 className="modal-title" >Tasks for {currentDate}</h2>
        <h3 className="modal-subtitle">{filteredTasks.length} tasks</h3>
        </div>
      <button className="modal-close-btn" onClick={() => { setIsWindowOpen(false); }}>Close</button>
      </div>
      {filteredTasks.map((task,index) => {
        console.log(task.date,currentDate)
          return (
          <div className="task-card" key={index}>
          <div className="task-card-top">
            <h3 className="task-title">{task.name}</h3>
            <div className="task-badges">
              <span className="task-badge task-badge-category">{task.category.name}</span>
            </div>
          </div>
          <h3>Description</h3>
          <p className="task-description">{task.description}</p>
          <h3 className={task.completed ? "task-completed" : "task-pending"}>{task.completed ? "Completed" : "Pending"}</h3>
          </div>
        )
      }
      )}

    </div>
  )
}

export const Calendar = () =>{
  const nowDate = new Date(); 
  const [selectedMonth, setSelectedMonth] = useState(nowDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(nowDate.getFullYear());
  const [taskDates, setTaskDates] = useState([]);
  const [calendarTasks, setCalendarTasks] = useState([]);
  const [currentDate, setCurrentDate] = useState(undefined);
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
      const catRes = await fetch(`/get_categories?id=${id}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        }})
      const categories = await catRes.json();
      tasksData.forEach((task) => {
        const taskCategory = categories.filter((category) => { return category.id === task.cat_id; })
        task.category = taskCategory[0];
      })
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
          return (<div key={i}><button className={taskDates.includes(makeDate(selectedYear,selectedMonth+1,i+1)) 
            ? "has-task-info" : ""} onClick={() => { setIsWindowOpen(true); setCurrentDate(makeDate(selectedYear,selectedMonth+1,i+1));
            }}>{i+1}</button>
          </div>)
          })
      }
    { isWindowOpen && (
            <div className="window-overlay">
                <div className="window-modal" onClick={(e) => e.stopPropagation()}>
                  <ShowCalendarTasks calendarTasks={calendarTasks} currentDate={currentDate} setIsWindowOpen={setIsWindowOpen} />
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
