import { NewTask, NewCategory } from "./NewTask.jsx"
import { ActiveTasks, CompletedTasks } from "./TaskCards.jsx"
import { TaskStatus } from "./TaskStatus.jsx"
import { SearchSortTask } from "./SearchAndSortTasks.jsx"
import { useState, useContext, createContext } from "react";
import './datoteke.css'

export const TasksContext = createContext();

export function Datoteke() {
  const [storageTasks, setStorageTasks] = useState(() => {
    return JSON.parse(localStorage.getItem("tasks")) || [];
  });
  const [searchedTasks, setSearchedTasks] = useState(storageTasks);
  //console.log(storageTasks);

  return (
    <div className="center-datoteke">
    <TasksContext  value={ { storageTasks, setStorageTasks, searchedTasks, setSearchedTasks } }>
      <TaskStatus/>
      <NewTask tasks={storageTasks} setTasks={setStorageTasks}/>
      <NewCategory/>
      <SearchSortTask/>
      <ActiveTasks tasks={searchedTasks}/>
      <CompletedTasks tasks={searchedTasks}/>
    </TasksContext>
    </div>
  )
}
export default Datoteke;
