import { useState, useEffect, useContext } from 'react';
import { TasksContext } from "./Tasks.jsx"
import "./SearchAndSortTasks.css"

export const SearchTask = () => {
  const [searchName, setSearchName] = useState("");
  
  const tasks = useContext(TasksContext).storageTasks;
  const setTasks = useContext(TasksContext).setStorageTasks;
  const searchedTasks = useContext(TasksContext).searchedTasks;
  const setSearchedTasks = useContext(TasksContext).setSearchedTasks;
  useEffect(() => {
    setSearchedTasks(tasks);
  },[tasks]) 

  function has_string_in_name(string,name){
    return name.toLowerCase().includes(string.toLowerCase());
  }

  const searchTasks = () => {
    if (searchName === ''){
      setSearchedTasks(tasks);
      return;
    }
    let acceptedTasks = [];
    for (let task of tasks){
      if (has_string_in_name(searchName ,task.taskName)){
        acceptedTasks.push(task);
      }
    }
    setSearchedTasks(acceptedTasks);
  }
  return (
    <>
    <div className="search-container">
      <input className="search-input" placeholder="Search task by name" value={searchName} onChange={(e) => { setSearchName(e.target.value) }}></input>
      <button className="search-button" onClick={searchTasks}>Search</button>
    </div>
    </>
  )

}
