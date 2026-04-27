from fastapi import FastAPI, File, UploadFile, Form
from fastapi import Depends, Request, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from psycopg2.extras import RealDictCursor, Json
from psycopg2 import sql
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
from PyPDF2 import PdfReader
from docx import Document
import pytesseract
from PIL import Image
import io

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

def get_user_key(request: Request):
    try:
        user_id = get_current_user(request)
        return str(user_id)
    except:
        return get_remote_address(request)

def docx_to_text(file_bytes):
    with open("temp.docx", "wb") as f:
        f.write(file_bytes)

    doc = Document("temp.docx")
    return "\n".join([p.text for p in doc.paragraphs])

def pdf_to_text(file_bytes):
    reader = PdfReader(file_bytes)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text

def txt_to_text(file_bytes):
    return file_bytes.decode("utf-8")

def image_to_text(file_bytes):
    image = Image.open(io.BytesIO(file_bytes))
    return pytesseract.image_to_string(image)

def extract_text(file: UploadFile, content: bytes):
    if file.filename.endswith(".pdf"):
        return pdf_to_text(io.BytesIO(content))

    elif file.filename.endswith(".txt"):
        return txt_to_text(content)

    elif file.filename.endswith(".docx"):
        return docx_to_text(content)

    elif file.filename.endswith((".png", ".jpg", ".jpeg")):
        return image_to_text(content)

    else:
        return ""

def chunk_text(text, size=2000):
    return [text[i:i+size] for i in range(0, len(text), size)]

def call_ai(system, text):
    completion = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {
            "role": "system",
            "content": system
        },
        {
            "role": "user",
            "content": text
        },
    ])

    return completion.choices[0].message.content

limiter = Limiter(key_func=get_user_key)


app = FastAPI()

# rate limiting setup

# limiter = Limiter(key_func=get_remote_address)

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

class UpdateTimeAchievement(BaseModel):
    start: str
    end: str

