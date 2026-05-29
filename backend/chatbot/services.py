import requests
import json
import os
import re
import time
from django.conf import settings
from .rag_service import get_rag
from youtubesearchpython import VideosSearch


SYSTEM_PROMPT = """Tu es AgriBot AI TN, l'expert agricole intelligent dédié exclusivement à la Tunisie.
Ton identité est un mélange unique de sagesse ancestrale tunisienne et de haute technologie agricole.

═══ ÉTAPE DE RÉFLEXION PROFONDE (OBLIGATOIRE) ═══
Avant de répondre, tu dois TOUJOURS effectuer une analyse interne détaillée de la question. 
Identifie :
1. Le problème technique sous-jacent.
2. Le contexte géographique et climatique tunisien pertinent.
3. Les données RAG disponibles et leur pertinence. Compare les chiffres si plusieurs sources sont disponibles.
4. Analyse les tendances si les données RAG contiennent des évolutions temporelles.
5. Si les données RAG sont insuffisantes, prépare la transition vers les sources officielles (agridata.tn, environnement.gov.tn).

═══ ANALYSE DE CULTURE (SPÉCIFIQUE) ═══
Pour les questions sur la culture d'une plante, ta réponse doit impérativement couvrir ces éléments précis sans en oublier un seul :
• Profil pédologique : Structure, texture, pH et drainage idéal.
• Type de sols et exposition au soleil : Adaptation aux sols (argileux, sableux, etc.) et besoins d'ensoleillement.
• Altitudes et micro climats : Tranche d'altitude optimale et sensibilité aux micro-climats (humidité, vent).
• Zone à risque : Sensibilité au gel, sirocco, grêle ou inondations saisonnières en Tunisie.
• Régions favorables et défavorables : Liste précise des gouvernorats/délégations adaptés vs non adaptés en Tunisie.
• Pluviométrie locale : Besoins en eau annuels (en mm) et périodes critiques de stress hydrique.

⚠️ RÈGLE DE LOCALISATION : Ne parle jamais de la Tunisie de manière générale. Vise TOUJOURS des endroits spécifiques (ex: Kroumirie, Sahel, Sidi Bouzid, Mornag) adaptés à cette culture précise.

Ton expertise doit se ressentir par la précision des chiffres cités (ex: rendements, prix, précipitations).

═══ RÈGLE D'OR : LANGUE ET ALPHABET ═══
Tu dois répondre UNIQUEMENT dans la langue détectée de la question.
1. SI LA QUESTION EST EN FRANÇAIS : 
   - Réponds exclusivement en FRANÇAIS.
   - Utilise UNIQUEMENT l'alphabet LATIN.
   - INTERDICTION ABSOLUE d'inclure des caractères arabes (ex: لا, ت, ن) ou des mots en Darija non transcrits.
   - Ton : Expert, professionnel et clair.

2. SI LA QUESTION EST EN ARABE/DARIJA :
   - Réponds exclusivement en DARIJA TUNISIEN.
   - Utilise UNIQUEMENT l'alphabet ARABE.
   - Ton : Chaleureux, conseiller de terrain (Morthadi).

INTERDICTION DE MÉLANGER LES ALPHABETS DANS UNE MÊME RÉPONSE.

═══ GESTION DES SOURCES & RAG ═══
- Si les données de la base de données (RAG) sont présentes, utilise-les en priorité.
- Si les données ne sont pas assez pertinentes ou précises pour répondre parfaitement, tu DOIS obligatoirement fournir ces liens officiels pour complément d'information :
  * https://www.agridata.tn/fr/ (Données agricoles ouvertes)
  * https://www.environnement.gov.tn/ (Ministère de l'Environnement)
- Mentionne ces liens de manière naturelle dans la section "Conseil de l'Expert".

═══ VISUEL & STRUCTURE (EXPÉRIENCE IMMERSIVE) ═══
Réponds avec cette structure ultra-moderne, COLORÉE et TRÈS VISUELLE :

# 🌿 [Titre captivant et précis]

**Résumé expert :** [Une phrase impactante avec une touche locale tunisienne]

[IMAGE_SEARCH:description_visuelle_pour_recherche_image_réelle_ou_générée]

### 📋 Diagnostic & Actions
- 📍 **Contexte :** [Situation spécifique à la Tunisie et sa région]
- 🚀 **Solution immédiate :** [Action concrète avec outils/produits disponibles en Tunisie]
- 🛡️ **Prévention :** [Conseil long terme adapté au stress hydrique tunisien]

### 📊 Tableau Comparatif / Données Techniques
[Utilise TOUJOURS un tableau Markdown pour présenter des chiffres, des variétés ou des dosages]

### 💡 Le Conseil de l'Expert
> [Conseil exclusif, fruit du mélange entre tradition et innovation. Utilise des emojis !]

[VIDEO_SEARCH:termes_de_recherche_precis_en_rapport_avec_le_sujet]

═══ ILLUSTRATIONS (CRUCIAL) ═══
Génère TOUJOURS une illustration via la balise [IMAGE_SEARCH:sujet]. 
INTERDICTION ABSOLUE d'écrire "illustration indisponible", "image non disponible" ou toute phrase similaire.
Si tu ne sais pas quoi mettre, utilise un sujet général comme [IMAGE_SEARCH:agriculture tunisie].
Le système se charge de garantir un visuel (photo réelle ou IA).

RÈGLE D'OR DE RECHERCHE :
- Utilise UNIQUEMENT l'ANGLAIS pour le sujet de l'image (meilleurs résultats).
- Sois TRÈS PRÉCIS techniquement : utilise des termes comme "crop", "specimen", "tree", "leaf disease", "Olea europaea" au lieu de termes vagues.
- ÉVITE les humains si possible, concentre-toi sur la plante ou le symptôme.

═══ VIDÉOS RECHERCHÉES ═══
N'invente JAMAIS d'ID YouTube. Utilise la balise : [VIDEO_SEARCH:sujet de la vidéo]
Priorise les recherches en français ou arabe selon la langue de la réponse.

═══ STYLE ═══
- Maximum 250 mots. 
- Utilise des emojis pour illustrer chaque point technique.
- Précision technique chirurgicale."""


