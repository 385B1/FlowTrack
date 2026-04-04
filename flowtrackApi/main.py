from fastapi import FastAPI, File, UploadFile, Form
from fastapi import Depends, Request, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from psycopg2.extras import RealDictCursor
import bcrypt
import jwt
import secrets
from datetime import datetime, timedelta, date
from fastapi import Response
from typing import Dict, List

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi.responses import JSONResponse
import json
##
from database import get_db_connection


SECRET_KEY = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
ALGORITHM = "HS256"


# secrets.token_hex(32)

def getDb():
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

def create_access_token(data: dict):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(hours=1)

    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return token

def get_current_user(request: Request):
    token = request.cookies.get("access_token")


    if not token:
        raise HTTPException(status_code=401, detail="not_authenticated")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(status_code=401, detail="invalid_token")

        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="token_expired")

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="invalid_token")


def verify_csrf(request: Request):
    csrf_cookie = request.cookies.get("csrf_token")
    csrf_header = request.headers.get("X-CSRF-Token")

    if not csrf_cookie or not csrf_header:
        raise HTTPException(status_code=403, detail="CSRF_missing")

    if csrf_cookie != csrf_header:
        raise HTTPException(status_code=403, detail="CSRF_invalid")


app = FastAPI()

# rate limiting setup

limiter = Limiter(key_func=get_remote_address)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda r, e: JSONResponse(
    status_code=429,
    content={"detail": "rate_limit_exceeded"}
))

app.add_middleware(SlowAPIMiddleware)


# cors (allows everything)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_credentials=True,
    allow_headers=["*"],

)

class UserCreate(BaseModel):
    name: str
    password: str
    email: str

class UserVerify(BaseModel):
    email: str
    password: str

class Category(BaseModel):
    id: int
    userId: int
    name: str
    dailyTimes: Dict[str, int]

class Categories(BaseModel):
    categories: List[Category]

class Task(BaseModel):
    userId: int
    name: str
    description: str
    taskDate: date
    completed: bool
    catId: int


class FileMaterial(BaseModel):
    name: str
    type: str
    size: int
    taskId: int

class TaskRequest(BaseModel):
    task: Task
    files: List[FileMaterial]

# just for logging   
    
@app.middleware("http")
async def log_requests(request: Request, call_next):
    body = await request.body()
    # napravio sam try-except block zato sto se kod dodavanja taskova API crasha zbog ovog printa.
    try: 
        print(f"{request.method} {request.url.path} — body: {body.decode()}")
    except UnicodeDecodeError:
        # uopce mi nije jasno zasto dolazi do ovoga.
        print(f"{request.method} {request.url.path}")


    response = await call_next(request)
    return response

