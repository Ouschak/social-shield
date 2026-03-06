from openai import OpenAI
import os

_client = None


def get_client():
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return None
        _client = OpenAI(api_key=api_key)
    return _client


def moderate(text: str):
    client = get_client()
    if client is None:
        return {
            "is_toxic": False,
            "score": 0.0,
            "confidence": 0.0,
            "label": "safe",
            "source": "openai_disabled",
        }

    try:
        response = client.moderations.create(
            model="omni-moderation-latest",
            input=text,
        )
        result = response.results[0]
        scores = result.category_scores.__dict__
        toxic_score = max(
            scores.get("hate", 0.0),
            scores.get("hate/threatening", 0.0),
            scores.get("harassment", 0.0),
            scores.get("harassment/threatening", 0.0),
        )
        return {
            "is_toxic": bool(result.flagged),
            "score": float(toxic_score),
            "confidence": float(toxic_score),
            "label": "toxic" if result.flagged else "safe",
        }
    except Exception as e:
        print(f"OpenAI error: {e}")
        return {
            "is_toxic": False,
            "score": 0.0,
            "confidence": 0.0,
            "label": "error",
            "source": "openai_error",
        }
