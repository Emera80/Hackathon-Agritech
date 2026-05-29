from django.shortcuts import render
from django.http import HttpResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .services import (
    demander_a_gemini, demander_a_gemini_stream, get_meteo, 
    chercher_video_youtube, chercher_image_wikimedia
)
from .models import ChatSession, ChatMessage
import io
import json as json_module
from gtts import gTTS

LANG_MAP = {
    'arabic': 'ar',
    'french': 'fr',
}
#
# def _get_session_and_history(session_id, question):
#     """Récupère ou crée une session et extrait l'historique récent."""
#     if session_id:
#         try:
#             session = ChatSession.objects.get(id=session_id)
#         except ChatSession.DoesNotExist:
#             session = ChatSession.objects.create(title=question[:50])
#     else:
#         session = ChatSession.objects.create(title=question[:50])
#
#     # Récupération de l'historique (10 derniers messages)
#     history_objs = session.messages.all().order_by('-created_at')[:10]
#     history = [{"sender": msg.sender, "text": msg.text} for msg in reversed(history_objs)]
#
#     return session, history

def _get_session_and_history(session_id, question, user=None):
    if session_id:
        try:
            if user and user.is_authenticated:
                session = ChatSession.objects.get(id=session_id, user=user)
            else:
                session = ChatSession.objects.get(id=session_id, user__isnull=True)
        except ChatSession.DoesNotExist:
            session = ChatSession.objects.create(title=question[:50], user=user if user and user.is_authenticated else None)
    else:
        session = ChatSession.objects.create(title=question[:50], user=user if user and user.is_authenticated else None)

    history_objs = session.messages.all().order_by('-created_at')[:10]
    history = [{"sender": msg.sender, "text": msg.text} for msg in reversed(history_objs)]
    return session, history


@api_view(['POST'])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({"erreur": "Nom d'utilisateur et mot de passe requis."}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"erreur": "Ce compte existe déjà."}, status=400)

    user = User.objects.create(
        username=username,
        password=make_password(password)
    )
    return Response({"message": "Compte créé avec succès !"}, status=201)

@api_view(['POST'])
def poser_question(request):
    question = request.data.get('question')
    localisation = request.data.get('localisation', 'Tunis')
    session_id = request.data.get('session_id')
    image_b64 = request.data.get('image_b64')
    video_b64 = request.data.get('video_b64')

    if not question and not image_b64 and not video_b64:
        return Response({"erreur": "Veuillez poser une question ou envoyer un média."}, status=400)
    
    if not question:
        question = "Analyse ce média."
        if image_b64: question = "Analyse cette image de plante."
        elif video_b64: question = "Analyse cette vidéo de mon champ."

    # session, history = _get_session_and_history(session_id, question)
    user = request.user if request.user.is_authenticated else None
    session, history = _get_session_and_history(session_id, question, user)

    ChatMessage.objects.create(session=session, sender='user', text=question)

    contexte_meteo = get_meteo(localisation)
    reponse_ia = demander_a_gemini(question, localisation, contexte_meteo, image_b64=image_b64, video_b64=video_b64, history=history)

    ChatMessage.objects.create(session=session, sender='bot', text=reponse_ia)

    return Response({
        "session_id": session.id,
        "question": question,
        "localisation": localisation,
        "meteo_utilisee": contexte_meteo,
        "reponse": reponse_ia
    })


@csrf_exempt
@require_POST
def tts_synthesize(request):
    try:
        body = json_module.loads(request.body)
    except (json_module.JSONDecodeError, UnicodeDecodeError):
        return HttpResponse(
            json_module.dumps({"erreur": "Corps JSON invalide."}),
            content_type='application/json', status=400
        )

    text = body.get('text', '').strip()
    lang = body.get('lang', 'french')

    if not text:
        return HttpResponse(
            json_module.dumps({"erreur": "Texte manquant."}),
            content_type='application/json', status=400
        )

    gtts_lang = LANG_MAP.get(lang, 'fr')
    # tld 'com' fonctionne pour toutes les langues y compris l'arabe
    tld = 'com'

    try:
        tts = gTTS(text=text[:4000], lang=gtts_lang, tld=tld, slow=False)
        response = StreamingHttpResponse(tts.stream(), content_type='audio/mpeg')
        response['X-Accel-Buffering'] = 'no'
        return response
    except Exception as e:
        return HttpResponse(
            json_module.dumps({"erreur": str(e)}),
            content_type='application/json', status=500
        )


