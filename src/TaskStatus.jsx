import "./TaskStatus.css"
import { useContext } from 'react'
import { TasksContext } from "./Tasks.jsx"

export const TaskStatus = () => {
  const tasks = useContext(TasksContext).storageTasks;
  console.log(tasks);
  let completed = 0;
  let active = 0;

  for (let task of tasks){
    if (task.completed){
      completed = completed + 1; 
    }
    if (!task.completed){
      active = active + 1;
    }
  }
  
  let i = 0;
  const active_percent = (active / (completed + active)) * 100;
  return (
    <>
    <div className="h4-horizontal">
      <div>
        <h4>Active</h4>
        <p>{active}</p>
      </div>
      <div>
        <h4>Completed</h4>
        <p>{completed}</p>
      </div>
      <div>
        <h4>Total</h4>
        <p>{active+completed}</p>
      </div>
    </div>
    <div className="cell-bar">
      <br/>
      { Array.from({length: completed + active}).map((_,i) => {
          return <span key={i} className={i < active ? "loaded-cell" : "unloaded-cell"}></span>
        })
      }  
    </div>
    </>
  )
} 
