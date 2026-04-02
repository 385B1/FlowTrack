import { NewTask, NewCategory } from "./NewTask.jsx"
import { ActiveTasks, CompletedTasks } from "./TaskCards.jsx"
import { useState, useContext, createContext } from "react";
import './App.css'

export const TasksContext = createContext();

export function Tasks() {
  const [storageTasks, setStorageTasks] = useState(() => {
    return JSON.parse(localStorage.getItem("tasks")) || [];
  });
  //console.log(storageTasks);

  return (
    <TasksContext value={ { storageTasks, setStorageTasks } }>
      <NewTask tasks={storageTasks} setTasks={setStorageTasks}/>
      <NewCategory/>
      <ActiveTasks tasks={storageTasks}/>
      <CompletedTasks tasks={storageTasks}/>
    </TasksContext>
  )
}

