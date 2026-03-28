import { useState } from "react";
import "./NewTaskStyle.css";

export const NewCategory = () => {
  const [categoryWindowOpen, setCategoryWindowOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  // This arrow function parses the categories string from the local storage as a hashmap
  // and then adds the new category (the value is set to true for all available categories)
  const onSubmit = () => {
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
  const createNewTask = () => {
  };
  


  return (
  <div>
    <button onClick={ () => { setTaskWindowOpen(true) } }>+ New Task</button>
    { taskWindowOpen ? 
      (<div className="overlayStyle">
          <div className="modalStyle">
            <h2>New Task</h2>
            <h3>Task Name</h3>
            <input placeholder="Enter task name" />
            <br />
            <h3>Description</h3>
            <input placeholder="Enter description (optional)"></input>
            <h3>Task category</h3>
            {  }
            <br/>
            <button onClick={() => setTaskWindowOpen(false)}> X Close</button>
          </div>
        </div>
      ) : null }  
  </div>
  );
};
