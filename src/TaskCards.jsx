import { useEffect, useContext, useState } from "react";
import { TasksContext } from "./App.jsx";
import { db } from "./localDB.js";
import { useLiveQuery } from "dexie-react-hooks";


const taskDelete = ( tasks, setTasks, id ) => {
  let updatedTasks = tasks.filter((task) => { return task.id != id }) 
  setTasks(updatedTasks);
  
}

const taskMarkCompleted = (tasks, setTasks, id) => {
  console.log(tasks)
  const updatedTasks = tasks.map((task) =>{
    if (task.id === id){
      return {...task, completed: !task.completed}
    }
    return task;
  })
  setTasks(updatedTasks);
}

const TaskMaterials = ({ taskId }) => {
  const files = useLiveQuery(() => {
    if (!taskId) return [];
    return db.files.where("taskId").equals(taskId).toArray();
  },[taskId],[])
  return (
  <>
      {files.map((file) => {
        return (
        <div key={file.id}>
          <p>{file.name}</p>
          <button>Download</button>
        </div>
        )
      })}
  </>
  )

}

const ShowTasks = ( {tasks, setTasks, state} )  => {
    let taskFiles;
    if (state == "active"){
      return <div className="taskContainer">
      {Object.values(tasks).map((task) => {
         if (task.completed){
            return null;  
          }
          return (<div className="task" key={task.id}>
          <h3>{task.taskName}</h3>
          <p>{task.description}</p>
          <p>{String(task.date)}</p>
          <p>{task.category}</p>
          <h3>Materials</h3>
          <TaskMaterials taskId={task.id}/>
          <br />
          <button onClick={() => { taskDelete(tasks,setTasks,task.id) } }>Delete</button>
          <button onClick={() => { taskMarkCompleted(tasks,setTasks,task.id) } }>Mark as complete</button>
          </div>
            )}
        )}
      </div>
    }
  /* if the state is marked as "completed" */
    return <div className="taskContainer">
      {Object.values(tasks).map((task) => {
         if (!task.completed){
            return null;  
          }
          return (<div className="task" key={task.id}>
          <h3>{task.taskName}</h3>
          <p>{task.description}</p>
          <p>{String(task.date)}</p>
          <p>{task.category}</p>
          <button onClick={() => { taskDelete(tasks,setTasks,task.id) } }>Delete</button>
          <button onClick={() => { taskMarkCompleted(tasks,setTasks,task.id) } }>Mark as active</button>
          </div>
            )}
        )}
      </div>
}


export const ActiveTasks = ( {tasks} ) =>{
  const setTasks = useContext(TasksContext).setStorageTasks;
  return (
  <div>
  Active tasks
  <ShowTasks tasks={tasks} setTasks={setTasks} state={"active"}/>
  </div>); 
}

export const CompletedTasks = ( {tasks} ) =>{
   const setTasks = useContext(TasksContext).setStorageTasks;

  return (
  <div>
  Completed tasks
  { <ShowTasks tasks={tasks} setTasks={setTasks} state={"completed"} /> }
  </div>);
}
