import requests
import json
import os
from django.conf import settings


def get_meteo(localisation):
    api_key = os.getenv("WEATHER_API_KEY")
    if not api_key:
        return "Clé API météo manquante."

    url = f"http://api.openweathermap.org/data/2.5/weather?q={localisation}&appid={api_key}&units=metric&lang=fr"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            temp = data['main']['temp']
            desc = data['weather'][0]['description']
            return f"Météo à {localisation} : {temp}°C, {desc}."
        else:
            return f"Impossible de récupérer la météo pour {localisation}."
    except Exception as e:
        return f"Erreur météo : {str(e)}"


def build_prompt(question, localisation, contexte_meteo, has_image=False):
    image_instruction = ""
    if has_image:
        image_instruction = "L'utilisateur a envoyé une photo. Identifie précisément la plante, la maladie ou l'insecte visible. "

    return f"""
Tu es AgriAssistant TN, expert agricole pour la Tunisie.

📍 Localisation : {localisation}
🌤 Météo : {contexte_meteo}
❓ Question : {question}

{image_instruction}

═══ RÈGLES DE RÉPONSE ═══

LANGUE : Réponds dans la même langue que la question (français → français, arabe tunisien → arabe tunisien exclusivement).

STRUCTURE : Réponds avec cette structure visuelle claire en Markdown :

## 🌱 [Titre court du sujet]

**Résumé en 1-2 phrases directes et utiles.**

![description](URL_IMAGE_ICI)

### Points clés
- 🔑 Point important 1
- ✅ Point important 2
- ⚠️ Point à surveiller

### Conseil pratique
> 💡 **Astuce** : conseil concret adapté au climat tunisien.

[Ressource officielle si pertinente]

═══ IMAGES (OBLIGATOIRE si sujet agricole) ═══
Insère TOUJOURS une image pour tout sujet qui concerne plantes, cultures, animaux, irrigation, outils, parasites, récolte.
Format EXACT : ![description](https://source.unsplash.com/800x500/?MOT_EN_ANGLAIS)
Exemples de mots-clés : olive+tree+tunisia, wheat+field+harvest, drip+irrigation+farm, tomato+plant+garden, date+palm+sahara, fig+tree+mediterranean, olive+harvest, grape+vineyard+tunisia, potato+field, citrus+orchard

═══ VIDÉO (si démonstration visuelle utile) ═══
Pour les techniques (taille, greffe, traitement, irrigation), ajoute à la fin :
[VIDEO:ID_YOUTUBE:fr] ou [VIDEO:ID_YOUTUBE:ar]
Utilise uniquement des IDs YouTube réels et pertinents.

═══ STYLE ═══
- Utilise des emojis pour structurer visuellement (🌱 🔑 ✅ ⚠️ 💡 🌤 💧 🌾)
- Phrases courtes et directes
- Maximum 200 mots de texte pur (hors image/vidéo)
- Zéro salutations ou introductions inutiles
"""


def demander_a_gemini(question, localisation, contexte_meteo, image_b64=None):
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return "Désolé, la clé API Gemini n'est pas configurée."

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/Agitech",
        "X-Title": "Agitech Assistant"
    }

    content = []
    if image_b64:
        content.append({
            "type": "text",
            "text": build_prompt(question, localisation, contexte_meteo, has_image=True)
        })
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{image_b64}"
            }
        })
    else:
        content = build_prompt(question, localisation, contexte_meteo)

    payload = {
        "model": "google/gemini-2.0-flash-001",
        "messages": [{"role": "user", "content": content}]
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content']
        elif response.status_code == 429:
            return "Désolé, la limite de requêtes d'OpenRouter est atteinte. Réessayez dans quelques minutes."
        elif response.status_code == 401:
            return "Erreur d'authentification : la clé API OpenRouter est invalide."
        else:
            return f"Erreur de l'API OpenRouter (Code {response.status_code})."
    except Exception as e:
        return f"Erreur de communication avec l'IA : {str(e)}"


def demander_a_gemini_stream(question, localisation, contexte_meteo, image_b64=None):
    """
    Générateur qui yield des chunks de texte depuis l'API OpenRouter en mode stream.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        yield "Désolé, la clé API Gemini n'est pas configurée."
        return

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/Agitech",
        "X-Title": "Agitech Assistant"
    }

    content = []
    if image_b64:
        content.append({
            "type": "text",
            "text": build_prompt(question, localisation, contexte_meteo, has_image=True)
        })
        content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{image_b64}"
            }
        })
    else:
        content = build_prompt(question, localisation, contexte_meteo)

    payload = {
        "model": "google/gemini-2.0-flash-001",
        "messages": [{"role": "user", "content": content}],
        "stream": True
    }

    try:
        with requests.post(url, headers=headers, json=payload, stream=True, timeout=60) as response:
            if response.status_code != 200:
                yield f"Erreur API (Code {response.status_code})."
                return

            for raw_line in response.iter_lines():
                if not raw_line:
                    continue
                line = raw_line.decode('utf-8')
                if not line.startswith('data: '):
                    continue
                data_str = line[6:].strip()
                if data_str == '[DONE]':
                    return
                try:
                    chunk = json.loads(data_str)
                    delta = chunk['choices'][0]['delta'].get('content', '')
                    if delta:
                        yield delta
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue
    except Exception as e:
        yield f"Erreur de communication avec l'IA : {str(e)}"