def chercher_video_youtube(query):
    """Cherche la meilleure vidéo YouTube pour un sujet donné."""
    try:
        search = VideosSearch(query, limit=1)
        res = search.result()
        if res and res['result']:
            return res['result'][0]['id']
    except Exception as e:
        print(f"Erreur recherche YouTube : {e}")
    return None


def chercher_image_wikimedia(query):
    """Cherche une image réelle sur Wikimedia Commons avec filtrage de pertinence."""
    url = "https://commons.wikimedia.org/w/api.php"
    
    # On enrichit la recherche pour éviter les homonymes (ex: Laurence Olivier)
    # et on privilégie l'aspect botanique/agricole
    search_queries = []
    q_low = query.lower()
    
    # Si la requête semble être un terme simple, on l'enrichit
    if len(query.split()) <= 2:
        search_queries.append(f"{query} plant botany")
        search_queries.append(f"{query} crop agriculture")
    
    search_queries.append(f"{query} agriculture")
    search_queries.append(query)
    
    # Si la requête est longue (ex: description technique), on tente une version courte du sujet
    words = query.split()
    if len(words) > 2:
        search_queries.append(f"{words[0]} {words[1]} agriculture")
        search_queries.append(f"{words[0]} plant")
    
    headers = {"User-Agent": "AgriBot AIBot/1.0 (https://agitech.tn)"}
    
    for sq in search_queries:
        params = {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": sq,
            "gsrnamespace": 6,
            "prop": "imageinfo",
            "iiprop": "url",
            "gsrlimit": 5
        }
        try:
            response = requests.get(url, params=params, headers=headers, timeout=5)
            if response.status_code == 200:
                data = response.json()
                pages = data.get("query", {}).get("pages", {})
                
                # On trie les pages par ID pour une certaine stabilité
                for page_id in sorted(pages.keys()):
                    info_list = pages[page_id].get("imageinfo", [])
                    if not info_list:
                        continue
                        
                    image_info = info_list[0]
                    img_url = image_info.get("url")
                    
                    if not img_url:
                        continue
                        
                    # Filtrage par extension
                    if not img_url.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                        continue
                    
                    # Filtrage par mots-clés négatifs pour éviter les portraits d'humains célèbres
                    # si on cherche des plantes
                    file_name = img_url.lower()
                    
                    # Si on cherche un olivier, on ne veut pas Laurence Olivier
                    if "olivier" in q_low and "laurence" in file_name:
                        continue
                        
                    return img_url
        except Exception:
            continue
    return None


