import { useEffect, useContext, useState } from "react";
import { TasksContext } from "./datoteke.jsx";
import { db } from "./localDB.js";
import { AddFile, RemoveFile } from "./localDBAPI.jsx"
import { useLiveQuery } from "dexie-react-hooks";
import "./NewTaskStyle.css";


const taskDelete = ( tasks, setTasks, id ) => {
  let updatedTasks = tasks.filter((task) => { return task.id != id }) 
  setTasks(updatedTasks);
  
}
// tasks can be either completed or active ,so this function handles the "mark as complete/active" button
const taskMarkCompleted = (tasks, setTasks, id) => {
  //console.log(tasks)
  const updatedTasks = tasks.map((task) =>{
    if (task.id === id){
      return {...task, completed: !task.completed}
    }
    return task;
  })
  setTasks(updatedTasks);
}
// this function handles addition of materials just for task materials
const onSubmitMaterial = ( taskMaterial, setTaskMaterial, taskId, close) => {
  for (const material of taskMaterial){
        // console.log(material);  
        AddFile(material, taskId);
  }
  close();
  setTaskMaterial([]);
}

// this function handles changes/edits for tasks
const onSubmit = ( state, taskChange, setTaskChange, tasks, setTasks, taskId, close) => {
  const storedTasks = JSON.parse(localStorage.getItem("tasks")) || [];
  storedTasks.map((task) => {
    if (task.id == taskId){
      switch(state){
        case "taskName":
          task.taskName = taskChange;
          break;
        case "taskDescription":
          task.description = taskChange;
          break;
        case "taskDate":
          task.date = taskChange;
          break;
        case "taskCategory":
          task.category = taskChange;
          break;
      }
    }
    return task;
  });
  // console.log(storedTasks);
  setTasks(storedTasks);
  
  setTaskChange("");

  close();

}

// these change functions handle the box for inputing a new change to the task

const ChangeTaskName = ( {taskId, tasks, setTasks, taskName, setTaskName, onClose} ) => {
  return (<div className="overlayStyle">
          <div className="modalStyle">
            <h3>Task Name</h3>
            <input placeholder="Enter task name" 
            value={taskName} onChange={ (e) => { setTaskName(e.target.value); } }></input>
            <button onClick={() => { onSubmit("taskName", taskName, setTaskName, tasks, setTasks, taskId, onClose) } }>Submit</button>
            <button onClick={onClose}> X Close</button>
          </div>
        </div>
      ) 
}

const ChangeTaskDescription = ( {taskId, tasks, setTasks, taskDescription, setTaskDescription, onClose} ) => {
  return (<div className="overlayStyle">
          <div className="modalStyle">
            <h3>Description</h3>
            <input placeholder="Enter description"
            value={taskDescription} onChange={(e) => { setTaskDescription(e.target.value); } }></input>
            <button onClick={() => { onSubmit("taskDescription", taskDescription, setTaskDescription , tasks, setTasks, taskId, onClose) } }>Submit</button>
            <button onClick={onClose}> X Close</button>
          </div>
        </div>
  )
}

const ChangeTaskDate = ( {taskId, tasks, setTasks, taskDate, setTaskDate, onClose} ) => {
  return (<div className="overlayStyle">
          <div className="modalStyle">
            <h3>Date</h3>
            <input type="date" value={taskDate} onChange={(e) => { setTaskDate(e.target.value); } }></input>
            <br/>
            <button onClick={() => { onSubmit("taskDate", taskDate, setTaskDate, tasks, setTasks, taskId, onClose) }}>Submit</button>
            <button onClick={onClose}> X Close</button>
          </div>
        </div>
      )
}

const ChangeTaskCategory = ( {taskId, tasks, setTasks, taskCategory, setTaskCategory, onClose} ) => {
  let categories;
  const getCategories = () => {
    const data = localStorage.getItem("categories");
    categories = JSON.parse(data);
    // console.log(categories, Object.keys(categories));
     
    return Object.keys(categories);
  }
  return (<div className="overlayStyle">
          <div className="modalStyle">
            <h3>Task category</h3>
            { getCategories().map((category, index) => {
             return (<button key={index}
              onClick={() => { setTaskCategory(category) } }
              className={ taskCategory === category ? "selectedButton" : "nonSelectedButton" }>{category}</button>)
            })  }
            <br/>  
            <button onClick={() => { onSubmit("taskCategory", taskCategory, setTaskCategory, tasks, setTasks, taskId, onClose)} }>Submit</button>
            <button onClick={onClose}> X Close</button>
          </div>
        </div>
      )
}

