import os
import time
from datetime import datetime, timedelta, timezone

import pytest

from sentiment_analyzer import analyze_feed

pytestmark = pytest.mark.skipif(
    os.environ.get("RUN_PERF") != "1",
    reason="Testes de performance desabilitados. Use RUN_PERF=1 pra rodar.",
)


def _gerar_mensagens(qtd: int, base_time: datetime) -> list[dict]:
    positivas = [
        "Adorei o produto! Muito bom! #produto",
        "Excelente qualidade #qualidade",
        "Super recomendo para todos #recomendo",
    ]
    negativas = [
        "Não gostei nada #ruim",
        "Péssimo atendimento #atendimento",
        "Muito ruim, decepcionante #falha",
    ]
    neutras = [
        "O produto chegou hoje #entrega",
        "Vou avaliar depois #pendente",
        "Recebi o pedido #pedido",
    ]

    todas = positivas + negativas + neutras
    mensagens = []

    for i in range(qtd):
        conteudo = todas[i % len(todas)]
        ts = base_time - timedelta(seconds=i)
        mensagens.append({
            "user_id": f"user_perf_{i:05d}",
            "content": conteudo,
            "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "hashtags": [t for t in conteudo.split() if t.startswith("#")],
            "reactions": i % 10,
            "shares": i % 5,
            "views": max(1, i % 100),
        })

    return mensagens


def test_1000_messages_under_200ms():
    now = datetime(2025, 3, 25, 20, 30, 0, tzinfo=timezone.utc)
    mensagens = _gerar_mensagens(1000, now)

    data = {
        "messages": mensagens,
        "time_window_minutes": 60,
    }

    inicio = time.perf_counter()
    result = analyze_feed(data, now)
    tempo_ms = (time.perf_counter() - inicio) * 1000

    assert result is not None
    assert "analysis" in result
    print(f"\n1000 msgs processadas em {tempo_ms:.1f}ms")
    assert tempo_ms < 200, f"Muito lento: {tempo_ms:.1f}ms (alvo: <200ms)"


def test_10000_messages_memory():
    import tracemalloc

    now = datetime(2025, 3, 25, 20, 30, 0, tzinfo=timezone.utc)
    mensagens = _gerar_mensagens(10000, now)

    data = {
        "messages": mensagens,
        "time_window_minutes": 120,
    }

    tracemalloc.start()
    result = analyze_feed(data, now)
    current, pico = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    pico_mb = pico / (1024 * 1024)
    print(f"\n10k msgs pico de memória: {pico_mb:.1f}MB")
    assert pico_mb <= 20, f"Memória demais: {pico_mb:.1f}MB (alvo: <=20MB)"
    assert result is not None


def test_determinismo_batch_grande():
    now = datetime(2025, 3, 25, 20, 30, 0, tzinfo=timezone.utc)
    mensagens = _gerar_mensagens(500, now)
    data = {"messages": mensagens, "time_window_minutes": 60}

    r1 = analyze_feed(data, now)
    r2 = analyze_feed(data, now)

    assert r1 == r2
