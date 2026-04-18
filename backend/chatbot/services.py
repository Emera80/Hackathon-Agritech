import requests
import os
from django.conf import settings

def get_meteo(localisation):
    """
    Récupère la météo actuelle pour une ville donnée via OpenWeatherMap.
    """
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

def demander_a_gemini(question, localisation, contexte_meteo):
    """
    Envoie la question à l'API Gemini (via OpenRouter) en incluant le contexte météo.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return "Désolé, la clé API Gemini n'est pas configurée."

    # Puisque l'utilisateur utilise une clé OpenRouter (sk-or-v1-...),
    # nous utilisons l'endpoint d'OpenRouter avec le format compatible OpenAI.
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/Agitech", # Optionnel pour OpenRouter
        "X-Title": "Agitech Assistant" # Optionnel pour OpenRouter
    }

    prompt = f"""
    Tu es un assistant agricole expert en Tunisie nommé AgriAssistant TN.
    
    Localisation de l'utilisateur : {localisation}
    Contexte météo actuel : {contexte_meteo}
    
    Question de l'utilisateur : {question}
    
    CONSIGNES DE RÉPONSE :
    1. Réponds de manière simple, pédagogique et organisée (utilise des listes à puces).
    2. Utilise le français ou l'arabe/dialecte tunisien selon la langue de la question.
    3. Si la question est en arabe tunisien, réponds EXCLUSIVEMENT en arabe tunisien.
    4. Si la question est en français, réponds EXCLUSIVEMENT en français.
    5. Si pertinent, inclus des liens vers des ressources officielles (ex: Ministère de l'Agriculture Tunisie).
    6. Propose des conseils adaptés au climat tunisien (semi-aride/méditerranéen).
    7. Formate ta réponse en Markdown.
    8. Tu peux suggérer des images (ex: ![olivier](URL_D_IMAGE)) si cela aide à l'explication.
    9. ÉVITE les répétitions inutiles et les salutations excessives à chaque message si la conversation est déjà engagée.
    10. Sois concis pour faciliter la lecture vocale tout en restant complet.
    """

    payload = {
        "model": "google/gemini-2.0-flash-001", # Modèle Gemini via OpenRouter
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        if response.status_code == 200:
            result = response.json()
            # Extraction de la réponse (format standard OpenAI/OpenRouter)
            return result['choices'][0]['message']['content']
        elif response.status_code == 429:
            return "Désolé, la limite de requêtes (quota) d'OpenRouter est atteinte. Veuillez réessayer dans quelques minutes."
        elif response.status_code == 401:
            return "Erreur d'authentification : la clé API OpenRouter est invalide."
        else:
            return f"Erreur de l'API OpenRouter (Code {response.status_code})."
    except Exception as e:
        return f"Erreur de communication avec l'IA : {str(e)}"
