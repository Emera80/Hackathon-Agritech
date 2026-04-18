from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .services import demander_a_gemini, get_meteo
from .models import ChatSession, ChatMessage

@api_view(['POST'])
def poser_question(request):
    question = request.data.get('question')
    localisation = request.data.get('localisation', 'Tunis')
    session_id = request.data.get('session_id')

    if not question:
        return Response({"erreur": "Veuillez poser une question."}, status=400)

    # Récupérer ou créer la session
    if session_id:
        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            session = ChatSession.objects.create(title=question[:50])
    else:
        session = ChatSession.objects.create(title=question[:50])

    # Sauvegarder le message de l'utilisateur
    ChatMessage.objects.create(session=session, sender='user', text=question)

    # 1. On interroge l'API météo
    contexte_meteo = get_meteo(localisation)

    # 2. On envoie le tout à l'API Gemini
    reponse_ia = demander_a_gemini(question, localisation, contexte_meteo)

    # Sauvegarder la réponse du bot
    ChatMessage.objects.create(session=session, sender='bot', text=reponse_ia)

    return Response({
        "session_id": session.id,
        "question": question,
        "localisation": localisation,
        "meteo_utilisee": contexte_meteo,
        "reponse": reponse_ia
    })

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