# app/main.py
import uuid
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os

from app import db
from app.ai_client import respond_to

app = FastAPI(title="Mini-Gemini Chat (no-login)")

# serve frontend
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# init DB on startup
@app.on_event("startup")
def on_startup():
    db.init_db()

class SendReq(BaseModel):
    session_id: str
    conversation_id: int
    message: str
    model: str = None

@app.get("/")
def index():
    return FileResponse("app/static/index.html")

@app.post("/api/new-session")
async def new_session():
    # create a new session id and default conversation
    session_id = str(uuid.uuid4())
    db.create_session(session_id)
    conv_id = db.create_conversation(session_id, title="New conversation")
    return {"session_id": session_id, "conversation_id": conv_id}

@app.post("/api/new-conversation")
async def new_conversation(payload: dict):
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    conv_id = db.create_conversation(session_id, title="New conversation")
    return {"conversation_id": conv_id}

@app.get("/api/conversations/{session_id}")
async def get_conversations(session_id: str):
    convs = db.list_conversations(session_id)
    return {"conversations": convs}

@app.get("/api/messages/{conversation_id}")
async def get_messages(conversation_id: int):
    msgs = db.get_messages(conversation_id)
    return {"messages": msgs}

@app.post("/api/send")
async def send_message(req: SendReq):
    # store user message
    db.add_message(req.conversation_id, "user", req.message)
    # prepare context (simple: concatenate last N messages)
    msgs = db.get_messages(req.conversation_id)
    prompt = "\n".join([m["role"] + ": " + m["content"] for m in msgs[-10:]])  # last 10
    resp_text = respond_to(prompt, model=req.model)
    db.add_message(req.conversation_id, "assistant", resp_text)
    return {"text": resp_text}