@csrf_exempt
@require_POST
def chat_stream(request):
    try:
        # On utilise request.POST et request.FILES si c'est du multipart
        if request.content_type.startswith('multipart/form-data'):
            question = request.POST.get('question', '').strip()
            localisation = request.POST.get('localisation', 'Tunis')
            session_id = request.POST.get('session_id')
            image_file = request.FILES.get('image')
            video_file = request.FILES.get('video')
            
            image_b64 = None
            if image_file:
                import base64
                image_b64 = base64.b64encode(image_file.read()).decode('utf-8')
            
            video_b64 = None
            if video_file:
                import base64
                video_b64 = base64.b64encode(video_file.read()).decode('utf-8')
        else:
            body = json_module.loads(request.body)
            question = body.get('question', '').strip()
            localisation = body.get('localisation', 'Tunis')
            session_id = body.get('session_id')
            image_b64 = body.get('image_b64')
            video_b64 = body.get('video_b64')
    except (json_module.JSONDecodeError, UnicodeDecodeError, Exception):
        return HttpResponse(status=400)

    if not question and not image_b64 and not video_b64:
        return HttpResponse(status=400)
    
    # Si pas de question mais un média, on met un texte par défaut
    if not question:
        question = "Analyse ce média."
        if image_b64: question = "Analyse cette image de plante."
        elif video_b64: question = "Analyse cette vidéo de mon champ ou de mes plantes."

    user = None
    try:
        auth_tuple = JWTAuthentication().authenticate(request)
        if auth_tuple:
            user = auth_tuple[0]
    except Exception:
        pass

    session, history = _get_session_and_history(session_id, question, user)

    # session, history = _get_session_and_history(session_id, question)

    ChatMessage.objects.create(session=session, sender='user', text=question)
    contexte_meteo = get_meteo(localisation)

    def event_stream():
        full_text = []
        meta = json_module.dumps({"type": "meta", "session_id": session.id})
        yield f"data: {meta}\n\n"

        try:
            for chunk in demander_a_gemini_stream(question, localisation, contexte_meteo, image_b64=image_b64, video_b64=video_b64, history=history):
                full_text.append(chunk)
                payload = json_module.dumps({"type": "chunk", "content": chunk})
                yield f"data: {payload}\n\n"
        finally:
            complete_text = ''.join(full_text)
            if complete_text:
                ChatMessage.objects.create(session=session, sender='bot', text=complete_text)
            yield 'data: {"type": "done"}\n\n'

    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    response['Access-Control-Allow-Origin'] = '*'
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lister_sessions(request):
    # L'utilisateur ne récupère que SES sessions
    sessions = ChatSession.objects.filter(user=request.user).order_by('-created_at')
    data = [{"id": s.id, "title": s.title, "created_at": s.created_at} for s in sessions]
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recuperer_session(request, session_id):
    try:
        session = ChatSession.objects.get(id=session_id, user=request.user)
        messages = session.messages.all().order_by('created_at')
        messages_data = [{"id": m.id, "sender": m.sender, "text": m.text, "created_at": m.created_at} for m in messages]
        return Response({
            "id": session.id,
            "title": session.title,
            "messages": messages_data
        })
    except ChatSession.DoesNotExist:
        return Response({"erreur": "Session non trouvée ou accès non autorisé."}, status=404)

@api_view(['GET'])
def rechercher_video(request):
    query = request.query_params.get('query')
    lang = request.query_params.get('lang', 'fr')
    if not query:
        return Response({"erreur": "Paramètre query manquant."}, status=400)
    
    video_id = chercher_video_youtube(query)
    if video_id:
        return Response({"video_id": video_id, "lang": lang})
    return Response({"erreur": "Aucune vidéo trouvée."}, status=404)

@api_view(['GET'])
def rechercher_image(request):
    query = request.query_params.get('query')
    if not query:
        return Response({"erreur": "Paramètre query manquant."}, status=400)
    
    image_url = chercher_image_wikimedia(query)
    
    # Si aucune image réelle n'est trouvée, on génère une URL de fallback Pollinations stable
    if not image_url:
        # Nettoyage de la query pour l'URL
        clean_query = query.replace(" ", "+")
        image_url = f"https://image.pollinations.ai/prompt/{clean_query}?width=1024&height=768&nologo=true&model=turbo"
    
    return Response({"image_url": image_url})