@app.on_event("startup")
def startup():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            password TEXT NOT NULL,
            email TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)


    cur.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS cat_daily_times (
            id SERIAL PRIMARY KEY,
            cat_id INTEGER REFERENCES categories(id),
            date DATE,
            time INTEGER
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            date DATE NOT NULL,
            completed BOOLEAN NOT NULL,
            cat_id INTEGER REFERENCES categories(id)
    );
    """)

    cur.execute(""" 
        CREATE TABLE IF NOT EXISTS files (
           id SERIAL PRIMARY KEY,
           name TEXT NOT NULL,
           type TEXT NOT NULL,
           size INT NOT NULL,
           taskId INTEGER REFERENCES tasks(id),
           file BYTEA
        );
    """)



    conn.commit()
    cur.close()
    conn.close()

@app.get("/")
def root():
    return {"message": "hello"}

@app.post("/signup")
@limiter.limit("5/minute")
def signup(request: Request, user: UserCreate, db = Depends(getDb)):
    cur = db.cursor(cursor_factory=RealDictCursor)

    try:

        cur.execute("SELECT * FROM users WHERE email = %s;", (user.email,))


        result = cur.fetchone()

        if result:
            return {"message": "user_exists"}

        # store passwords as hashes

        hashed_password = bcrypt.hashpw(
            user.password.encode(),
            bcrypt.gensalt()
        ).decode()

        cur.execute("INSERT INTO users (name, password, email) VALUES (%s, %s, %s);", (user.name, hashed_password, user.email))
        db.commit()
        return {"message": "user_created"}
    finally:
        cur.close()


@app.post("/login")
@limiter.limit("5/minute")
def login(request: Request, user: UserVerify, response: Response, db = Depends(getDb)):
    cur = db.cursor(cursor_factory=RealDictCursor)

    try:
        cur.execute("SELECT * FROM users WHERE email = %s;", (user.email,))


        result = cur.fetchone()

        if not result:
            return {"message": "user_not_exists"}

        # hash the input to see if it matches the hashed entries

        if not bcrypt.checkpw(
            user.password.encode(),
            result["password"].encode()
        ):
            return {"message": "user_not_exists"}

        token = create_access_token({"user_id": result["id"]})

        csrf_token = secrets.token_hex(16)

        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=False,   # !!!
            samesite="Lax"
        )

        response.set_cookie(
            key="csrf_token",
            value=csrf_token,
            httponly=False,  
            secure=False,
            samesite="Lax"
        )

        return {"message": "user_exists", "id": result["id"]}


    finally:
        cur.close()

# erase cookies with tokens when logging out

@app.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    response.delete_cookie("csrf_token")

    return {"message": "logged_out"}

@app.post("/add_categories")
@limiter.limit("50/minute")
def addCategories(request: Request, data: Categories, db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)

    try:

        id = data.categories[0].userId

        cur.execute("SELECT * FROM categories WHERE user_id = %s;", (id,))

        toDelete = cur.fetchall()

        print("toDelete: ")
        print(toDelete)

        for category in toDelete:
            cur.execute("DELETE FROM cat_daily_times WHERE cat_id = %s;", (category["id"],))


        cur.execute("DELETE FROM categories WHERE user_id = %s;", (id,))

        db.commit()

        for category in data.categories:
            cur.execute(
                "INSERT INTO categories (name, user_id) VALUES (%s, %s) RETURNING id;", (category.name, category.userId)
            )
            category_id = cur.fetchone()["id"]

            for day, time in category.dailyTimes.items():
                cur.execute("INSERT INTO cat_daily_times (cat_id, date, time) VALUES (%s, %s, %s);",
                (category_id, day, time))

            db.commit()
        
    finally:
        cur.close()

@app.post("/remove_category")
@limiter.limit("50/minute")
def removeCategory(request: Request, id: int, db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:

        cur.execute("DELETE FROM cat_daily_times WHERE cat_id = %s;",(id,))
        cur.execute("DELETE FROM categories WHERE id = %s;",(id,))

        db.commit()
    finally:
        cur.close()


@app.get("/get_categories")
@limiter.limit("100/minute")
def getCategory(request: Request, id: int, db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)

    try:
        
        cur.execute("SELECT * FROM categories WHERE user_id = %s;", (id,))
        categories = cur.fetchall()

        if not categories:
            return {"categories": []}

        result = []

        print("VALUE IN CATs: ")
        print(categories)

        for cat in categories:

            print("VALUE IN CAT: ")
            print(cat)

            cat_id = cat["id"]

            cur.execute(
                "SELECT date, time FROM cat_daily_times WHERE cat_id = %s;",
                (cat_id,)
            )
            rows = cur.fetchall()


            daily_times = {str(row["date"]): row["time"] for row in rows}

            result.append({
                "id": cat["id"],
                "userId": cat["user_id"],
                "name": cat["name"],
                "dailyTimes": daily_times
            })

        return result

    finally:
        cur.close()

@app.post("/add_task")
@limiter.limit("50/minute")
async def addTask(request: Request, 
    files: List[UploadFile] | None = File(None),
    task: str = Form(...),
    files_info: str = Form(...), 
    db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        parsedFilesInfo = json.loads(files_info)
        parsedTaskInfo = json.loads(task)
        print(parsedTaskInfo) 
        cur.execute("INSERT INTO tasks (name, description, date, completed, cat_id) VALUES (%s, %s, %s, %s, %s) RETURNING id",(
            parsedTaskInfo["name"],
            parsedTaskInfo["description"],
            parsedTaskInfo["taskDate"],
            parsedTaskInfo["completed"],
            parsedTaskInfo["catId"]
        ))

        taskId = cur.fetchone()["id"]
        #print("taskId:",taskId)
        #print(parsedFilesInfo, parsedTaskInfo)
        if files:
            for file,file_info in zip(files,parsedFilesInfo):
                content = await file.read()
                cur.execute("INSERT INTO files (name, type, size, taskId, file) VALUES (%s, %s, %s, %s, %s)",(
                file_info["name"],
                file_info["type"],
                file_info["size"],
                taskId,
                content))
        db.commit()
        return {
            "task_id": taskId,
            "category": parsedTaskInfo["catId"]
        }
    finally:
        cur.close()

@app.post("/add_category")
@limiter.limit("50/minute")
async def addCategory(request: Request, data: Category, db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        category = data
        cur.execute(
            "INSERT INTO categories (name, user_id) VALUES (%s, %s) RETURNING id;", (category.name, category.userId)
        )
        category_id = cur.fetchone()["id"]

        for day, time in category.dailyTimes.items():
            cur.execute("INSERT INTO cat_daily_times (cat_id, date, time) VALUES (%s, %s, %s);",
            (category_id, day, time))

        db.commit()
    finally:
        cur.close()
 

@app.get("/get_tasks")
@limiter.limit("50/minute")
async def getTasks(request: Request, 
    db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM tasks;")
        tasks = cur.fetchall()
        return tasks
    finally:
        cur.close()

@app.get("/get_category")
@limiter.limit("1000/minute")
async def getCategory(request: Request,
    id: int,
    db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM categories WHERE id=%s;",(id,))
        result = cur.fetchone()
        return result
    finally:
        cur.close()
@app.get("/get_files")
@limiter.limit("1000/minute")
async def getFiles(request: Request,
    task_id: int,
    db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT id, name, type, size, taskid FROM files WHERE taskid=%s",(task_id,))
        files = cur.fetchall()
        print(files)
        return files
    finally:
        cur.close()
@app.get("/get_file")
@limiter.limit("50/minute")
async def getFiles(request: Request,
    file_id: int,
    db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT file FROM files WHERE id=%s",(file_id,))
        file = cur.fetchone()
        return Response(content=bytes(file["file"])) 
    finally:
        cur.close()

