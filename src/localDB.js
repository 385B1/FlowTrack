import Dexie from 'dexie';
const db = new Dexie("TaskMaterialsDB");


db.version(1).stores({
  files: 'id, name, type, size, fileBlob, taskId'
  
});


export { db };
