from django.shortcuts import render
from django.http import HttpResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .services import demander_a_gemini, demander_a_gemini_stream, get_meteo
from .models import ChatSession, ChatMessage
import io
import json as json_module
from gtts import gTTS

LANG_MAP = {
    'arabic': 'ar',
    'french': 'fr',
}

@api_view(['POST'])
def poser_question(request):
    question = request.data.get('question')
    localisation = request.data.get('localisation', 'Tunis')
    session_id = request.data.get('session_id')

    if not question:
        return Response({"erreur": "Veuillez poser une question."}, status=400)

    if session_id:
        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            session = ChatSession.objects.create(title=question[:50])
    else:
        session = ChatSession.objects.create(title=question[:50])

    ChatMessage.objects.create(session=session, sender='user', text=question)

    contexte_meteo = get_meteo(localisation)
    reponse_ia = demander_a_gemini(question, localisation, contexte_meteo)

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
        buf = io.BytesIO()
        tts.write_to_fp(buf)
        buf.seek(0)
        return HttpResponse(buf.read(), content_type='audio/mpeg')
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
            
            image_b64 = None
            if image_file:
                import base64
                image_b64 = base64.b64encode(image_file.read()).decode('utf-8')
        else:
            body = json_module.loads(request.body)
            question = body.get('question', '').strip()
            localisation = body.get('localisation', 'Tunis')
            session_id = body.get('session_id')
            image_b64 = body.get('image_b64')
    except (json_module.JSONDecodeError, UnicodeDecodeError, Exception):
        return HttpResponse(status=400)

    if not question and not image_b64:
        return HttpResponse(status=400)
    
    # Si pas de question mais une image, on met un texte par défaut
    if not question and image_b64:
        question = "Analyse cette image de plante."

    if session_id:
        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            session = ChatSession.objects.create(title=question[:50])
    else:
        session = ChatSession.objects.create(title=question[:50])

    ChatMessage.objects.create(session=session, sender='user', text=question)
    contexte_meteo = get_meteo(localisation)

    def event_stream():
        full_text = []
        meta = json_module.dumps({"type": "meta", "session_id": session.id})
        yield f"data: {meta}\n\n"

        try:
            for chunk in demander_a_gemini_stream(question, localisation, contexte_meteo, image_b64=image_b64):
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
def lister_sessions(request):
    sessions = ChatSession.objects.all().order_by('-created_at')
    data = [{"id": s.id, "title": s.title, "created_at": s.created_at} for s in sessions]
    return Response(data)

@api_view(['GET'])
def recuperer_session(request, session_id):
    try:
        session = ChatSession.objects.get(id=session_id)
        messages = session.messages.all().order_by('created_at')
        messages_data = [{"sender": m.sender, "text": m.text, "created_at": m.created_at} for m in messages]
        return Response({
            "id": session.id,
            "title": session.title,
            "messages": messages_data
        })
    except ChatSession.DoesNotExist:
        return Response({"erreur": "Session non trouvée."}, status=404)
