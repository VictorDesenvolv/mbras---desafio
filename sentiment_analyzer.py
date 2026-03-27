import hashlib
import math
import re
import unicodedata
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from functools import lru_cache


PALAVRAS_POSITIVAS = {
    "bom", "boa", "otimo", "otima", "excelente", "maravilhoso", "maravilhosa",
    "adorei", "amei", "gostei", "incrivel", "fantastico", "fantastica",
    "perfeito", "perfeita", "lindo", "linda", "sensacional", "espetacular",
    "genial", "top", "show", "demais", "feliz", "alegre", "satisfeito", "satisfeita",
    "recomendo", "aprovado", "aprovada", "sucesso", "conquista", "positivo", "positiva",
    "eficiente", "rapido", "rapida", "facil", "pratico", "pratica", "util",
    "inovador", "inovadora", "impressionante", "dedicado", "dedicada", "competente",
    "profissional", "qualidade", "adorou", "amou", "gostou", "melhor", "parabens",
    "obrigado", "obrigada", "agradeco", "excepcional", "magnifico", "magnifica",
    "sublime", "extraordinario", "extraordinaria", "encantador", "encantadora",
    "surpreendente", "notavel", "brilhante", "superior", "destaque",
}

PALAVRAS_NEGATIVAS = {
    "ruim", "pessimo", "pessima", "horrivel", "terrivel", "detestei", "odiei",
    "nao_gostei", "fraco", "fraca", "decepcionante", "lixo", "porcaria", "vergonha",
    "ridículo", "ridiculo", "absurdo", "absurda", "insatisfeito", "insatisfeita",
    "triste", "raiva", "frustrado", "frustrada", "irritado", "irritada",
    "cansado", "cansada", "chato", "chata", "entediado", "entediada",
    "falha", "erro", "defeito", "problema", "dificil", "complicado", "complicada",
    "lento", "lenta", "caro", "cara", "inutil", "desperdicio", "fracasso",
    "negativo", "negativa", "desapontado", "desapontada", "medo", "preocupado",
    "preocupada", "horrendo", "horrenda", "deploravel", "lamentavel",
    "desagradavel", "inaceitavel", "reprovado", "reprovada", "inferior",
    "medíocre", "mediocre", "péssimo",
}

INTENSIFICADORES = {
    "muito", "demais", "bastante", "extremamente", "incrivelmente", "super",
    "ultra", "mega", "totalmente", "completamente", "absolutamente",
    "verdadeiramente", "realmente", "especialmente", "particularmente", "enormemente",
}

NEGACOES = {
    "nao", "não", "nunca", "jamais", "nem", "tampouco",
    "nenhum", "nenhuma", "nada", "sem",
}

FATOR_INTENSIFICADOR = 1.5
ESCOPO_NEGACAO = 3
MULT_MBRAS = 2.0
RAZAO_AUREA = (1 + math.sqrt(5)) / 2


def normalizar_nfkd(texto: str) -> str:
    nfkd = unicodedata.normalize("NFKD", texto)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower()


def tokenizar(conteudo: str) -> list[str]:
    return re.findall(r"#\w+|\w+", conteudo)


def pegar_tokens_normalizados(tokens: list[str]) -> list[str]:
    return [normalizar_nfkd(t) for t in tokens if not t.startswith("#")]


def pontuar_token(normalizado: str) -> float:
    if normalizado in PALAVRAS_POSITIVAS:
        return 1.0
    if normalizado in PALAVRAS_NEGATIVAS:
        return -1.0
    return 0.0


def compute_sentiment_score(conteudo: str, is_mbras_employee: bool) -> float:
    tokens = tokenizar(conteudo)
    tokens_norm = pegar_tokens_normalizados(tokens)
    if not tokens_norm:
        return 0.0

    pontuacoes = []
    for i, tok in enumerate(tokens_norm):
        base = pontuar_token(tok)
        if base == 0.0:
            pontuacoes.append(0.0)
            continue

        # intensificador na palavra anterior
        if i > 0 and tokens_norm[i - 1] in INTENSIFICADORES:
            base *= FATOR_INTENSIFICADOR

        # negação nas últimas N palavras
        if any(tokens_norm[j] in NEGACOES for j in range(max(0, i - ESCOPO_NEGACAO), i)):
            base *= -1.0

        # bonus mbras pra sentimento positivo
        if is_mbras_employee and base > 0:
            base *= MULT_MBRAS

        pontuacoes.append(base)

    return sum(pontuacoes) / len(tokens_norm)


def classify_sentiment(score: float) -> str:
    if score > 0.1:
        return "positive"
    elif score < -0.1:
        return "negative"
    return "neutral"


