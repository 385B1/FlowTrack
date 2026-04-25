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
from typing import Dict, List, Union

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi.responses import JSONResponse
import json
##
from database import get_db_connection
from groq import Groq
import os
from dotenv import load_dotenv
import traceback

load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY").strip()

SECRET_KEY = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
ALGORITHM = "HS256"

client = Groq(api_key=API_KEY)

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

class UpdateCategory(BaseModel):
    catId: int
    dailyTime: Dict[str, int]
    start: str
    end: str

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

class ChangeRequest(BaseModel):
    task_id: int
    field: str
    change: Union[str, int, bool]


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
# this function is used for creating achievements and its categories at the start of the API
def create_achievements_if_needed(cur):
    # this query is used for checking if the categories already exist
    cur.execute("SELECT * FROM achievement_categories;")
    check = cur.fetchone()
    if check:
        return
    cur.execute("INSERT INTO achievement_categories (name, description ) VALUES (%s, %s), (%s,%s), (%s,%s);", 
    ("Konzistencija", "Konzistencija korisnika na temelju njegovih izmjerenih vremena",
     "Produktivnost", "Produktivnost korisnika na temelju njegovih obavljenih zadataka i logiranog vremena",
     "Vrijeme", "Provedeno vrijeme korisnika"))
    cur.execute("SELECT * FROM achievements;")
    check = cur.fetchone()
    print("achievements check:",check)
    # All of this creates the pre-made achievements that users can get
    if check:
        return
    cur.execute("SELECT id FROM achievement_categories WHERE name=%s",("Konzistencija",))
    achievement_id = cur.fetchone()[0]

    cur.execute("""INSERT INTO achievements (achievement_category, name, description, is_active) VALUES 
    (%s, %s, %s,%s), (%s, %s, %s,%s), (%s, %s, %s,%s)""",
    (achievement_id,"Početak","Prvo logiranje vremena",True,
     achievement_id,"Zagrijavanje","Logiranje vremena 3 dana za redom",True,
     achievement_id,"Rad","Logiranje vremena 7 dana za redom",True))
    
    cur.execute("SELECT id FROM achievement_categories WHERE name=%s",("Produktivnost",))
    achievement_id = cur.fetchone()[0]
    cur.execute("""INSERT INTO achievements (achievement_category, name, description, is_active) VALUES 
    (%s, %s, %s,%s), (%s, %s, %s,%s), (%s, %s, %s,%s)""",
    (achievement_id,"Prvi zadatak","Logiraj svoj prvi zadatak",True,
     achievement_id,"Dosta posla","Logiraj svojih prvih 10 zadataka",True,
     achievement_id,"Radi se","Dovrsi svojih prvih 10 zadataka",True))
    
    cur.execute("SELECT id FROM achievement_categories WHERE name=%s",("Vrijeme",))
    achievement_id = cur.fetchone()[0]
    cur.execute("""INSERT INTO achievements (achievement_category, name, description, is_active) VALUES 
    (%s, %s, %s,%s), (%s, %s, %s,%s), (%s, %s, %s,%s)""",
    (achievement_id,"Sat pocinje","Logiraj svojih prvih 30 minuta",True,
     achievement_id,"Puno vremena","Logiraj svojih prvih 5 sati",True,
     achievement_id,"Investitor vremena","Logiraj svojih prvih 10 sati",True))


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
        CREATE TABLE IF NOT EXISTS start_end_times (
            id SERIAL PRIMARY KEY,
            cat_id INTEGER REFERENCES categories(id),
            start_time TIME,
            end_time TIME,
            date DATE
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
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

    cur.execute(""" 
        CREATE TABLE IF NOT EXISTS messages (
           id SERIAL PRIMARY KEY,
           user_id INT REFERENCES users(id),
           role TEXT NOT NULL,
           content TEXT NOT NULL,
           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    cur.execute(""" 
        CREATE TABLE IF NOT EXISTS achievement_categories (
           id SERIAL PRIMARY KEY,
           name TEXT NOT NULL,
           description TEXT
        );
    """)

    cur.execute(""" 
        CREATE TABLE IF NOT EXISTS achievements (
           id SERIAL PRIMARY KEY,
           achievement_category INT REFERENCES achievement_categories(id),
           name TEXT NOT NULL,
           description TEXT,
           is_active BOOLEAN NOT NULL 
        );
    """)

    cur.execute(""" 
        CREATE TABLE IF NOT EXISTS user_achievements(
           id SERIAL PRIMARY KEY,
           user_id INT REFERENCES users(id),
           achievement_id INT REFERENCES achievements(id),
           unlocked_at TIMESTAMP DEFAULT NULL,
           progress INT,
           is_completed BOOLEAN NOT NULL 
        );
    """)

    cur.execute(""" 
        CREATE TABLE IF NOT EXISTS streaks(
           id SERIAL PRIMARY KEY,
           user_id INT REFERENCES users(id),
           current_streak INT,
           longest_streak INT,
           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    
    create_achievements_if_needed(cur)

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
        cur.execute("SELECT id FROM tasks WHERE cat_id = %s",(id,))
        task_ids = cur.fetchall()
        for task in task_ids:
            task_id = task["id"]
            cur.execute("DELETE FROM files WHERE taskId = %s",(task_id,))
        cur.execute("DELETE FROM tasks WHERE cat_id = %s",(id,))
        cur.execute("DELETE FROM start_end_times WHERE cat_id = %s",(id,))
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
            cur.execute(
                "SELECT date, start_time, end_time FROM start_end_times WHERE cat_id = %s;",
                (cat_id,)
            )
            rows = cur.fetchall()

            grouped = {}
            for row in rows:
                date = str(row["date"])
                if date not in grouped:
                    grouped[date] = []

                grouped[date].append({
                    "start": row["start_time"],
                    "end": row["end_time"]
                })

            startEndTimes = []
            for date, times in grouped.items():
                startEndTimes.append({
                    "date": date,
                    "times": times
                })
            result.append({
                "id": cat["id"],
                "userId": cat["user_id"],
                "name": cat["name"],
                "dailyTimes": daily_times,
                "startEndTimes": startEndTimes
            })

        return result

    finally:
        cur.close()

async def create_task_logic(parsedTaskInfo, parsedFilesInfo, files, db, fromAi):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("INSERT INTO tasks (user_id ,name, description, date, completed, cat_id) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",(
            parsedTaskInfo["userId"],        # user_id
            parsedTaskInfo["name"],     # name
            parsedTaskInfo["description"],
            parsedTaskInfo["taskDate"],
            parsedTaskInfo["completed"],
            parsedTaskInfo["catId"]))

        print("insertion success")
        taskId = cur.fetchone()["id"]
        if files:
            for file, file_info in zip(files, parsedFilesInfo):
                content = await file.read()
                cur.execute("""
                    INSERT INTO files (name, type, size, taskId, file)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    file_info["name"],
                    file_info["type"],
                    file_info["size"],
                    taskId,
                    content
                ))

        db.commit()
        if not fromAi:
            return {
                "task_id": taskId,
                "category": parsedTaskInfo["catId"]
            }

    except Exception as e:
        print(e)

    finally:
        cur.close()

@app.post("/add_task")
@limiter.limit("50/minute")
async def addTask(
    request: Request, 
    files: List[UploadFile] | None = File(None), 
    task: str = Form(...), 
    files_info: str = Form(...), db = Depends(getDb), 
    user_id: int = Depends(get_current_user), 
    _: None = Depends(verify_csrf)):
    parsedFilesInfo = json.loads(files_info)
    parsedTaskInfo = json.loads(task)
    return await create_task_logic(parsedTaskInfo, parsedFilesInfo, files, db, False)

async def addCategoryLogic(data, db):
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
    
@app.post("/add_category")
@limiter.limit("50/minute")
async def addCategory(request: Request, data: Category, db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
    
    await addCategoryLogic(data, db)
 

@app.get("/get_tasks")
@limiter.limit("50/minute")
async def getTasks(request: Request,
    id: int,
    db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM tasks WHERE user_id=%s;",(id,))
        tasks = cur.fetchall()
        return tasks
    finally:
        cur.close()

@app.get("/get_category")
@limiter.limit("5000/minute")
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
        cur.execute("SELECT id, name, type, size, taskId FROM files WHERE taskId=%s",(task_id,))
        files = cur.fetchall()
        print(files)
        return files
    finally:
        cur.close()
@app.get("/get_file")
@limiter.limit("1000/minute")
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
@app.post("/change_task_field")
@limiter.limit("50/minute")
async def changeTaskField(request: Request, data: ChangeRequest, db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        task_id = data.task_id
        field = data.field
        change = data.change
        query = f"UPDATE tasks SET {field} = %s WHERE id = %s"
        cur.execute(query,(change,task_id))
        db.commit()
    finally:
        cur.close()


async def deleteTaskLogic(task_id, db):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("DELETE FROM tasks WHERE id=%s;",(task_id,))
        cur.execute("DELETE FROM files WHERE taskid=%s;",(task_id,))
        db.commit()
    finally:
        cur.close()
@app.delete("/delete_task")
@limiter.limit("50/minute")
async def deleteTask(request: Request, task_id: int, db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
        await deleteTaskLogic(task_id, db)

@app.post("/add_files")
@limiter.limit("50/minute")
async def addFiles(request: Request, 
    files: List[UploadFile] | None = File(None),
    files_info: str = Form(...),
    task_id: str = Form(...),
    db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        parsedFilesInfo = json.loads(files_info)
        if files:
            for file,file_info in zip(files,parsedFilesInfo):
                content = await file.read()
                cur.execute("INSERT INTO files (name, type, size, taskId, file) VALUES (%s, %s, %s, %s, %s)",(
                file_info["name"],
                file_info["type"],
                file_info["size"],
                task_id,
                content))
        db.commit()
    finally:
        cur.close()
@app.delete("/delete_file")
@limiter.limit("50/minute")
async def deleteFile(request: Request, file_id: int, db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("DELETE FROM files WHERE id=%s;",(file_id,))
        db.commit()
    finally:
        cur.close()
@app.put("/update_category")
@limiter.limit("50/minute")
async def updateCategory(request: Request, data: UpdateCategory, db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    if not user_id:
        return { "detail": [1] }
    try:
        print("list of keys")
        print(list(data.dailyTime.keys()))
        daily_date = list(data.dailyTime.keys())[-1]
        daily_time = data.dailyTime[daily_date]
        cur.execute("SELECT time FROM cat_daily_times WHERE cat_id=%s AND date=%s;",(data.catId,daily_date )) 
        curr_time = cur.fetchone()
        if not curr_time:
            cur.execute("INSERT INTO cat_daily_times(cat_id,date,time) VALUES(%s, %s, %s);",(data.catId,daily_date,daily_time))
        else:
            cur.execute("UPDATE cat_daily_times SET time=%s WHERE cat_id=%s AND date=%s;",(daily_time,data.catId,daily_date))
        db.commit()
        #PEAK OF PROGRAMMING

        print("start: " + data.start)
        print("end: " + data.end)
        print("date: " + daily_date)
        cur.execute("INSERT INTO start_end_times(cat_id,date,start_time,end_time) VALUES(%s, %s, %s, %s);",(data.catId,daily_date,data.start,data.end))
        db.commit()
        #PEAK OF PROGRAMMING
    finally:
        cur.close()
        return { "detail": [] }

@app.post("/send_request")
@limiter.limit("10/minute") # not sure if it should be 5
async def ai_route(request: Request, data: dict, db = Depends(getDb), user_id: int = Depends(get_current_user), _: None = Depends(verify_csrf)):
    message = data.get("message", "").lower()
    user_id = data["id"]

    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("INSERT INTO messages (user_id, role, content) VALUES (%s, %s, %s);", (user_id, "user", message))
        db.commit()
        cur.execute("""
            SELECT role, content 
            FROM messages 
            WHERE user_id = %s 
            ORDER BY created_at DESC 
            LIMIT 10
        """, (user_id,))

        messages = cur.fetchall()[::-1]  # reverse order
        contexts = [{
            "role": "system",
            "content": """
                always respond with ONLY json (no text before or after json). format: { action: string, data: object, message: string}. \n\n
                
                each action has a corresponding data block with its respective field\n
                formating notes:\n
                    date must always be in form mm-dd-yyyy regardless of what user says\n\n
                
                possible actions and their data block:\n
                    \"new_task\", data block: { task_name: string maxlen 100 not null, task_description: string maxlen 300, category_name: string max_len 100, date: date not null}\n
                    \"delete_task\", data block: { task_name: string maxlen 100 not null}\n\n
                    \"new_category\", data block: { category_name: string maxlen 100 not null}\n\n
                
                the message property of the main json is your actual text response about the outcome of the operation.\n
                if no task matches the user input, action is \"none\" and the data block is {}\n"""
        }]

        for message in messages:
            role = message["role"]
            content = message["content"]
            contexts.append({"role": role, "content": content})

        completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=contexts,
        temperature=1,
        max_completion_tokens=1024,
        top_p=1,
        stream=True,
        stop=None
        )

        full_response = ""

        for chunk in completion:
            content = chunk.choices[0].delta.content or ""
            full_response += content
        
        print("full_response")
        print(full_response)
        ai_response = json.loads(full_response)

        if ai_response["action"] == "new_task":
            print("/")

            if (not ai_response["data"]) or (not ai_response["data"]["category_name"]):
                return {"action": "none", "data": {}, "message": "Izgleda da ova kategorija ne postoji. Pokušajte unjeti ispavnu kategoriju"}

            cur.execute("SELECT id FROM categories WHERE name = %s;", (ai_response["data"]["category_name"],))

            id = cur.fetchone()
            if not id:
                return {"action": "none", "data": {}, "message": "Izgleda da ova kategorija ne postoji. Pokušajte unjeti ispavnu kategoriju"}
        
            id=id["id"]
            print("id")
            print(id)

            ai_response["data"]["userId"] = int(user_id)
            ai_response["data"]["completed"] = False
            ai_response["data"]["catId"] = id
            await create_task_logic(
                parsedTaskInfo=ai_response["data"],
                parsedFilesInfo=[],
                files=None,
                db=db,
                fromAi=True
            )
        
        elif ai_response["action"] == "delete_task":
            if (not ai_response["data"]) or (not ai_response["data"]["task_name"]):
                return {"action": "none", "data": {}, "message": "Izgleda da nema imena zadatka za obrisati. Pokušajte unjeti ispavno ime zadatka"}

            cur.execute("SELECT id FROM tasks WHERE name = %s;", (ai_response["data"]["task_name"],))

            id = cur.fetchone()
            if not id:
                return {"action": "none", "data": {}, "message": "Izgleda da nema imena zadatka za obrisati. Pokušajte unjeti ispavno ime zadatka"}
        
            id=id["id"]
            await deleteTaskLogic(id, db)

        elif ai_response["action"] == "new_category":
            if (not ai_response["data"]) or (not ai_response["data"]["category_name"]):
                return {"action": "none", "data": {}, "message": "Izgleda da nema imena kategorije za dodati. Pokušajte unjeti ispavno ime kategorije"}

            data = Category(
                id=0,  # or skip if DB generates it
                userId=user_id,
                name=ai_response["data"]["category_name"],
                dailyTimes={}
            )
            
            await addCategoryLogic(data, db)

        print("\n\n\n")
        print(contexts)

        return ai_response

    except Exception as e:
        print("error: ", e)
        traceback.print_exc()
        return {"action": "none", "data": {}, "message": "Izgleda da je došlo do pogreške. Provjerite jeste li unjeli sve podatke i svoju login sesiju."}

    finally:
        cur.close()
@app.post("/update_streak")
@limiter.limit("100/minute")
async def update_streak(request: Request, db = Depends(getDb), user_id: int = Depends(get_current_user), _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor) 
    try:
        current_time = datetime.now()
        cur.execute("SELECT current_streak longest_streak, updated_at FROM streaks WHERE user_id=%s;",(user_id,))
        result = cur.fetchone()
        if not result:
            cur.execute("INSERT INTO streaks (user_id,current_streak,longest_streak,updated_at) VALUES (%s, %s, %s, %s);",
            (user_id,1,1,current_time))
            db.commit()
            return
        if result[2].day+1 == current_time.day:
            new_streak = result[0]+1
            cur.execute("UPDATE streaks SET current_streak=%s WHERE user_id=%s;",(new_streak,user_id))
            if result[1] < new_streak:
                cur.execute("UPDATE streaks SET longest_streak=%s WHERE user_id=%s;",(new_streak,user_id))
        elif result[2].day != current_time.day:
            cur.execute("UPDATE streaks SET current_streak=1 WHERE user_id=%s;",(user_id,))
        db.commit()
        #if it's the same day then do nothing
    except Exception as e:
        print("exception occured:",e)
    finally:
        cur.close()

@app.get("/get_achievements")
@limiter.limit("100/minute")
async def get_achievements(request: Request, db = Depends(getDb), user_id: int = Depends(get_current_user), _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM achievements;")
        result = cur.fetchall()
        return result
    except Exception as e:
        print("exception occured:",e)
    finally:
        cur.close()
@app.get("/get_user_achievements")
@limiter.limit("100/minute")
async def get_user_achievements(request: Request, db = Depends(getDb), user_id: int = Depends(get_current_user), _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM user_achievements WHERE user_id=%s;",(user_id,))
        result = cur.fetchall()
        return result
    except Exception as e:
        print("exception occured:",e)
    finally:
        cur.close()
@app.get("/get_achievement_categories")
@limiter.limit("100/minute")
async def get_achievement_categories(request: Request, db = Depends(getDb), user_id: int = Depends(get_current_user), _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM achievement_categories;")
        result = cur.fetchall()
        print("categories:",result)
        return result
    except Exception as e:
        print("exception occured:",e)
    finally:
        cur.close()
