import { NewTask, NewCategory, RemoveCategory } from "./NewTask.jsx"
import { ActiveTasks, CompletedTasks } from "./TaskCards.jsx"
import { TaskStatus } from "./TaskStatus.jsx"
import { SearchSortTask } from "./SearchAndSortTasks.jsx"
import { useState, useContext, createContext, useEffect } from "react";
import './datoteke.css'
import { getCookie } from "../credentialValidation.jsx"

export const TasksContext = createContext();

export function Datoteke() {
  const [storageTasks, setStorageTasks] = useState([]);
  const [searchedTasks, setSearchedTasks] = useState(storageTasks);
  //console.log(storageTasks);
  const id = localStorage.getItem("id"); 
  useEffect(() => {
    async function loadTasks(){
      const resTasks = await fetch(`http://localhost:8000/get_tasks?id=${id}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        }
        });
      const dataTasks = await resTasks.json();
      console.log("dataTasks: ",dataTasks);
      for (let task of dataTasks){
      const resCategories = await fetch(`http://localhost:8000/get_category?id=${task.cat_id}`,
      {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        }
        });
        task.category = await resCategories.json();
      } 
      //console.log("data:",dataTasks);
    //return JSON.parse(localStorage.getItem("tasks")) || [];
      setStorageTasks(dataTasks);
      setSearchedTasks(dataTasks);
    }
    loadTasks();
  },[id]);

  return (
    <div className="center-datoteke">
    <TasksContext  value={ { storageTasks, setStorageTasks, searchedTasks, setSearchedTasks } }>
      <TaskStatus/>
      <NewTask tasks={storageTasks} setTasks={setStorageTasks}/>
      <NewCategory/>
      <RemoveCategory/>
      <SearchSortTask/>
      <ActiveTasks tasks={searchedTasks}/>
      <CompletedTasks tasks={searchedTasks}/>
    </TasksContext>
    </div>
  )
}
export default Datoteke;