// This function handles the window for adding new materials
const AddTaskMaterial = ( {taskId, tasks, setTasks, taskMaterial, setTaskMaterial, onClose} ) => {
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
            <input type="file" multiple onChange={(e) => { setTaskMaterial([...taskMaterial ,e.target.files[0]]); }} placeholder="Place your materials here"></input>
            <br/>
            <button onClick={() => { onSubmitMaterial(taskMaterial, setTaskMaterial, taskId, onClose)} }>Submit</button>
            <button onClick={onClose}> X Close</button>
          </div>
        </div>
      ) 
}

// This function is used for querying the files/materials from the database based on certain tasks id
const TaskMaterials = ({ taskId, editMode, setRemoveMaterialId }) => {
  const [showPreviewWindow,setShowPreviewWindow] = useState(false);
  const [filePreviewId, setFilePreviewId] = useState("");


  const files = useLiveQuery(() => {
    if (!taskId) return [];
    return db.files.where("taskId").equals(taskId).toArray();
  },[taskId],[])
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
        console.log(imgURL);
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
        <p>Name: {file.name}</p>
        <p>Type: {file.type}</p>
        <p>Preview</p>
        <button onClick={() => { setShowPreviewWindow(false); }}> X Close</button>
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
          <button onClick={() => { handleDownload(file) } }>Download</button> 
          <button onClick={() => { setShowPreviewWindow(true); setFilePreviewId(file.id); }}>Preview</button>
          {showPreviewWindow && <PreviewWindow file={file}/>}
          {editMode &&  <button onClick={() => { setRemoveMaterialId(file.id); }}>Remove material</button>}
          </div>
        )
      })}
  </>
  )

}