class AddXP(BaseModel):
    start: str
    end: str

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
    cur.execute("INSERT INTO achievement_categories (name, description ) VALUES (%s, %s), (%s,%s), (%s,%s), (%s,%s);", 
    ("Konzistencija", "Konzistencija korisnika na temelju njegovih izmjerenih vremena",
     "Produktivnost", "Produktivnost korisnika na temelju njegovih obavljenih zadataka i logiranog vremena",
     "Vrijeme", "Provedeno vrijeme korisnika",
     "Razine", "Razine nekog korisnika"))
    cur.execute("SELECT * FROM achievements;")
    check = cur.fetchone()
    print("achievements check:",check)
    # All of this creates the pre-made achievements that users can get
    if check:
        return
    cur.execute("SELECT id FROM achievement_categories WHERE name=%s",("Konzistencija",))
    achievement_id = cur.fetchone()[0]

    cur.execute("""INSERT INTO achievements (achievement_category, name, description, is_active) VALUES 
    (%s, %s, %s,%s), (%s, %s, %s,%s), (%s, %s, %s,%s), (%s, %s, %s, %s), (%s, %s, %s, %s)""",
    (achievement_id,"Početak","Prvo logiranje vremena",True,
     achievement_id,"Zagrijavanje","Logiranje vremena 3 dana za redom",True,
     achievement_id,"Rad","Logiranje vremena 7 dana za redom",True,
     achievement_id,"Posvećenost","Logiranje vremena 30 dana za redom",True,
     achievement_id,"Nezaustavljiv","Logiranje vremena 90 dana za redom",True))
    
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
    (%s, %s, %s,%s), (%s, %s, %s,%s), (%s, %s, %s,%s), (%s,%s,%s,%s)""",
    (achievement_id,"Sat počinje","Logiraj svojih prvih 30 minuta",True,
     achievement_id,"Puno vremena","Logiraj svojih prvih 5 sati",True,
     achievement_id,"Investitor vremena","Logiraj svojih prvih 10 sati",True,
     achievement_id,"Mašina za rad","Logiraj 100 sati",True))

    cur.execute("SELECT id FROM achievement_categories WHERE name=%s",("Razine",))
    achievement_id = cur.fetchone()[0]
    cur.execute("""INSERT INTO achievements (achievement_category, name, description, is_active) VALUES 
    (%s, %s, %s,%s), (%s, %s, %s,%s), (%s, %s, %s,%s), (%s,%s,%s,%s)""",
    (achievement_id,"Razina 1","Napravi svoj račun",True,
     achievement_id,"Razina 5","Polako, ali sigurno radi.",True,
     achievement_id,"Razina 10","Već neko vrijeme si tu.",True,
     achievement_id,"Razina 20","Disciplina.",True))




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
            cat_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
            date DATE,
            time INTEGER
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS start_end_times (
            id SERIAL PRIMARY KEY,
            cat_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
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
            cat_id INTEGER REFERENCES categories(id) ON DELETE CASCADE
    );
    """)

    cur.execute(""" 
        CREATE TABLE IF NOT EXISTS files (
           id SERIAL PRIMARY KEY,
           name TEXT NOT NULL,
           type TEXT NOT NULL,
           size INT NOT NULL,
           taskId INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
           file BYTEA
        );
    """)

    cur.execute(""" 
        CREATE TABLE IF NOT EXISTS messages (
           id SERIAL PRIMARY KEY,
           user_id INT REFERENCES users(id) ON DELETE CASCADE,
           role TEXT NOT NULL,
           content TEXT NOT NULL,
           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute(""" 
        CREATE TABLE IF NOT EXISTS quizzes (
           id SERIAL PRIMARY KEY,
           user_id INT REFERENCES users(id) ON DELETE CASCADE,
           name TEXT NOT NULL,
           quiz JSONB NOT NULL,
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
    cur.execute("""
        CREATE TABLE IF NOT EXISTS stats(
           id SERIAL PRIMARY KEY,
           user_id INT REFERENCES users(id),
           tasks_count INT DEFAULT 0,
           completed_tasks_count INT DEFAULT 0,
           log_times_count INT DEFAULT 0,
           total_time INT DEFAULT 0,
           total_xp INT DEFAULT 0
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
        
        current_time = date.today()


        cur.execute("INSERT INTO users (name, password, email) VALUES (%s, %s, %s) RETURNING id;", (user.name, hashed_password, user.email))
        user_id = cur.fetchone()["id"]
        print(user_id)
        cur.execute("INSERT INTO stats (user_id, tasks_count, completed_tasks_count, log_times_count, total_time, total_xp) VALUES (%s,%s,%s,%s,%s,%s);",(user_id, 0,0,0,0,0))
        cur.execute("INSERT INTO streaks (user_id,current_streak,longest_streak,updated_at) VALUES (%s, %s, %s, %s);",
            (user_id,1,1,current_time))
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

async def removeCategoryLogic(id, db):
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


@app.post("/remove_category")
@limiter.limit("50/minute")
async def removeCategory(request: Request, id: int, db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
    await removeCategoryLogic(id, db)


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

async def changeTaskFieldLogic(data, db):
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

@app.post("/change_task_field")
@limiter.limit("50/minute")
async def changeTaskField(request: Request, data: ChangeRequest, db = Depends(getDb), user_id: int = Depends(get_current_user),
    _: None = Depends(verify_csrf)):
    await changeTaskFieldLogic(data, db)


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
@limiter.limit("5/second")
async def ai_route(
    request: Request,
    message: str = Form(...),
    id: int = Form(...), 
    files: List[UploadFile] = File(None),
    user_id: int = Depends(get_current_user), 
    db = Depends(getDb),
    _: None = Depends(verify_csrf)):

    all_text = ""

    if files:
        for file in files:
            content = await file.read()
            text = extract_text(file, content)
            all_text += f"""
                FILE: {file.filename}
                CONTENT:
                {text}

                """

            print(file.filename, len(content))
            print("EXTRACTED:", text)

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
                    date must always be in form mm-dd-yyyy regardless of what user says,
                    the "[]" contains a list of possible string values, choose one that suits user needs the best\n\n
                
                possible actions and their data block:\n
                    \"new_task\", data block: { name: string maxlen 100 not null, description: string maxlen 300, category_name: string max_len 100, taskDate: date not null}\n
                    \"delete_task\", data block: { task_name: string maxlen 100 not null}\n
                    \"new_category\", data block: { category_name: string maxlen 100 not null}\n
                    \"delete_category\", data block: { category_name: string maxlen 100 not null}\n
                    \"get_tasks\", data block: {}\n
                    \"get_categories\", data block: {}\n
                    \"edit_task_field\", data block: { task_name: string not null, field: [name, description, date, completed, cat_id], change: string not null}\n
                    \"create_quiz\", data block: {}\n\n
                
                action notes:\n
                    edit_task_field - if you detect this action, do not check if the task exists, just assemble the json based on instruction\n
                    capitalization of any letter matters in user entered tasks or categorie names, reflect it\n\n

                
                the message property of the main json is your actual text response about the outcome of the operation.\n
                if no task matches the user input, action is \"none\" and the data block is {}. return only one json of the described format (to the latest user's message).\n"""
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
        stream=False,
        stop=None
        )

        full_response = ""

        """for chunk in completion:
            content = chunk.choices[0].delta.content or ""
            full_response += content"""


        full_response = completion.choices[0].message.content

        print(full_response)
        
        ai_response = json.loads(full_response)

        if ai_response["action"] == "new_task":

            if (not ai_response["data"]) or (not ai_response["data"]["category_name"]):
                return {"action": "none", "data": {}, "message": "Izgleda da ova kategorija ne postoji. Pokušajte unjeti ispravnu kategoriju"}

            cur.execute("SELECT id FROM categories WHERE name = %s;", (ai_response["data"]["category_name"],))

            id = cur.fetchone()
            if not id:
                return {"action": "none", "data": {}, "message": "Izgleda da ova kategorija ne postoji. Pokušajte unjeti ispravnu kategoriju"}
        
            id=id["id"]

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
                return {"action": "none", "data": {}, "message": "Izgleda da nema imena zadatka za obrisati. Pokušajte unjeti ispravno ime zadatka"}

            cur.execute("SELECT id FROM tasks WHERE name = %s;", (ai_response["data"]["task_name"],))

            id = cur.fetchone()
            if not id:
                return {"action": "none", "data": {}, "message": "Izgleda da nema imena zadatka za obrisati. Pokušajte unjeti ispravno ime zadatka"}
        
            id=id["id"]
            await deleteTaskLogic(id, db)

        elif ai_response["action"] == "new_category":
            if (not ai_response["data"]) or (not ai_response["data"]["category_name"]):
                return {"action": "none", "data": {}, "message": "Izgleda da nema imena kategorije za dodati. Pokušajte unjeti ispravno ime kategorije"}

            data = Category(
                id=0,  # or skip if DB generates it
                userId=user_id,
                name=ai_response["data"]["category_name"],
                dailyTimes={}
            )
            
            await addCategoryLogic(data, db)

        elif ai_response["action"] == "delete_category":

            if (not ai_response["data"]) or (not ai_response["data"]["category_name"]):
                return {"action": "none", "data": {}, "message": "Izgleda da ova kategorija ne postoji. Pokušajte unjeti ispravnu kategoriju"}

            cur.execute("SELECT id FROM categories WHERE name = %s;", (ai_response["data"]["category_name"],))

            id = cur.fetchone()
            if not id:
                return {"action": "none", "data": {}, "message": "Izgleda da ova kategorija ne postoji. Pokušajte unjeti ispravnu kategoriju"}
        
            id=id["id"]
            await removeCategoryLogic(id, db)
        
        elif ai_response["action"] == "get_tasks":
            cur.execute("SELECT * FROM tasks WHERE user_id = %s;", (user_id,))

            tasks = cur.fetchall()
            if not tasks:
                return {"action": "none", "data": {}, "message": "Izgleda da to ne postoji. Pokušajte unjeti ispravno"}

            second_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": """explain the result to the user in a friendly way\n
                        always respond with ONLY json (no text before or after json). format: { action: "get_tasks", data: {}, message: string} 
                        - action is always get_tasks, data is always {}, message is your actual response"""
                },
                {
                    "role": "user",
                    "content": f"user asked: {message}"
                },
                {
                    "role": "system",
                    "content": f"here are their tasks: {tasks}"
                }
            ])
            final_message = json.loads(second_completion.choices[0].message.content)

            return {
                "action": "get_tasks",
                "data": tasks,
                "message": final_message["message"]
            }
        
        elif ai_response["action"] == "get_categories":
            cur.execute("SELECT * FROM categories WHERE user_id = %s;", (user_id,))

            cats = cur.fetchall()
            if not cats:
                return {"action": "none", "data": {}, "message": "Izgleda da to ne postoji. Pokušajte unjeti ispravno"}

            second_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": """explain the result to the user in a friendly way\n
                        always respond with ONLY json (no text before or after json). format: { action: "get_categories", data: {}, message: string} 
                        - action is always get_categories, data is always {}, message is your actual response"""
                },
                {
                    "role": "user",
                    "content": f"user asked: {message}"
                },
                {
                    "role": "system",
                    "content": f"here are their categories: {cats}"
                }
            ])
            final_message = json.loads(second_completion.choices[0].message.content)

            return {
                "action": "get_categories",
                "data": cats,
                "message": final_message["message"]
            }
        
        elif ai_response["action"] == "edit_task_field":

            cur.execute("SELECT * FROM tasks WHERE name = %s;", (ai_response["data"]["task_name"],))
            task = cur.fetchone()
            if not task:
                return {"action": "none", "data": {}, "message": "Izgleda da taj zadatak ne postoji. Pokušajte unjeti ispravan zadatak"}

            data = ChangeRequest(
                task_id=task["id"],
                field=ai_response["data"]["field"],
                change=ai_response["data"]["change"]
            )
            await changeTaskFieldLogic(data, db)

            second_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": """explain the result to the user in a friendly way\n
                        always respond with ONLY json (no text before or after json). format: { action: "edit_task_field", data: {}, message: string} 
                        - action is always edit_task_field, data is always {}, message is your actual response"""
                },
                {
                    "role": "user",
                    "content": f"user asked: {message}"
                },
                {
                    "role": "system",
                    "content": f"the field editing was successful"
                }
            ])
            final_message = json.loads(second_completion.choices[0].message.content)
            return {
                "action": "edit_task_field",
                "data": {},
                "message": final_message["message"]
            }
        
        elif ai_response["action"] == "create_quiz":

            summary = ""
            chunks = chunk_text(all_text)
            for chunk in chunks:
                summary += call_ai("summarize this (return same if code is provided):\n", chunk)

            # summary = """In mathematics, the quaternion number system extends the complex numbers. Quaternions were first described by the Irish mathematician William Rowan Hamilton in 1843[1][2] and applied to mechanics in three-dimensional space. The set of all quaternions is conventionally denoted by """

            print("summary: ")
            print(summary)



            second_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": """create a quiz from the supplied text that comes as user's uploaded files. always return ONLY a json, no exceptions, this means { is the first char and } last. format: 
                    { message: string not null name: string not null, questions: [ { question: string not null, answer_0: string not null, answer_1: string not null, 
                    answer_2: string not null, answer_3: string not null, correct: int }, ... ] }\n
                    note: choose an amount of questions you are going to create (anywhere between 1 and 20), place the correct answer as one of 0-3 questions 
                    (choose randomly each time), correct json attribute is set to a number of question that is correct, message should inform the user that the quiz was created"""
                },
                {
                    "role": "system",
                    "content": f"user's file contents: {summary}"
                },
                {
                    "role": "user",
                    "content": f"additional notes from the user: {message}"
                },
            ])

            print("content: ")
            
            result = str(second_completion.choices[0].message.content)

            print(result)

            print(result)

            print(result)

            result = json.loads(result)
            
            print(result)
            
            print(result)

            cur.execute("""
            INSERT INTO quizzes (user_id, name, quiz)
            VALUES (%s, %s, %s)
            """, (user_id, result["name"],Json(result)))

            db.commit()

            return {
                "action": "create_quiz",
                "data": {},
                "message": result["message"]
            }

        return ai_response

    except Exception as e:
        print("error: ", e)
        traceback.print_exc()
        return {"action": "none", "data": {}, "message": "Izgleda da je došlo do pogreške. Provjerite jeste li unjeli sve podatke i svoju login sesiju."}

    finally:
        cur.close()

async def log_achievement(user_id,achievement_id,progress,completed_progress,cur,db):
    try:
        # if the achievement is already completed, there is no reason to do any querying on that achievemnt anymore
        cur.execute("SELECT is_completed FROM user_achievements WHERE user_id=%s AND achievement_id=%s;",(user_id,achievement_id))
        is_completed = cur.fetchone()["is_completed"]
        if is_completed:
            return
        # update the achievement's progress with the newly given progress
        cur.execute("UPDATE user_achievements SET progress = %s WHERE user_id=%s AND achievement_id = %s RETURNING progress;",
                    (progress,user_id,achievement_id)) 
        current_progress = cur.fetchone()["progress"]

        # if the new progress is greater or equal to the required number for the completed progress
        # then set it as complete
        if current_progress >= completed_progress:
            cur.execute("UPDATE user_achievements SET is_completed = true WHERE user_id=%s AND achievement_id = %s;",
                        (user_id,achievement_id))
            cur.execute("UPDATE stats SET total_xp = total_xp + 10 WHERE user_id=%s",(user_id,))
        db.commit()
    except Exception as e:
        print("logging time achievement exception:",e)

async def add_xp_to_user(cur,db,xp_amount,user_id):

    cur.execute("UPDATE stats SET total_xp = total_xp + %s WHERE user_id=%s RETURNING total_xp;",(xp_amount,user_id))
    total_xp = cur.fetchone()["total_xp"]
    db.commit()

async def update_level_achievement(cur,db,user_id):
    cur.execute("SELECT total_xp FROM stats WHERE user_id=%s;",(user_id,));
    total_xp = cur.fetchone()["total_xp"]
    level = 1
    calc = 50
    while total_xp >= calc:
        print(calc)
        calc *= 1.5
        level+=1
    print(level)

    cur.execute("SELECT * FROM user_achievements WHERE user_id=%s",(user_id,))
    user_achievements = cur.fetchall()

    if not user_achievements:
        create_user_achievements(user_id,cur,db)
        
    cur.execute("SELECT * FROM achievement_categories WHERE name=%s;",("Razine",))
    razine_category_id = cur.fetchone()["id"]
    cur.execute("SELECT * FROM achievements WHERE achievement_category=%s;",(razine_category_id,))
    razine_achievements = cur.fetchall()
    completed_progress_dict = {"Razina 1": 1, "Razina 5": 5, "Razina 10": 10, "Razina 20": 20}
    for achievement in razine_achievements:
        if not achievement["is_active"]:
            continue
        await log_achievement(user_id,achievement["id"],level, completed_progress_dict[achievement["name"]],
                                    cur,db)
    db.commit()

@app.post("/update_streak")
@limiter.limit("100/minute")
async def update_streak(request: Request, db = Depends(getDb), user_id: int = Depends(get_current_user), _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor) 
    try:
        current_time = date.today()
        cur.execute("SELECT current_streak, longest_streak, updated_at FROM streaks WHERE user_id=%s;",(user_id,))
        result = cur.fetchone()
        #print(result, len(result), type(result), dict(result))
        if not result:
            cur.execute("INSERT INTO streaks (user_id,current_streak,longest_streak,updated_at) VALUES (%s, %s, %s, %s);",
            (user_id,1,1,current_time))
            db.commit()
            return
        result = dict(result)
        next_day = result["updated_at"].date() + timedelta(days=1)
        if next_day == current_time:
            new_streak = result["current_streak"]+1
            cur.execute("UPDATE streaks SET current_streak=%s WHERE user_id=%s;",(new_streak,user_id))
            cur.execute("UPDATE streaks SET updated_at=%s WHERE user_id=%s;",(current_time,user_id))
            
            streak_xp = new_streak*2
            await add_xp_to_user(cur,db,streak_xp,user_id)
            await update_level_achievement(cur,db,user_id)
            if result["longest_streak"] < new_streak:
                cur.execute("UPDATE streaks SET longest_streak=%s WHERE user_id=%s;",(new_streak,user_id))
        elif next_day - timedelta(days=1) != current_time.day:
            pass
            # if it's the same day then do nothing
        else:
            # if it's any other day, then start again
            cur.execute("UPDATE streaks SET current_streak=1 WHERE user_id=%s;",(user_id,))
            cur.execute("UPDATE streaks SET updated_at=%s WHERE user_id=%s;",(current_time,user_id))
        db.commit()
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

@app.get("/get_user_data_by_table")
@limiter.limit("100/minute")
async def get_user_data_by_table(request: Request,table: str, db = Depends(getDb), user_id: int = Depends(get_current_user), _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute(sql.SQL("SELECT * FROM {} WHERE user_id=%s;").format(
            sql.Identifier(table)
        ),(user_id,))
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
        return result
    except Exception as e:
        print("exception occured:",e)
    finally:
        cur.close()

# achievements for users aren't created when they sign up, they need to be created the first time a user logs anything
async def create_user_achievements(user_id,cur,db):
    try:
        cur.execute("SELECT id FROM achievements;")
        achievement_ids = cur.fetchall()

        # this loop just goes through the list of achievement ids, and set every achievemnt for the user as not complete
        for achievement_id in achievement_ids:
           cur.execute("""INSERT INTO user_achievements(user_id,achievement_id,progress,is_completed)
           VALUES (%s,%s,%s,false)
           """,(user_id,achievement_id["id"],0))
        db.commit()
    except Exception as e:
        print("creating user achievements exception:",e)
    


@app.put("/update_time_achievement")
@limiter.limit("100/minute")
async def update_time_achievement(request: Request,data: UpdateTimeAchievement, db = Depends(getDb), user_id: int = Depends(get_current_user), _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        # this logic for getting the time_to_add is needed for updating the stats and the progress for time achievements 
        # it basically converts the start and end strings into datetime objects and then calculate their difference
        # and converts it into an integer
        start = datetime.strptime(data.start,"%H:%M:%S.%f")
        end = datetime.strptime(data.end,"%H:%M:%S.%f")
        start_seconds = start.hour * 3600 + start.minute * 60 + start.second + start.microsecond / 1000000
        end_seconds = end.hour * 3600 + end.minute * 60 + end.second + end.microsecond / 1000000
        time_to_add = int(end_seconds - start_seconds)
       
        # this updates the stats table. The stats table is used for achievements and showing stats somewhere(it will probably be implemented later)
        cur.execute("UPDATE stats SET total_time = total_time + %s WHERE user_id=%s RETURNING total_time;",(time_to_add,user_id))
        total_time = cur.fetchone()["total_time"] 
        cur.execute("UPDATE stats SET log_times_count = log_times_count + 1 WHERE user_id=%s RETURNING log_times_count;",(user_id,))
        log_times_count = cur.fetchone()["log_times_count"] 
        
        # this is used for creating user_achievements if they don't exist
        cur.execute("SELECT * FROM user_achievements WHERE user_id=%s;",(user_id,))
        user_achievements = cur.fetchall()
        if not user_achievements:
            await create_user_achievements(user_id,cur,db)
        
        # this is basically the core logic, it just goes through every achievement in the vrijeme category and logs each one with the new progress
        cur.execute("SELECT * FROM achievement_categories WHERE name=%s;",("Vrijeme",))
        vrijeme_category_id = cur.fetchone()["id"]
        cur.execute("SELECT * FROM achievements WHERE achievement_category=%s;",(vrijeme_category_id,))
        vrijeme_achievements = cur.fetchall()
        

        completed_progress_dict = {"Sat počinje": 1800, "Puno vremena": 18000, "Investitor vremena": 36000, "Mašina za rad": 360000}
        for achievement in vrijeme_achievements:
            # this is_active field refers to the actual achievement (basically if the developer wants it to be available or not)
            if not achievement["is_active"]:
                continue
            await log_achievement(user_id,achievement["id"],total_time,completed_progress_dict[achievement["name"]]
                                       ,cur,db)
        await update_level_achievement(cur,db,user_id)
        
        #print(total_time, log_times_count,vrijeme_category_id)
        db.commit()
        
    except Exception as e:
        print("exception occured:",e)
    finally:
        cur.close()

# this route does basically the same thing as the /update_time_achievement route, just for the streaks
@app.put("/update_streak_achievement")
@limiter.limit("100/minute")
async def update_streak_achievement(request: Request, db = Depends(getDb), user_id: int = Depends(get_current_user), _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM streaks WHERE user_id=%s;",(user_id,))
        user_streak = cur.fetchone()
        
        cur.execute("SELECT * FROM user_achievements WHERE user_id=%s",(user_id,))
        user_achievements = cur.fetchall()

        if not user_achievements:
            create_user_achievements(user_id,cur,db)
        
        cur.execute("SELECT * FROM achievement_categories WHERE name=%s;",("Konzistencija",))
        konzistencija_category_id = cur.fetchone()["id"]
        cur.execute("SELECT * FROM achievements WHERE achievement_category=%s;",(konzistencija_category_id,))
        konzistencija_achievements = cur.fetchall()
        completed_progress_dict = {"Početak": 1, "Zagrijavanje": 3, "Rad": 7, "Posvećenost": 30, "Nezaustavljiv": 90}
        
        # always take the longest_streak for achievements
        longest_streak = user_streak["longest_streak"]
        for achievement in konzistencija_achievements:
            if not achievement["is_active"]:
                continue
            await log_achievement(user_id,achievement["id"],longest_streak, completed_progress_dict[achievement["name"]],
                                       cur,db)
        await update_level_achievement(cur,db,user_id)
        db.commit()

    except Exception as e:
        print("exception occured:",e) 
    finally:
        cur.close()
@app.put("/update_task_achievement")
@limiter.limit("100/minute")
async def update_task_achievement(request: Request, db = Depends(getDb), user_id: int = Depends(get_current_user), _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("UPDATE stats SET tasks_count = tasks_count + 1 WHERE user_id=%s RETURNING tasks_count;",(user_id,))
        tasks_count = cur.fetchone()["tasks_count"]
        
        cur.execute("SELECT * FROM user_achievements WHERE user_id=%s;",(user_id,))
        user_achievements = cur.fetchall()

        if not user_achievements:
            create_user_achievements(user_id,cur,db)

        cur.execute("SELECT * FROM achievement_categories WHERE name=%s;",("Produktivnost",))
        produktivnost_category_id = cur.fetchone()["id"]
        cur.execute("SELECT * FROM achievements WHERE achievement_category=%s;",(produktivnost_category_id,))
        produktivnost_achievements = cur.fetchall()
        # I need to handle "Radi se" achievement differently 
        completed_progress_dict = {"Prvi zadatak": 1, "Dosta posla": 10, "Radi se": 10}
        print("produktivnost:",produktivnost_achievements) 
        for achievement in produktivnost_achievements:
            if not achievement["is_active"]:
                continue
            # Handle that achievement differently
            if achievement["name"] == "Radi se":
                continue
            await log_achievement(user_id,achievement["id"],tasks_count, completed_progress_dict[achievement["name"]],
                                  cur,db)
        await update_level_achievement(cur,db,user_id)
    except Exception as e:
        print("exception occured:",e)
    finally:
        cur.close()

# this route handles the same category as the update_task_achievement route, but it is for a different type of achievements
@app.put("/update_completed_task_achievement")
@limiter.limit("100/minute")
async def update_completed_task_achievement(request: Request, db = Depends(getDb), user_id: int = Depends(get_current_user), _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("UPDATE stats SET completed_tasks_count = completed_tasks_count + 1 WHERE user_id=%s RETURNING completed_tasks_count;",(user_id,))
        completed_tasks_count = cur.fetchone()["completed_tasks_count"]
        
        cur.execute("SELECT * FROM user_achievements WHERE user_id=%s;",(user_id,))
        user_achievements = cur.fetchall()

        if not user_achievements:
            create_user_achievements(user_id,cur,db)

        cur.execute("SELECT * FROM achievement_categories WHERE name=%s;",("Produktivnost",))
        produktivnost_category_id = cur.fetchone()["id"]
        cur.execute("SELECT * FROM achievements WHERE achievement_category=%s;",(produktivnost_category_id,))
        produktivnost_achievements = cur.fetchall()
        # I need to handle "Radi se" achievement differently 
        completed_progress_dict = {"Radi se": 10}
        print("produktivnost:",produktivnost_achievements) 
        for achievement in produktivnost_achievements:
            if not achievement["is_active"]:
                continue
            # Handle that achievement differently
            if achievement["name"] == "Radi se":
                await log_achievement(user_id,achievement["id"],completed_tasks_count, completed_progress_dict[achievement["name"]],
                        cur,db) 
            else:
                continue
        await update_level_achievement(cur,db,user_id)


    except Exception as e:
        print("exception occured:",e)
    finally:
        cur.close()

@app.post("/change_password")
@limiter.limit("10/minute")
async def changePassword(request: Request, data: dict, db = Depends(getDb), user_id: int = Depends(get_current_user), _: None = Depends(verify_csrf)):
    old = data["old"]
    new = data["new"]

    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM users WHERE id = %s;", (user_id,))
        result = cur.fetchone()
        if not bcrypt.checkpw(
            old.encode(),
            result["password"].encode()
        ):
            return { "message": "wrong_password" }

        new_password = bcrypt.hashpw(
            new.encode(),
            bcrypt.gensalt()
        ).decode()
        cur.execute("UPDATE users SET password = %s WHERE id = %s;", (new_password, user_id))
        db.commit()

        return { "message": "success" }
    except Exception as e:
        print("error: ", e)

    finally:
        cur.close()

@app.post("/change_username")
@limiter.limit("10/minute")
async def changeUsername(request: Request, data: dict, db = Depends(getDb), user_id: int = Depends(get_current_user), _: None = Depends(verify_csrf)):
    password = data["password"]
    new = data["new_name"]

    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM users WHERE name = %s;", (new,))
        result = cur.fetchone()

        print("test1")
        if result:
            return {"message": "user_exists"}

        cur.execute("SELECT * FROM users WHERE id = %s;", (user_id,))
        result = cur.fetchone()

        print("test2")
        if not bcrypt.checkpw(
            password.encode(),
            result["password"].encode()
        ):
            return { "message": "wrong_password" }

        print("test3")
        cur.execute("UPDATE users SET name = %s WHERE id = %s;", (new, user_id))
        db.commit()

        return { "message": "success" }

    except Exception as e:
        print("error: ", e)

    finally:
        cur.close()

@app.delete("/delete_categories")
@limiter.limit("10/minute")
async def deleteCategories(request: Request, db = Depends(getDb), user_id: int = Depends(get_current_user), _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("DELETE FROM categories WHERE user_id = %s;", (user_id,))
        db.commit()

        return { "message": "success" }
    except Exception as e:
        print("error: ", e)
    finally:
        cur.close()

@app.delete("/delete_tasks")
@limiter.limit("10/minute")
async def deleteCategories(request: Request, db = Depends(getDb), user_id: int = Depends(get_current_user), _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("DELETE FROM tasks WHERE user_id = %s;", (user_id,))
        db.commit()

        return { "message": "success" }
    except Exception as e:
        print("error: ", e)
    finally:
        cur.close()

@app.get("/get_quizzes")
@limiter.limit("10/minute")
async def getQuizes(request: Request, db = Depends(getDb), user_id: int = Depends(get_current_user), _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT id, name, quiz, created_at
            FROM quizzes
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))

        quizzes = cur.fetchall()

        return {
            "quizzes": quizzes
        }

    finally:
        cur.close()

@app.put("/add_xp")
@limiter.limit("100/minute")
async def add_xp(request: Request, data: AddXP, db = Depends(getDb), user_id: int = Depends(get_current_user), _: None = Depends(verify_csrf)):
    cur = db.cursor(cursor_factory=RealDictCursor)
    try:
        start = datetime.strptime(data.start,"%H:%M:%S.%f")
        end = datetime.strptime(data.end,"%H:%M:%S.%f")
        start_seconds = start.hour * 3600 + start.minute * 60 + start.second + start.microsecond / 1000000
        end_seconds = end.hour * 3600 + end.minute * 60 + end.second + end.microsecond / 1000000
        total_minutes = int((end_seconds // 60) - (start_seconds // 60)) 
        
        #print(f"total minutes measured: {total_minutes}")
        # 1 logged minute is equal to 1 xp
        await add_xp_to_user(cur,db,total_minutes, user_id)
        await update_level_achievement(cur,db,user_id)

        db.commit()

    except Exception as e:
        print("exception occured:",e)
    finally:
        cur.close()