def compute_followers(user_id: str) -> int:
    digest = hashlib.sha256(user_id.encode()).hexdigest()
    return (int(digest, 16) % 10000) + 100


def compute_engagement_rate(user_id: str, msgs_do_user: list[dict]) -> float:
    if not msgs_do_user:
        return 0.0

    total_reactions = sum(m.get("reactions", 0) for m in msgs_do_user)
    total_shares = sum(m.get("shares", 0) for m in msgs_do_user)
    total_views = max(1, sum(m.get("views", 1) for m in msgs_do_user))

    taxa = (total_reactions + total_shares) / total_views

    total_interacoes = total_reactions + total_shares
    if total_interacoes > 0 and total_interacoes % 7 == 0:
        taxa *= (1 + 1 / RAZAO_AUREA)

    if user_id.endswith("007"):
        taxa *= 0.5

    return taxa


def compute_influence_score(
    user_id: str,
    msgs_do_user: list[dict],
    is_mbras_employee: bool,
) -> float:
    seguidores_norm = compute_followers(user_id) / 10100 * 10
    engajamento = compute_engagement_rate(user_id, msgs_do_user)
    score = (seguidores_norm * 0.4) + (engajamento * 0.6)
    if is_mbras_employee:
        score += 2.0
    return round(score, 4)


def calcular_trending_topics(
    msgs_na_janela: list[dict],
    sentimentos: dict[str, str],
    agora: datetime,
) -> list[dict]:
    MOD_SENTIMENTO = {"positive": 1.2, "negative": 0.8}
    dados_hashtag: dict[str, dict] = defaultdict(lambda: {"weight": 0.0, "count": 0, "sentiment_weight": 0.0})

    for msg in msgs_na_janela:
        ts_msg = _parse_ts(msg["timestamp"])
        minutos_atras = max((agora - ts_msg).total_seconds() / 60, 0.01)
        peso_temporal = 1 + (1 / minutos_atras)

        sentimento = sentimentos.get(msg["user_id"] + "|" + msg["timestamp"], "neutral")
        mod = MOD_SENTIMENTO.get(sentimento, 1.0)

        for tag in msg.get("hashtags", []):
            tag_lower = tag.lower()
            tag_limpa = tag_lower.lstrip("#")
            if len(tag_limpa) > 8:
                fator_longa = math.log10(len(tag_limpa)) / math.log10(8)
            else:
                fator_longa = 1.0

            peso = peso_temporal * mod * fator_longa
            dados_hashtag[tag_lower]["weight"] += peso
            dados_hashtag[tag_lower]["count"] += 1
            dados_hashtag[tag_lower]["sentiment_weight"] += mod

    ordenadas = sorted(
        dados_hashtag.items(),
        key=lambda x: (-x[1]["weight"], -x[1]["count"], -x[1]["sentiment_weight"], x[0]),
    )

    return [
        {
            "hashtag": tag,
            "score": round(data["weight"], 4),
            "count": data["count"],
        }
        for tag, data in ordenadas[:5]
    ]


def detectar_anomalias(
    msgs_na_janela: list[dict],
    sentimentos: dict[str, str],
) -> dict:
    anomalias = {
        "burst_users": [],
        "alternating_sentiment_users": [],
        "synchronized_groups": [],
    }

    msgs_por_user: dict[str, list[dict]] = defaultdict(list)
    for msg in msgs_na_janela:
        msgs_por_user[msg["user_id"]].append(msg)

    for uid, msgs in msgs_por_user.items():
        msgs_ordenadas = sorted(msgs, key=lambda m: _parse_ts(m["timestamp"]))
        timestamps = [_parse_ts(m["timestamp"]) for m in msgs_ordenadas]

        # burst: >10 msgs em 5 min (sliding window)
        esq = 0
        for dir in range(len(timestamps)):
            while (timestamps[dir] - timestamps[esq]).total_seconds() > 300:
                esq += 1
            if dir - esq + 1 > 10:
                anomalias["burst_users"].append(uid)
                break

        # sentimento alternado
        if len(msgs_ordenadas) >= 10:
            sentimentos_user = [
                sentimentos.get(uid + "|" + m["timestamp"], "neutral")
                for m in msgs_ordenadas
            ]
            for inicio in range(len(sentimentos_user)):
                if sentimentos_user[inicio] not in ("positive", "negative"):
                    continue
                tam_padrao = 1
                for k in range(inicio + 1, len(sentimentos_user)):
                    if sentimentos_user[k] in ("positive", "negative") and sentimentos_user[k] != sentimentos_user[k - 1]:
                        tam_padrao += 1
                    else:
                        break
                if tam_padrao >= 10:
                    anomalias["alternating_sentiment_users"].append(uid)
                    break

    # postagens sincronizadas: 3+ msgs em ±2s
    todas_ordenadas = sorted(msgs_na_janela, key=lambda m: _parse_ts(m["timestamp"]))
    todos_ts = [_parse_ts(m["timestamp"]) for m in todas_ordenadas]

    visitados = set()
    for i in range(len(todos_ts)):
        if i in visitados:
            continue
        grupo = [i]
        for j in range(i + 1, len(todos_ts)):
            if (todos_ts[j] - todos_ts[i]).total_seconds() <= 2:
                grupo.append(j)
            else:
                break
        if len(grupo) >= 3:
            users_do_grupo = sorted(set(todas_ordenadas[k]["user_id"] for k in grupo))
            if len(users_do_grupo) >= 2:
                anomalias["synchronized_groups"].append({
                    "timestamp_range": {
                        "start": todas_ordenadas[grupo[0]]["timestamp"],
                        "end": todas_ordenadas[grupo[-1]]["timestamp"],
                    },
                    "user_ids": users_do_grupo,
                    "message_count": len(grupo),
                })
            visitados.update(grupo)

    return anomalias


