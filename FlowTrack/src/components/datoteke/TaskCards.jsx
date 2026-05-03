import { useEffect, useContext, useState, useRef } from "react";
import { TasksContext } from "./datoteke.jsx";
import "./NewTaskStyle.css";
import { useNavigate } from "react-router-dom";
import { getCookie } from "../credentialValidation.jsx";

// this function makes an API call for the deletion of a task by its id
const taskDelete = async ( tasks, setTasks, id ) => {
  let updatedTasks = tasks.filter((task) => { return task.id != id }) 
  setTasks(updatedTasks);
  async function deleteSelectedTask(){
  await fetch(`/delete_task?task_id=${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "X-CSRF-Token": getCookie("csrf_token")
        },
      });
  }
  await deleteSelectedTask();
}
// tasks can be either completed or active ,so this function handles the "mark as complete/active" button
const taskMarkCompleted = async (tasks, setTasks, id) => {
  //console.log(tasks)
  let taskCompleted = undefined;
  const updatedTasks = tasks.map((task) =>{
    if (task.id === id){
      taskCompleted = !task.completed;
      return {...task, completed: taskCompleted}
    }
    return task;
  })
  setTasks(updatedTasks);
  async function postMarkCompleted(){
    const changeCompletedField = {
      task_id: id,
      field: "completed",
      change: taskCompleted
    };
    await fetch("/change_task_field", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json",
            "X-CSRF-Token": getCookie("csrf_token")
          },
          body: JSON.stringify(changeCompletedField)
        });
    if (taskCompleted){
      await fetch("/update_completed_task_achievement",{
        method: "PUT",
        credentials: "include",
        headers: {
          "X-CSRF-Token": getCookie("csrf_token")
        }
      });
    }
  }
  await postMarkCompleted();
    
}
// this function handles addition of materials just for task materials
// it first makes the form data structure and then passes it as a body to the add_files route
const onSubmitMaterial = async ( taskMaterial, setTaskMaterial, taskId, close) => {
  const formData = new FormData();
  const files_info = taskMaterial.map((material) => {
      return {name: material.name, type: material.type,size: material.size};
  })
  formData.append("files_info",JSON.stringify(files_info));
  taskMaterial.forEach((material)=>{
     formData.append("files",material, material.name || "file");
  });
  formData.append("task_id",JSON.stringify(taskId));
  await fetch("/add_files", {
      method: "POST",
      credentials: "include",
      body: formData,
      headers: {
        "X-CSRF-Token": getCookie("csrf_token")
      },
  }); 
  close();
  setTaskMaterial([]);
}

// this function handles changes/edits for tasks for every task field except materials/files and category 
const onSubmit = async ( state, taskChange, setTaskChange, tasks, setTasks, taskId, close) => {
  const id = localStorage.getItem("id");
  const resTasks = await fetch(`/get_tasks?id=${id}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        }
        });
  const storedTasks = await resTasks.json();
  let field = "";
  storedTasks.map((task) => {
    if (task.id == taskId){
      switch(state){
        case "name":
          task.name = taskChange;
          field = "name";
          break;
        case "taskDescription":
          task.description = taskChange;
          field = "description";
          break;
        case "taskDate":
          task.date = taskChange;
          field = "date";
          break;
      }
    }
    return task;
  });
  // used for setting the category for each task in order to show it on the Task cards
  for (let i = 0; i < storedTasks.length; i++){
      storedTasks[i].category = tasks[i].category;
  }
  // console.log(storedTasks);
  setTasks(storedTasks);
  //console.log("storedTasks: ",storedTasks);
  close();
  await fetch("/change_task_field", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json",
            "X-CSRF-Token": getCookie("csrf_token")
        },
    body: JSON.stringify({ task_id: taskId, field: field, change: taskChange })
    }); 
  setTaskChange("");
}

// categories need to be specially handled in order to edit/change them
const onSubmitCategory = async ( setTaskChange,newCategoryId, tasks, setTasks, taskId, close) => {
  const id = localStorage.getItem("id");
  const resTasks = await fetch(`/get_tasks?id=${id}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        }
        });
  const storedTasks = await resTasks.json();
  const catRes = await fetch(`/get_category?id=${newCategoryId}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        }
      });
  const newCategory = await catRes.json();

  storedTasks.map((task) => {
    if (task.id == taskId){
      task.cat_id = newCategoryId;
      task.category = newCategory; 
    }
    return task;
  });
  // console.log(storedTasks);
  for (let i = 0; i < storedTasks.length; i++){
      if(storedTasks[i].id == taskId) continue;
      storedTasks[i].category = tasks[i].category;
  }
  setTasks(storedTasks);
  close();
  await fetch("/change_task_field", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json",
            "X-CSRF-Token": getCookie("csrf_token")
        },
      body: JSON.stringify({ task_id: taskId, field: "cat_id", change: newCategoryId })
    }); 
  setTaskChange("");
}