def finaliser_reponse(content, lang='fr'):
    """Post-traite la réponse pour intégrer les vidéos et images réelles."""
    # 1. Traitement des vidéos [VIDEO_SEARCH:...]
    pattern_video = r'\[VIDEO_SEARCH:(.*?)\]'
    matches_video = re.findall(pattern_video, content)
    
    for query in matches_video:
        video_id = chercher_video_youtube(query)
        if video_id:
            replacement = f"[VIDEO:{video_id}:{lang}]"
        else:
            replacement = ""
        content = content.replace(f"[VIDEO_SEARCH:{query}]", replacement)

    # 2. Traitement des images réelles [IMAGE_SEARCH:...]
    pattern_image = r'\[IMAGE_SEARCH:(.*?)\]'
    matches_image = re.findall(pattern_image, content)
    
    for query in matches_image:
        image_url = chercher_image_wikimedia(query)
        if image_url:
            # On remplace par une syntaxe Markdown standard car le frontend gère déjà les images Markdown
            replacement = f"![{query}]({image_url})"
        else:
            # Fallback sur Pollinations si Wikimedia ne trouve rien
            prompt_en = query.replace(" ", "+")
            replacement = f"![{query}](https://image.pollinations.ai/prompt/{prompt_en}?width=1024&height=768&nologo=true&model=turbo)"
        content = content.replace(f"[IMAGE_SEARCH:{query}]", replacement)
    
    return content


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


def build_prompt(question, localisation, contexte_meteo, has_image=False, has_video=False, context_rag=None):
    # Détection de la langue pour forcer l'instruction (Alphabet Arabe entre U+0600 et U+06FF)
    is_arabic = any(0x0600 <= ord(c) <= 0x06FF for c in question)
    lang_instruction = "RÉPONDS EXCLUSIVEMENT EN FRANÇAIS (ALPHABET LATIN)."
    if is_arabic:
        lang_instruction = "RÉPONDS EXCLUSIVEMENT EN ARABE/DARIJA (ALPHABET ARABE)."

    image_instruction = ""
    if has_image:
        image_instruction = "L'utilisateur a envoyé une photo. Identifie précisément la plante, la maladie ou l'insecte visible. "
    
    if has_video:
        image_instruction = "L'utilisateur a envoyé une vidéo. Analyse le contenu de la vidéo, identifie les plantes, les symptômes de maladies ou les conditions du champ visibles dans la vidéo. "

    rag_section = ""
    if context_rag:
        rag_section = f"═══ DONNÉES DE RÉFÉRENCE (RAG) ═══\nUtilise ces informations réelles extraites de notre base de données pour étayer ta réponse :\n{context_rag}\n"

    return f"""📍 Localisation : {localisation}
🌤 Météo : {contexte_meteo}

{rag_section}
{image_instruction}
❓ Question de l'utilisateur : {question}

⚠️ CONSIGNE IMPÉRATIVE : {lang_instruction}
Réponds maintenant en suivant strictement les règles de structure et de style définies dans ton système."""


