import { useState, useEffect, useRef } from "react";
import { db } from "./localDB.js"
import { AddFile, RemoveFile } from "./localDBAPI.jsx"
import "./NewTaskStyle.css";
import { getCookie } from '../credentialValidation.jsx';

// this component is used for adding new categories

export const RemoveCategory = () => {
  const [categoryWindowOpen, setCategoryWindowOpen] = useState(false);
  const [categories, setCategories] = useState([]); 
  const [categoryId, setCategoryId] = useState(0);
  useEffect(() => {
        async function fetch_categories(){ 
      const id = localStorage.getItem("id");

      const res = await fetch(`/get_categories?id=${id}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        }
        });
      const data = await res.json();

      if (data.detail?.length > 0) {
          localStorage.setItem("loggedin", "false");
          navigate("/");
        }
    /*
    const data = localStorage.getItem("categories");
    categories = JSON.parse(data);
    // console.log(categories, Object.keys(categories));
    */
      setCategories(data);
    }
    fetch_categories();     
  },[categoryWindowOpen]);
  
  const onSubmit = async () => {
    if (categoryId === 0){
      return null;
    }
    const removeCatRes = await fetch(`http://localhost:8000/remove_category?id=${categoryId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        }
        });
    setCategoryId(0);
    setCategoryWindowOpen(false);
  } 

  return (
      <div>
      <button onClick={ () => { setCategoryWindowOpen(true) } }>- Remove Category</button>
    { categoryWindowOpen ? 
      (<div className="overlayStyle">
          <div className="modalStyle">
            <h2>Remove Category</h2> 
            { categories.map((category,index) => {
              return <button key={category.id} className={ categoryId === category.id ? "selectedButton" : "nonSelectedButton" }  onClick={ () => {setCategoryId(category.id)} }>{category.name}</button>
            }) }
              
            <button onClick={onSubmit}>Submit</button>
            <button onClick={() => setCategoryWindowOpen(false)}> X Close</button>
          </div>
        </div>
      ) : null }   
    </div>
  )
}

export const NewCategory = () => {
  const [categoryWindowOpen, setCategoryWindowOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  // This arrow function parses the categories string from the local storage as a hashmap
  // and then adds the new category (the value is set to true for all available categories)

  const onSubmit = async () => {
      if (categoryName == ""){
        alert("You must enter a category name.");
        return;
      }
      /*
      const categories = JSON.parse(localStorage.getItem("categories")) || {};
      categories[categoryName] = true 
      localStorage.setItem("categories",JSON.stringify(categories));
      */

      // fetch old categories and add a new category to them
      const id = localStorage.getItem("id");

      const res = await fetch(`/get_categories?id=${id}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        }
        });
      const data = await res.json();  

      const category = {
        id: 0,
        userId: id,
        name: categoryName,
        dailyTimes: {}
      };
      data.push(category); 
      await fetch("/add_categories", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        },
        body: JSON.stringify({categories: data}) 
      });

      
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
  const [categories, setCategories] = useState([]);
  const [file, setFile] = useState();

  const isFirstRender = useRef(0);
  // this useEffect hook manages saving new tasks when added
    useEffect(() => {
    // this is used to block the first 2 renders from posting to add_task
    if (isFirstRender.current < 2){
      isFirstRender.current = isFirstRender.current + 1;
      return;
    }
    async function add_task(){
        const formData = new FormData();  
        materials.forEach((material)=>{
          formData.append("files",material, material.name || "file");
        });

        const userId = localStorage.getItem("id"); 
        const task = tasks[tasks.length-1];
        console.log(selectedCategory);
        const taskToAdd = {userId: Number(userId), name: task.taskName, description: task.description, taskDate: task.date, completed: task.completed, catId: selectedCategory}
        
        const files_info = materials.map((material) => {
          return {name: material.name, type: material.type,size: material.size};
        })

        console.log("files_info:",files_info);
        formData.append("task",JSON.stringify(taskToAdd));
        formData.append("files_info",JSON.stringify(files_info));

        await fetch("http://localhost:8000/add_task", {
          method: "POST",
          credentials: "include",
          body: formData,
          headers: {
            "X-CSRF-Token": getCookie("csrf_token")
          }, 
        }); 
      }
      add_task();
      setMaterials([]);
      setSelectedCategory("");
      //localStorage.setItem("tasks",JSON.stringify(tasks))
    },[tasks]);
     
    // this useEffect hook is just used for debugging purposes
    useEffect(() => {
    
    },[materials])

  let tempDate = new Date;
  let currentDate = `${tempDate.getFullYear()}-${tempDate.getMonth()+1}-${tempDate.getDate()}`;
  const [date, setDate] = useState(currentDate);



  useEffect( ()=> {
    async function fetch_categories(){ 
      const id = localStorage.getItem("id");

      const res = await fetch(`/get_categories?id=${id}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        }
        });
      const data = await res.json();

      if (data.detail?.length > 0) {
          localStorage.setItem("loggedin", "false");
          navigate("/");
        }
    /*
    const data = localStorage.getItem("categories");
    categories = JSON.parse(data);
    // console.log(categories, Object.keys(categories));
    */
      setCategories(data);
    }
    fetch_categories();
  },[taskWindowOpen]);
  // this is just used for debugging
  // it's no longer used since the we started using a real database
  /*
  const logTasks =() => {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.map((task) => {
      console.log(task)
    })
  } */
  
  // this code is used for closing the new task window and reseting all fiels
  const closeTaskWindow = () => {
    tempDate = new Date;
    currentDate = `${tempDate.getFullYear()}-${tempDate.getMonth()+1}-${tempDate.getDate()}`;
    setTaskName("");
    setDescription("");
    setTaskWindowOpen(false);
    setDate(currentDate);
    
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
    // multiple files could be added to the tasks so all files need to be handled
    /*
    for (const material of materials){
        // console.log(material);  
        AddFile(material, taskId);
    }
    */
    closeTaskWindow();

  };
  

  const handleFileAdding = (e) => { 
    //console.log(materials);
    setMaterials([...materials ,e.target.files[0]]);
  }

  const ShowAddedMaterials = () => {
    return (
      <div>
      {
        materials.map((material) => (
            <div key={material.name+material.lastModified}>
              <p>{material.name}</p>
            </div>
          ))
      }
      </div>
    )
  }
  
  return (
  <div>
    <button className="new-task-btn" onClick={ () => { setTaskWindowOpen(true) } }>+ New Task</button>
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
            { categories.map((category, index) => {
             return (<button key={index}
              onClick={() => { setSelectedCategory(category.id) } }
              className={ selectedCategory === category.id ? "selectedButton" : "nonSelectedButton" }>{category.name}</button>)
            })  }
            <br/>
            <h3>Materials</h3>
            <ShowAddedMaterials/>
            <input type="file" multiple onChange={handleFileAdding} placeholder="Place your materials here"></input>
            <br/>
            <button onClick={createNewTask}>Submit</button>
            <button onClick={() => { setSelectedCategory(""); setMaterials([]); closeTaskWindow(); }}> X Close</button>
          </div>
        </div>
      ) : null }  
  </div>
  );
};