// these change functions handle the box for inputing a new change to the task

const ChangeTaskName = ( {taskId, tasks, setTasks, taskName, setTaskName, onClose} ) => {
  return (<div className="overlayStyle">
          <div className="modalStyle">
            <h3>Ime Zadatka</h3>
            <input placeholder="Upisi ime zadatka" 
            value={taskName} onChange={ (e) => { setTaskName(e.target.value); } }></input>
            <button onClick={() => { onSubmit("name", taskName, setTaskName, tasks, setTasks, taskId, onClose) } }>Gotovo</button>
            <button onClick={onClose}>Zatvori</button>
          </div>
        </div>
      ) 
}

const ChangeTaskDescription = ( {taskId, tasks, setTasks, taskDescription, setTaskDescription, onClose} ) => {
  return (<div className="overlayStyle">
          <div className="modalStyle">
            <h3>Opis</h3>
            <input placeholder="Upisi opis"
            value={taskDescription} onChange={(e) => { setTaskDescription(e.target.value); } }></input>
            <button onClick={() => { onSubmit("taskDescription", taskDescription, setTaskDescription , tasks, setTasks, taskId, onClose) } }>Gotovo</button>
            <button onClick={onClose}>Zatvori</button>
          </div>
        </div>
  )
}

const ChangeTaskDate = ( {taskId, tasks, setTasks, taskDate, setTaskDate, onClose} ) => {
  return (<div className="overlayStyle">
          <div className="modalStyle">
            <h3>Datum</h3>
            <input type="date" value={taskDate} onChange={(e) => { setTaskDate(e.target.value); } }></input>
            <br/>
            <button onClick={() => { onSubmit("taskDate", taskDate, setTaskDate, tasks, setTasks, taskId, onClose) }}>Gotovo</button>
            <button onClick={onClose}>Zatvori</button>
          </div>
        </div>
      )
}


