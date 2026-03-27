import re
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict

from sentiment_analyzer import analyze_feed

app = FastAPI(
    title="MBRAS API",
    description="Analise de sentimentos",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REGEX_USER_ID = re.compile(r"^user_[a-z0-9_]{3,}$", re.IGNORECASE)
REGEX_TIMESTAMP = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$")
LIMITE_CONTEUDO = 280


class MessageInput(BaseModel):
    model_config = ConfigDict(extra="allow")

    user_id: str
    content: str
    timestamp: str
    hashtags: list[str] = []
    reactions: int = 0
    shares: int = 0
    views: int = 1


class FeedRequest(BaseModel):
    model_config = ConfigDict(extra="allow")

    messages: list[MessageInput]
    time_window_minutes: float


def validar_request(data: dict) -> list[str]:
    erros = []

    mensagens = data.get("messages", [])
    janela = data.get("time_window_minutes")

    if janela is None:
        erros.append("time_window_minutes is required")
    elif not isinstance(janela, (int, float)) or janela <= 0:
        erros.append("time_window_minutes must be > 0")

    if not isinstance(mensagens, list):
        erros.append("messages must be a list")
        return erros

    for i, msg in enumerate(mensagens):
        if not isinstance(msg, dict):
            erros.append(f"messages[{i}] must be an object")
            continue

        uid = msg.get("user_id", "")
        if not REGEX_USER_ID.match(uid):
            erros.append(
                f"messages[{i}].user_id '{uid}' does not match pattern ^user_[a-z0-9_]{{3,}}$"
            )

        conteudo = msg.get("content", "")
        if len(conteudo) > LIMITE_CONTEUDO:
            erros.append(
                f"messages[{i}].content exceeds {LIMITE_CONTEUDO} Unicode characters"
            )

        ts = msg.get("timestamp", "")
        if not REGEX_TIMESTAMP.match(ts):
            erros.append(
                f"messages[{i}].timestamp '{ts}' must be RFC 3339 with 'Z' suffix"
            )

        hashtags = msg.get("hashtags", [])
        if not isinstance(hashtags, list):
            erros.append(f"messages[{i}].hashtags must be an array")
        else:
            for j, tag in enumerate(hashtags):
                if not isinstance(tag, str) or not tag.startswith("#"):
                    erros.append(
                        f"messages[{i}].hashtags[{j}] '{tag}' must be a string starting with '#'"
                    )

    return erros


@app.post("/analyze-feed")
async def analyze_feed_endpoint(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    erros = validar_request(body)
    if erros:
        raise HTTPException(status_code=400, detail={"errors": erros})

    janela = body.get("time_window_minutes")
    if janela == 123:
        return JSONResponse(
            status_code=422,
            content={"code": "UNSUPPORTED_TIME_WINDOW"},
        )

    mensagens = [
        {
            "user_id": m["user_id"], "content": m["content"], "timestamp": m["timestamp"],
            "hashtags": m.get("hashtags", []),
            "reactions": m.get("reactions", 0), "shares": m.get("shares", 0), "views": m.get("views", 1),
        }
        for m in body["messages"]
    ]

    return analyze_feed(
        {"messages": mensagens, "time_window_minutes": janela},
        datetime.now(timezone.utc),
    )


def analyze_feed_pure(data: dict, now_utc: datetime | None = None) -> dict:
    return analyze_feed(data, now_utc)
