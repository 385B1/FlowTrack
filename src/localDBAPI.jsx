import { useState, useEffect } from 'react'
import { db } from './localDB.js'

export async function AddFile( file, taskId ){
  console.log(file, taskId, file.name, file.type, file.size)
  const fileId = crypto.randomUUID();
  await db.files.add({
    id: fileId,
    name: file.name,
    type: file.type,
    size: file.size,
    fileBlob: file,
    taskId: taskId
  });
  return fileId; 
};

export async function RemoveFile(fileId){
  await db.files.delete(fileId);
}