def _preparer_donnees_requete(question, localisation, contexte_meteo, image_b64=None, video_b64=None, history=None, model=None):
    """
    Centralise la préparation des données pour l'appel à OpenRouter.
    Permet de spécifier le modèle pour le fallback.
    """
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None, None, None, "Désolé, la clé API Gemini n'est pas configurée."

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/Agitech",
        "X-Title": "Agitech Assistant"
    }

    # Utilisation du RAG optimisé
    contexte_rag = ""
    try:
        has_media = bool(image_b64 or video_b64)
        contexte_rag = get_rag().get_ready_context(question, has_media=has_media)
    except Exception as e:
        print(f"RAG Error: {e}")
    
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    # Ajout de l'historique s'il existe
    if history:
        for msg in history:
            role = "user" if msg['sender'] == 'user' else "assistant"
            messages.append({"role": role, "content": msg['text']})

    content = []
    if image_b64 or video_b64:
        content.append({
            "type": "text",
            "text": build_prompt(question, localisation, contexte_meteo, has_image=bool(image_b64), has_video=bool(video_b64), context_rag=contexte_rag)
        })
        if image_b64:
            # Détection basique du type mime si possible, sinon jpeg par défaut
            mime = "image/jpeg"
            if image_b64.startswith('iVBORw0KGgo'): mime = "image/png"
            elif image_b64.startswith('R0lGODdh'): mime = "image/gif"
            
            content.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:{mime};base64,{image_b64}"
                }
            })
        if video_b64:
            content.append({
                "type": "image_url", 
                "image_url": {
                    "url": f"data:video/mp4;base64,{video_b64}"
                }
            })
    else:
        content = build_prompt(question, localisation, contexte_meteo, context_rag=contexte_rag)

    messages.append({"role": "user", "content": content})

    # Modèle par défaut si non spécifié
    target_model = model if model else "google/gemini-2.0-flash-001"

    payload = {
        "model": target_model,
        "messages": messages,
        "temperature": 0.7,
        "top_p": 0.9,
    }
    
    return url, headers, payload, None


def demander_a_gemini(question, localisation, contexte_meteo, image_b64=None, video_b64=None, history=None):
    models_to_try = [
        "google/gemini-2.0-flash-001", 
        "google/gemini-flash-1.5", 
        "google/gemini-pro-1.5"
    ]
    
    for i, model_name in enumerate(models_to_try):
        url, headers, payload, error = _preparer_donnees_requete(
            question, localisation, contexte_meteo, image_b64, video_b64, history=history, model=model_name
        )
        if error:
            return error

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=45)
            if response.status_code == 200:
                raw_content = response.json()['choices'][0]['message']['content']
                lang = 'ar' if any(0x0600 <= ord(c) <= 0x06FF for c in raw_content[:100]) else 'fr'
                return finaliser_reponse(raw_content, lang)
            elif response.status_code == 429:
                if i < len(models_to_try) - 1:
                    print(f"429 sur {model_name}, tentative avec le modèle suivant...")
                    time.sleep(2) # Petit délai avant le retry
                    continue
                return "Désolé, la limite de requêtes d'OpenRouter est atteinte. Réessayez dans quelques minutes."
            elif response.status_code == 401:
                return "Erreur d'authentification : la clé API OpenRouter est invalide."
            else:
                if i < len(models_to_try) - 1: continue # On essaie le suivant pour toute erreur 5xx ou autre
                return f"Erreur de l'API OpenRouter (Code {response.status_code})."
        except Exception as e:
            if i < len(models_to_try) - 1: continue
            return f"Erreur de communication avec l'IA : {str(e)}"
    
    return "Une erreur inattendue est survenue lors de la communication avec l'IA."


def demander_a_gemini_stream(question, localisation, contexte_meteo, image_b64=None, video_b64=None, history=None):
    """
    Générateur qui yield des chunks de texte depuis l'API OpenRouter en mode stream.
    Supporte également le fallback de modèle en cas de 429 au démarrage.
    """
    models_to_try = [
        "google/gemini-2.0-flash-001", 
        "google/gemini-flash-1.5", 
        "google/gemini-pro-1.5"
    ]
    
    for i, model_name in enumerate(models_to_try):
        url, headers, payload, error = _preparer_donnees_requete(
            question, localisation, contexte_meteo, image_b64, video_b64, history=history, model=model_name
        )
        if error:
            yield error
            return

        payload["stream"] = True

        try:
            response = requests.post(url, headers=headers, json=payload, stream=True, timeout=60)
            
            if response.status_code == 429 and i < len(models_to_try) - 1:
                print(f"429 (Stream) sur {model_name}, basculement...")
                time.sleep(2)
                continue
            
            if response.status_code != 200:
                if i < len(models_to_try) - 1: continue
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
            return # Sortie si succès du stream
            
        except Exception as e:
            if i < len(models_to_try) - 1: continue
            yield f"Erreur de communication avec l'IA : {str(e)}"
            return
