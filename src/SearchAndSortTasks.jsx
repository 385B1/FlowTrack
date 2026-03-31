import { useState, useEffect, useContext } from 'react';
import { TasksContext } from "./Tasks.jsx"
import "./SearchAndSortTasks.css"

export const SearchSortTask = () => {
  const [searchName, setSearchName] = useState("");
  const [sortSelection, setSortSelection] = useState("name");
  const [ascendingOrDescending, setAscendingOrDescending] = useState("ascending");

  const tasks = useContext(TasksContext).storageTasks;
  const setTasks = useContext(TasksContext).setStorageTasks;
  const searchedTasks = useContext(TasksContext).searchedTasks;
  const setSearchedTasks = useContext(TasksContext).setSearchedTasks;
  
  // this hook is very important, because it rerenders the page every time a task
  // is added, deleted or edited.
  useEffect(() => {
    setSearchedTasks(tasks);
  },[tasks]) 
  /* this hook was used only for debugging
  useEffect(() => {
    console.log(sortSelection, ascendingOrDescending)
  },[sortSelection, ascendingOrDescending]) 
  */

  function has_string_in_name(string,name){
    return name.toLowerCase().includes(string.toLowerCase());
  }

  // this function is used for sorting the tasks. It handles 3 different sorting options
  // and also handles descending and ascending
  const sortTasks = () => {
    let sortedSearchedTasks = [...searchedTasks];
    switch (sortSelection){
      case "name":
         sortedSearchedTasks.sort((taskA,taskB) => { 
          return taskA.taskName.localeCompare(taskB.taskName); 
        });
        ascendingOrDescending == "descending" ? null: sortedSearchedTasks.reverse()  
        break;
      case "date":
        sortedSearchedTasks.sort((taskA,taskB) => { 
          return ascendingOrDescending == "descending" ? new Date(taskB.date) - new Date(taskA.date) : new Date(taskA.date) - new Date(taskB.date) 
        });
        break;
      case "category":
         sortedSearchedTasks.sort((taskA,taskB) => { 
          return taskA.category.localeCompare(taskB.category); 
        });
        ascendingOrDescending == "descending" ? null: sortedSearchedTasks.reverse() 
        break;
    }
    setSearchedTasks(sortedSearchedTasks);
  }
  
  // this function searches for a name that has a substring searchName in its name
  // where searchName is the search inputs value
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
    <div className="sort-container">
        <label className="sort-label" htmlFor="tasks_sort">Sort by: </label>
        <select onChange={(e) => { setSortSelection(e.target.value) }} className="sort-select" name="sort" id="tasks_sort">
          <option value="name">Name</option>
          <option value="date">Date</option>
          <option value="category">Category</option>
        </select>
        <select onChange={(e) => { setAscendingOrDescending(e.target.value) }} className="sort-select" name="sort" id="tasks_sort">
          <option value="ascending">Ascending</option>
          <option value="descending">Descending</option>
        </select>
        
        <button className="sort-button" onClick={sortTasks}>Sort</button>
    </div>
    </>
  )

}