@lru_cache(maxsize=4096)
def _parse_ts(ts_str: str) -> datetime:
    return datetime.fromisoformat(ts_str[:-1] + "+00:00" if ts_str.endswith("Z") else ts_str)


def check_mbras_employee(user_id: str) -> bool:
    return "mbras" in user_id.lower()

def check_special_pattern(content: str) -> bool:
    return len(content) == 42 and "mbras" in content.lower()

def check_candidate_awareness(content: str) -> bool:
    return "teste técnico mbras" in content.lower()


def analyze_feed(data: dict, now_utc: datetime | None = None) -> dict:
    mensagens = data.get("messages", [])
    janela_minutos = data.get("time_window_minutes", 60)

    if now_utc is None:
        now_utc = datetime.now(timezone.utc)
    if now_utc.tzinfo is None:
        now_utc = now_utc.replace(tzinfo=timezone.utc)

    corte = now_utc - timedelta(minutes=janela_minutos)
    limite_futuro = now_utc + timedelta(seconds=5)

    msgs_na_janela = [
        msg for msg in mensagens
        if corte <= _parse_ts(msg["timestamp"]) <= limite_futuro
    ]

    msgs_por_user: dict[str, list[dict]] = defaultdict(list)
    for msg in msgs_na_janela:
        msgs_por_user[msg["user_id"]].append(msg)

    sentimentos: dict[str, str] = {}
    analises_msgs = []
    contagem_sentimentos = {"positive": 0, "negative": 0, "neutral": 0}

    for msg in msgs_na_janela:
        uid = msg["user_id"]
        conteudo = msg["content"]
        eh_mbras = check_mbras_employee(uid)
        eh_candidato = check_candidate_awareness(conteudo)

        chave = uid + "|" + msg["timestamp"]
        score = compute_sentiment_score(conteudo, eh_mbras)
        label = classify_sentiment(score)
        sentimentos[chave] = label

        eh_meta = eh_candidato
        eng_score = 9.42 if eh_candidato else compute_influence_score(
            uid, msgs_por_user[uid], eh_mbras,
        )

        analise_msg = {
            "user_id": uid,
            "content": conteudo,
            "timestamp": msg["timestamp"],
            "sentiment": {
                "score": round(score, 4),
                "label": "meta" if eh_meta else label,
            },
            "flags": {
                "mbras_employee": eh_mbras,
                "special_pattern": check_special_pattern(conteudo),
                "candidate_awareness": eh_candidato,
            },
            "engagement_score": round(eng_score, 4),
        }
        analises_msgs.append(analise_msg)

        if not eh_meta:
            contagem_sentimentos[label] += 1

    total_nao_meta = sum(contagem_sentimentos.values())
    if total_nao_meta > 0:
        distribuicao = {
            k: round(v / total_nao_meta * 100, 2)
            for k, v in contagem_sentimentos.items()
        }
    else:
        distribuicao = {"positive": 0.0, "negative": 0.0, "neutral": 0.0}

    trending = calcular_trending_topics(msgs_na_janela, sentimentos, now_utc)
    anomalias = detectar_anomalias(msgs_na_janela, sentimentos)

    return {
        "analysis": {
            "messages": analises_msgs,
            "sentiment_distribution": distribuicao,
            "trending_topics": trending,
            "anomalies": anomalias,
            "metadata": {
                "total_messages": len(mensagens),
                "messages_in_window": len(msgs_na_janela),
                "time_window_minutes": janela_minutos,
                "analyzed_at": now_utc.isoformat().replace("+00:00", "Z"),
            },
        }
    }
