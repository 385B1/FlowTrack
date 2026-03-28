import { useEffect, useContext } from "react";
import { TasksContext } from "./App.jsx"

const taskDelete = ( tasks, setTasks, id ) => {
  //console.log(tasks, setTasks, id)
  let updatedTasks = tasks.filter((task) => { return task.id != id }) 
  //console.log(updatedTasks)
  setTasks(updatedTasks);
  // localStorage.setItem("tasks",JSON.stringify(tasks));
  
}

const ShowTasks = ( {tasks, setTasks, state} )  => {
    console.log(tasks, setTasks, state);
    if (state == "active"){
      console.log(tasks)
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
          <button onClick={() => { taskDelete(tasks,setTasks,task.id) } }>Delete</button>
          <button>Mark as complete</button>
          </div>
            )}
        )}
      </div>
    }
    else{

    }
}

export const ActiveTasks = ( {tasks} ) =>{
  const setTasks = useContext(TasksContext).setStorageTasks;
  //console.log(tasks);
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
