import { useState, useEffect } from "react";
import { db } from "./localDB.js"
import { AddFile, RemoveFile } from "./localDBAPI.jsx"
import "./NewTaskStyle.css";

// this component is used for adding new categories
export const NewCategory = () => {
  const [categoryWindowOpen, setCategoryWindowOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  // This arrow function parses the categories string from the local storage as a hashmap
  // and then adds the new category (the value is set to true for all available categories)
  
  const onSubmit = () => {
      if (categoryName == ""){
        alert("You must enter a category name.");
        return;
      }
      const categories = JSON.parse(localStorage.getItem("categories")) || {};
      categories[categoryName] = true 
      localStorage.setItem("categories",JSON.stringify(categories));
      setCategoryName("");
      setCategoryWindowOpen(false);
  }

  return (
    <div>
      <button onClick={ () => { setCategoryWindowOpen(true) } }>+ New Category</button>
    { categoryWindowOpen ? 
      (<div className="overlayStyle">
          <div className="modalStyle">
            <h2>New Category</h2>
            {/* the onChange arrow function just changes the categoryName's value to the value that is written in the input field */}
            <input placeholder="Enter category name" value={categoryName} onChange={(e) => { setCategoryName(e.target.value) }}/>
            <br/>
            <button onClick={onSubmit}>Submit</button>
            <button onClick={() => setCategoryWindowOpen(false)}> X Close</button>
          </div>
        </div>
      ) : null }   
    </div>

  )
}

export const NewTask = ( {tasks,setTasks} ) => {

  const [taskWindowOpen, setTaskWindowOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [materials, setMaterials] = useState([]);
    // this useEffect hook manages saving new tasks when added
    useEffect(() => {
      localStorage.setItem("tasks",JSON.stringify(tasks));
    },[tasks]);
    
    // this useEffect hook is just used for debugging purposes
    useEffect(() => {
    
    },[materials])

  let tempDate = new Date;
  let currentDate = `${tempDate.getFullYear()}-${tempDate.getMonth()+1}-${tempDate.getDate()}`;
  const [date, setDate] = useState(currentDate);



  let categories;
  const getCategories = () => {
    const data = localStorage.getItem("categories");
    categories = JSON.parse(data);
    // console.log(categories, Object.keys(categories));
     
    return Object.keys(categories);
  }
  // this is used just for debugging
  const logTasks =() => {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.map((task) => {
      console.log(task)
    })
  }
  
  // this code is used for closing the new task window and reseting all fiels
  const closeTaskWindow = () => {
    tempDate = new Date;
    currentDate = `${tempDate.getFullYear()}-${tempDate.getMonth()+1}-${tempDate.getDate()}`;
    setTaskName("");
    setDescription("");
    setSelectedCategory("");
    setTaskWindowOpen(false);
    setDate(currentDate);
    setMaterials([]);
    //logTasks();
  } 
  
  // this is not the best way to handle adding new tasks, but it works
  const createNewTask = () => {
    if (selectedCategory === "" || taskName == ""){
      alert("All fields must be filled (except the description field)"); 
      return;
    }
    const taskId = crypto.randomUUID();
      const newTaskEntry = {
      id: taskId,
      taskName: taskName,
      date: date,
      description: description,
      category: selectedCategory,
      completed: false
      
    };
    setTasks((prevTasks) => [...prevTasks, newTaskEntry]);
    for (const material of materials){
        console.log(material);  
        AddFile(material, taskId);
    }
    closeTaskWindow();

  };

  const handleFileAdding = (e) => { 
    //console.log(materials);
    setMaterials([...materials ,e.target.files[0]]);
  }

  return (
  <div>
    <button onClick={ () => { setTaskWindowOpen(true) } }>+ New Task</button>
    { taskWindowOpen ? 
      (<div className="overlayStyle">
          <div className="modalStyle">
            <h2>New Task</h2>
            <h3>Task Name</h3>
            <input placeholder="Enter task name" 
            value={taskName} onChange={ (e) => { setTaskName(e.target.value); } }></input>
            <br />
            <h3>Description</h3>
            <input placeholder="Enter description (optional)"
            value={description} onChange={(e) => { setDescription(e.target.value); } }></input>
            <h3>Date</h3>
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); } }></input>
            <h3>Task category</h3>
            { getCategories().map((category, index) => {
             return (<button key={index}
              onClick={() => { setSelectedCategory(category) } }
              className={ selectedCategory === category ? "selectedButton" : "nonSelectedButton" }>{category}</button>)
            })  }
            <br/>
            <h3>Materials</h3>
            <input type="file" multiple onChange={handleFileAdding} placeholder="Place your materials here"></input>
            <br/>
            <button onClick={createNewTask}>Submit</button>
            <button onClick={closeTaskWindow}> X Close</button>
          </div>
        </div>
      ) : null }  
  </div>
  );
};
