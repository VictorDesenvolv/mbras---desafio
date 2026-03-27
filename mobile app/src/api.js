import { API_BASE_URL } from "./config";

const TIMEOUT_MS = 10000;

export async function analyzeFeed(messages, timeWindowMinutes) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/analyze-feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        time_window_minutes: timeWindowMinutes,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error(
        `Timeout: servidor não respondeu em ${TIMEOUT_MS / 1000}s.\nVerifique se o backend está rodando em ${API_BASE_URL}`
      );
    }
    throw new Error(
      `Sem conexão com o servidor.\nURL: ${API_BASE_URL}\nVerifique se o backend está rodando e acessível.\n(${err.message})`
    );
  } finally {
    clearTimeout(timer);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`HTTP ${response.status}: resposta inválida do servidor`);
  }

  if (!response.ok) {
    const errorMsg =
      data?.code ||
      data?.detail?.errors?.join(", ") ||
      JSON.stringify(data?.detail) ||
      "Erro desconhecido";
    throw new Error(`HTTP ${response.status}: ${errorMsg}`);
  }

  return data;
}