// This function just shows the tasks under the "active" or "completed" h3 tag
// It decides which one based on the state parameter
const ShowTasks = ( {tasks, setTasks, state} )  => {
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
    const [taskCategory, setTaskCategory] = useState("");
    const [taskMaterial, setTaskMaterial] = useState([]);
    // id state
    const [buttonTaskId ,setButtonTaskId] = useState(0);
    const [removeMaterialId, setRemoveMaterialId] = useState("");

    const todaysDate = new Date();
    
    useEffect(() => {
      RemoveFile(removeMaterialId);
    },[removeMaterialId])
    
    let taskFiles;
    if (state == "active"){
      return <div className="taskContainer">
      {Object.values(tasks).map((task) => {
         if (task.completed){
            return null;  
          }
          return (<div className="task" key={task.id}>
          <h3>{task.taskName} {editMode && <button onClick={() => { setTaskNameWindow(true); setButtonTaskId(task.id) }}>Change task name</button>}</h3>
          {taskNameWindow && <ChangeTaskName taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskName={taskName} setTaskName={setTaskName} onClose={() => {setTaskNameWindow(false)} }/>}
          <p>{task.description} {editMode && <button onClick={() => {setTaskDescriptionWindow(true); setButtonTaskId(task.id)}}>Change description</button>}</p>
          {taskDescriptionWindow && <ChangeTaskDescription taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskDescription={taskDescription} setTaskDescription={setTaskDescription} onClose={() => {setTaskDescriptionWindow(false)} }/>}
          <p className={new Date(task.date) <= todaysDate ? "late-date" : "normal-date"}>{String(task.date)} {editMode && <button onClick={ () => { setTaskDateWindow(true); setButtonTaskId(task.id) }}>Change date</button>}</p>
          {taskDateWindow && <ChangeTaskDate taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskDate={taskDate} setTaskDate={setTaskDate} onClose={() => {setTaskDateWindow(false)} }/>}
          <p>{task.category} {editMode && <button onClick={ () => { setTaskCategoryWindow(true); setButtonTaskId(task.id) } }>Change category</button>}</p>
          {taskCategoryWindow && <ChangeTaskCategory taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskCategory={taskCategory} setTaskCategory={setTaskCategory} onClose={() => {setTaskCategoryWindow(false)} }/>}
          <h3>Materials {editMode && <button onClick={() => { setTaskMaterialWindow(true); setButtonTaskId(task.id) }}>Add Material</button> }</h3>
          {taskMaterialWindow && <AddTaskMaterial taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskMaterial={taskMaterial} setTaskMaterial={setTaskMaterial} onClose={() => {setTaskMaterialWindow(false)} }/>}
          <TaskMaterials taskId={task.id} editMode={editMode} setRemoveMaterialId={setRemoveMaterialId} />
          <br />
          <button onClick={() => { taskDelete(tasks,setTasks,task.id) } }>Delete</button>
          <button onClick={() => { taskMarkCompleted(tasks,setTasks,task.id) } }>{task.completed ? "Mark as active" : "Mark as complete"}</button>
          <button onClick={() => { setEditMode(!editMode); }}>{!editMode ? "Edit Mode": "Normal Mode"}</button>
          </div>
            )}
        )}
      </div>
    }
  /* if the state is marked as "completed" */
    return <div className="taskContainer">
      {Object.values(tasks).map((task) => {
         if (!task.completed){
            return null;  
          }
          return (<div className="task" key={task.id}>
          <h3>{task.taskName} {editMode && <button onClick={() => { setTaskNameWindow(true); setButtonTaskId(task.id) }}>Change task name</button>}</h3>
          {taskNameWindow && <ChangeTaskName taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskName={taskName} setTaskName={setTaskName} onClose={() => {setTaskNameWindow(false)} }/>}
          <p>{task.description} {editMode && <button onClick={() => {setTaskDescriptionWindow(true); setButtonTaskId(task.id)}}>Change description</button>}</p>
          {taskDescriptionWindow && <ChangeTaskDescription taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskDescription={taskDescription} setTaskDescription={setTaskDescription} onClose={() => {setTaskDescriptionWindow(false)} }/>}
          <p className={task.date <= new Date(todaysDate) ? "late-date" : "normal-date"}>{String(task.date)} {editMode && <button onClick={ () => { setTaskDateWindow(true); setButtonTaskId(task.id) }}>Change date</button>}</p>
          {taskDateWindow && <ChangeTaskDate taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskDate={taskDate} setTaskDate={setTaskDate} onClose={() => {setTaskDateWindow(false)} }/>}
          <p>{task.category} {editMode && <button onClick={ () => { setTaskCategoryWindow(true); setButtonTaskId(task.id) } }>Change category</button>}</p>
          {taskCategoryWindow && <ChangeTaskCategory taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskCategory={taskCategory} setTaskCategory={setTaskCategory} onClose={() => {setTaskCategoryWindow(false)} }/>}
          <h3>Materials {editMode && <button onClick={() => { setTaskMaterialWindow(true); setButtonTaskId(task.id) }}>Add Material</button> }</h3>
          {taskMaterialWindow && <AddTaskMaterial taskId={buttonTaskId} tasks={tasks} setTasks={setTasks} taskMaterial={taskMaterial} setTaskMaterial={setTaskMaterial} onClose={() => {setTaskMaterialWindow(false)} }/>}
          <TaskMaterials taskId={task.id} editMode={editMode} setRemoveMaterialId={setRemoveMaterialId} />
          <br />
          <button onClick={() => { taskDelete(tasks,setTasks,task.id) } }>Delete</button>
          <button onClick={() => { taskMarkCompleted(tasks,setTasks,task.id) } }>{task.completed ? "Mark as active" : "Mark as complete"}</button>
          <button onClick={() => { setEditMode(!editMode); }}>{!editMode ? "Edit Mode": "Normal Mode"}</button>
          </div>
            )}
        )}
      </div>
}


export const ActiveTasks = ( {tasks} ) =>{
  const setTasks = useContext(TasksContext).setStorageTasks;
  return (
  <div className="centered-task">
  Active tasks
  <ShowTasks tasks={tasks} setTasks={setTasks} state={"active"}/>
  </div>); 
}

export const CompletedTasks = ( {tasks} ) =>{
   const setTasks = useContext(TasksContext).setStorageTasks;

  return (
  <div className="centered-task">
  Completed tasks
  { <ShowTasks tasks={tasks} setTasks={setTasks} state={"completed"} /> }
  </div>);
}