const ChangeTaskCategory = ( {taskId, tasks, setTasks, taskCategory, setTaskCategory, onClose} ) => {
  const [categories, setCategories] = useState(undefined);
  const [canCall, setCanCall] = useState(true);
  const id = localStorage.getItem("id");
  useEffect(()=>{
    const getCategories = async () => {
          const res = await fetch(`/get_categories?id=${id}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        }
        });
    const newCategories = await res.json();
    setCategories(newCategories);
    // console.log(categories, Object.keys(categories));
    }
    getCategories();
  },[id])
  if (!categories){
    return <div>Loading categories...</div>;
  }
  return (<div className="overlayStyle">
          <div className="modalStyle">
            <h3>Kategorija zadatka</h3>
            { categories.map((category, index) => {
             return (<button key={index}
              onClick={() => { setTaskCategory(category.id) } }
              className={ taskCategory === category.id ? "selectedButton" : "nonSelectedButton" }>{category.name}</button>)
            })  }
            <br/>  
            <button onClick={() => { onSubmitCategory(setTaskCategory,taskCategory, tasks, setTasks, taskId, onClose)} }>Gotovo</button>
            <button onClick={onClose}>Zatvori</button>
          </div>
        </div>
      )
}

// This function handles the window for adding new materials
const AddTaskMaterial = ( {refresh, taskId, tasks, setTasks, taskMaterial, setTaskMaterial, onClose} ) => {
  const ShowAddedMaterials = () => {
    return (
      <div>
      {
        taskMaterial.map((material) => (
            <div key={material.name+material.lastModified}>
              <p>{material.name}</p>
            </div>
          ))
      }
      </div>
    )
  }
  return (<div className="overlayStyle">
          <div className="modalStyle">
            <ShowAddedMaterials/>
            <input type="file" multiple onChange={(e) => { setTaskMaterial([...taskMaterial ,e.target.files[0]]); }} placeholder="Ovdje stavi svoje materijale"></input>
            <br/>
            <button onClick={() => { onSubmitMaterial(taskMaterial, setTaskMaterial, taskId, onClose); refresh();} }>Gotovo</button>
            <button onClick={onClose}>Zatvori</button>
          </div>
        </div>
      ) 
}

// This function is used for querying the files/materials from the database based on certain tasks id
const TaskMaterials = ({ removeMaterialId, taskMaterial, taskId, editMode, setRemoveMaterialId }) => {
  const [showPreviewWindow,setShowPreviewWindow] = useState(false);
  const [filePreviewId, setFilePreviewId] = useState("");
  const [files, setFiles] = useState([]);
  const id = localStorage.getItem("id");
  // this useEffect hook gets all the files info and their blobs and adds them together
  // this is used for showing/previewing/downloading the files from the task cards
  const loadedTaskId = useRef(null);
  useEffect(() => {
    async function get_files(){
      if (!taskId) return;
      if (loadedTaskId.current === taskId) return;
      //console.log("get_files called");
      const res = await fetch(`/get_files?task_id=${taskId}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        },
        });
      const data = await res.json();
      //console.log("data:",data)
      for (let file of data){
        if (file.id == removeMaterialId) continue;
        const resFile = await fetch(`/get_file?file_id=${file.id}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json",
          "X-CSRF-Token": getCookie("csrf_token")
        }})
        const blob = await resFile.blob(); 
        file.fileBlob = blob;
      };
      setFiles(data || []);
      loadedTaskId.current = taskId;
    }
    get_files();

  },[taskId])
  // this function handles the downloading of the file when pressing the download button
  const handleDownload = (file) => {
    // create an URL for downloading the file
    const downloadUrl = URL.createObjectURL(file.fileBlob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = file.name;

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 1000);

  }
  // this function just previews the chosen file. It doesn't support a lot of file types yet but it will later.
  const PreviewFile = (file) => {
    const [content, setContent] = useState("");
    useEffect(() => {
      const fr = new FileReader();
        fr.onload = () => {
        setContent(fr.result);
      };
      fr.readAsText(file.fileBlob);
    },[file]);
    if (file.type.startsWith("image")){
        const imgURL = URL.createObjectURL(file.fileBlob);
        //console.log(imgURL);
        setTimeout(() => {
        URL.revokeObjectURL(imgURL);
        }, 1000); 

        return ( <img src={imgURL} className="image-preview"></img> );
    }
    
    if (file.type == "application/json"){
      // this should be handled differently
      return ( <p>{content}</p> );
    } 

    if (file.type == "text/csv"){
      // this should be handled differently
      return ( <p>{content}</p> );
    }

    if (file.type.startsWith("text")){
      return ( <p>{content}</p> );
    }
    if (file.type.startsWith("audio")){
      const audioURL = URL.createObjectURL(file.fileBlob);
      setTimeout(() => {
        URL.revokeObjectURL(audioURL);
      }, 1000);

      return <audio controls src={audioURL}></audio>
    }
    if (file.type.startsWith("video")){
      const videoURL = URL.createObjectURL(file.fileBlob);
      setTimeout(() => {
        URL.revokeObjectURL(videoURL);
      }, 1000);

      return <video controls src={videoURL}></video>
    }
    
    if (file.type == "application/pdf") {
      const pdfURL = URL.createObjectURL(file.fileBlob);
      setTimeout(() => {
        URL.revokeObjectURL(pdfURL);
      }, 1000); 

      return ( <iframe src={pdfURL} className="pdf-preview"></iframe> );
    }

    return ( <h3>Preview for this file is not supported</h3> )
  }

  
  const PreviewWindow = ( { file } ) => {
    if (file.id != filePreviewId){
      return null;
    }
    return (
    <div className="overlayStyle">
      <div className="modalPreviewStyle"> 
        <p>Ime: {file.name}</p>
        <p>Tip: {file.type}</p>
        <p>Pretpregled</p>
        <button onClick={() => { setShowPreviewWindow(false); }}>Zatvori</button>
        <br/>
        { PreviewFile(file) }
      </div>
    </div>
    ) 
  }

  return (
  <>
      {files.map((file) => {
        return (
        <div key={file.id}>
          <p>{file.name}</p>
          <button onClick={() => { handleDownload(file) } }>Preuzmi</button> 
          <button onClick={() => { setShowPreviewWindow(true); setFilePreviewId(file.id); }}>Pretpregled</button>
          {showPreviewWindow && <PreviewWindow file={file}/>}
          {editMode &&  <button onClick={() => { setRemoveMaterialId(file.id); }}>Makni materijal</button>}
          </div>
        )
      })}
  </>
  )

}


// This function just shows the tasks under the "active" or "completed" h3 tag
// It decides which one based on the state parameter
const ShowTasks = ( {refresh, tasks, setTasks, state} )  => {

    if (tasks?.detail?.length > 0) {
        localStorage.setItem("loggedin", "false");
        navigate("/");
    } 
    // edit mode state
    const [editMode, setEditMode] = useState(false);
    // states for windows  
    const [taskNameWindow, setTaskNameWindow] = useState(false);
    const [taskDescriptionWindow, setTaskDescriptionWindow] = useState(false);
    const [taskDateWindow, setTaskDateWindow] = useState(false);
    const [taskCategoryWindow, setTaskCategoryWindow] = useState(false);
    const [taskMaterialWindow, setTaskMaterialWindow] = useState(false);
    // states for changes
    const [taskName, setTaskName] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [taskDate, setTaskDate] = useState("");
    const [taskCategory, setTaskCategory] = useState(0);
    const [fetchedCategory, setFetchedCategory] = useState(undefined);
    const [taskMaterial, setTaskMaterial] = useState([]);
    // id state
    const [buttonTaskId ,setButtonTaskId] = useState(0);
    const [removeMaterialId, setRemoveMaterialId] = useState("");
        
    const todaysDate = new Date();
     
    useEffect(() => {
    // this works weirdly, needs fixing
    if (!removeMaterialId) return;
    const updatedTaskMaterial = taskMaterial.map((material)=>{
        if (material.id != removeMaterialId){
          //console.log("added material:",material);
          return material;
        }
      });
    setTaskMaterial(updatedTaskMaterial); 
    async function deleteSelectedFile(){
        await fetch(`/delete_file?file_id=${removeMaterialId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "X-CSRF-Token": getCookie("csrf_token")
        },
        });
      }
      deleteSelectedFile();
      refresh();
    },[removeMaterialId])
    
    let taskFiles;
    if (state == "active"){
      return <div className="taskContainer">
      {Object.values(tasks).map((task) => {
         if (task.completed){
            return null;  
          }
          //console.log("task:",task);
          return (<div className="task" key={task.id}>
          <h3>{task.name} {editMode && <button onClick={() => { setTaskNameWindow(true); setButtonTaskId(task.id) }}>Promjeni ime zadatka</button>}</h3>
          {taskNameWindow && <ChangeTaskName taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskName={taskName} setTaskName={setTaskName} onClose={() => {setTaskNameWindow(false)} }/>}
          <p>{task.description} {editMode && <button onClick={() => {setTaskDescriptionWindow(true); setButtonTaskId(task.id)}}>Promjeni Ime Zadatka</button>}</p>
          {taskDescriptionWindow && <ChangeTaskDescription taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskDescription={taskDescription} setTaskDescription={setTaskDescription} onClose={() => {setTaskDescriptionWindow(false)} }/>}
          <p className={new Date(task.date) <= todaysDate ? "late-date" : "normal-date"}>{String(task.date)} {editMode && <button onClick={ () => { setTaskDateWindow(true); setButtonTaskId(task.id) }}>Promjeni Datum</button>}</p>
          {taskDateWindow && <ChangeTaskDate taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskDate={taskDate} setTaskDate={setTaskDate} onClose={() => {setTaskDateWindow(false)} }/>}
          <p>{task.category ? task.category.name : null} {editMode && <button onClick={ () => { setTaskCategoryWindow(true); setButtonTaskId(task.id) } }>Promjeni Kategoriju</button>}</p>
          {taskCategoryWindow && <ChangeTaskCategory taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskCategory={taskCategory} setTaskCategory={setTaskCategory} onClose={() => {setTaskCategoryWindow(false)} }/>}
          <h3>Materials {editMode && <button onClick={() => { setTaskMaterialWindow(true); setButtonTaskId(task.id) }}>Dodaj Materijal</button> }</h3>
          {taskMaterialWindow && <AddTaskMaterial refresh={refresh} taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskMaterial={taskMaterial} setTaskMaterial={setTaskMaterial} onClose={() => {setTaskMaterialWindow(false)} }/>}
          <TaskMaterials removeMaterialId={removeMaterialId} taskMaterial={taskMaterial} taskId={task.id} editMode={editMode} setRemoveMaterialId={setRemoveMaterialId} />
          <br />
          <button onClick={() => { taskDelete(tasks,setTasks,task.id) } }>Izbriši</button>
          <button onClick={() => { taskMarkCompleted(tasks,setTasks,task.id) } }>{task.completed ? "Označi kao aktivno" : "Označi kao završeno"}</button>
          <button onClick={() => { setEditMode(!editMode); }}>{!editMode ? "Način uređivanja": "Normalni mod"}</button>
          </div>
            )}
        )}
      </div>
    }
  /* if the state is marked as "completed" */
    return <div className="taskContainer">
      {Object.values(tasks).map((task) => {
      //console.log("task:",task);
         if (!task.completed){
            return null;  
          }
          return (<div className="task" key={task.id}>
          <h3>{task.name} {editMode && <button onClick={() => { setTaskNameWindow(true); setButtonTaskId(task.id) }}>Promjeni Ime Zadatka</button>}</h3>
          {taskNameWindow && <ChangeTaskName taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskName={taskName} setTaskName={setTaskName} onClose={() => {setTaskNameWindow(false)} }/>}
          <p>{task.description} {editMode && <button onClick={() => {setTaskDescriptionWindow(true); setButtonTaskId(task.id)}}>Promjeni opis</button>}</p>
          {taskDescriptionWindow && <ChangeTaskDescription taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskDescription={taskDescription} setTaskDescription={setTaskDescription} onClose={() => {setTaskDescriptionWindow(false)} }/>}
          <p className={task.date <= new Date(todaysDate) ? "late-date" : "normal-date"}>{String(task.date)} {editMode && <button onClick={ () => { setTaskDateWindow(true); setButtonTaskId(task.id) }}>Promjeni Datum</button>}</p>
          {taskDateWindow && <ChangeTaskDate taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskDate={taskDate} setTaskDate={setTaskDate} onClose={() => {setTaskDateWindow(false)} }/>}
          <p>{task.category?.name} {editMode && <button onClick={ () => { setTaskCategoryWindow(true); setButtonTaskId(task.id) } }>Promjeni Kategoriju</button>}</p>
          {taskCategoryWindow && <ChangeTaskCategory taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskCategory={taskCategory} setTaskCategory={setTaskCategory} onClose={() => {setTaskCategoryWindow(false)} }/>}
          <h3>Materials {editMode && <button onClick={() => { setTaskMaterialWindow(true); setButtonTaskId(task.id) }}>Dodaj Materijal</button> }</h3>
          {taskMaterialWindow && <AddTaskMaterial refresh={refresh} taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskMaterial={taskMaterial} setTaskMaterial={setTaskMaterial} onClose={() => {setTaskMaterialWindow(false)} }/>}
          <TaskMaterials taskMaterial={taskMaterial} taskId={task.id} editMode={editMode} setRemoveMaterialId={setRemoveMaterialId} />
          <br />
          <button onClick={() => { taskDelete(tasks,setTasks,task.id) } }>Izbriši</button>
          <button onClick={() => { taskMarkCompleted(tasks,setTasks,task.id) } }>{task.completed ? "Označi kao aktivno" : "Označi kao završeno"}</button>
          <button onClick={() => { setEditMode(!editMode); }}>{!editMode ? "Način uređivanja": "Normalni mod"}</button>
          </div>
            )}
        )}
      </div>
}


export const ActiveTasks = ( {tasks} ) =>{
  const setTasks = useContext(TasksContext).setStorageTasks;
  
  // this refreshKey is used for refreshing the whole page once the task material has been removed or added
  // I know it's not the best solution, but I would have to change too many things to do it better
  const [refreshKey, setRefreshKey] = useState(0);
  
  const refresh = () => {
    setRefreshKey(prev => prev + 1);
  }
  
  useEffect(()=>{

  },[refreshKey])

  return (
  <div className="centered-task">
  Aktivni zadatci
  <ShowTasks key={refreshKey} refresh={refresh} tasks={tasks} setTasks={setTasks} state={"active"}/>
  </div>);
}

export const CompletedTasks = ( {tasks} ) =>{
  const setTasks = useContext(TasksContext).setStorageTasks;
  const [refreshKey, setRefreshKey] = useState(0);
  
  const refresh = () => {
    setRefreshKey(prev => prev + 1);
  }
  
  useEffect(()=>{

  },[refreshKey])

  return (
  <div className="centered-task">
  Završeni zadatci
  { <ShowTasks key={refreshKey} refresh={refresh} tasks={tasks} setTasks={setTasks} state={"completed"} /> }
  </div>);
}
