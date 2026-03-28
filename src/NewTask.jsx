import { useState } from "react";
import "./NewTaskStyle.css";

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

export const NewTask = () => {
  const [taskWindowOpen, setTaskWindowOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");

  let categories;

  const getCategories = () => {
    const data = localStorage.getItem("categories");
    categories = JSON.parse(data);
    // console.log(categories, Object.keys(categories));
     
    return Object.keys(categories);
  }

  const logTasks =() => {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.map((task) => {
      console.log(task)
    })
  }
  
  const closeTaskWindow = () => {
    setTaskName("");
    setDescription("");
    setSelectedCategory("");
    setTaskWindowOpen(false);
    logTasks();
  } 

  const createNewTask = () => {
     if (selectedCategory === "" || taskName == ""){
      alert("All fields must be filled (except the description field)"); 
      return;
    } 
    closeTaskWindow();
    const newTaskEntry = {
      id: crypto.randomUUID(),
      taskName: taskName,
      description: description,
      category: selectedCategory,
      completed: false
    };
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.push(newTaskEntry);
    localStorage.setItem("tasks",JSON.stringify(tasks));

  };

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
            <h3>Task category</h3>
            { getCategories().map((category, index) => {
             return (<button key={index}
              onClick={() => { setSelectedCategory(category) } }
              className={ selectedCategory === category ? "selectedButton" : "nonSelectedButton" }>{category}</button>)
            })  }
            <br/>
            <button onClick={createNewTask}>Submit</button>
            <button onClick={closeTaskWindow}> X Close</button>
          </div>
        </div>
      ) : null }  
  </div>
  );
};
