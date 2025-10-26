# app/ai_client.py
import os
def respond_to(prompt: str, model: str = None) -> str:
    """
    Panggil provider AI (Google GenAI/Gemini) jika GOOGLE_API_KEY ada,
    kalau tidak, kembalikan jawaban echo / simple reply.
    """
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        # fallback sederhana supaya dev & testing tetap jalan tanpa API key
        return f"[mock reply] Kamu menulis: {prompt}"
    # contoh pseudo-implementasi untuk google-genai (sesuaikan kalau pakai SDK)
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        chat = client.chats.create(model=model or os.environ.get("DEFAULT_MODEL","gemini-1.0"))
        res = chat.send_message(prompt)
        return res.text
    except Exception as e:
        # jangan bocorkan credential atau stacktrace di prod; cukup return error message kecil
        return f"[error contacting model] {str(e)}"
