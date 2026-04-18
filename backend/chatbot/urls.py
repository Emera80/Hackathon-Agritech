from django.urls import path
from . import views

urlpatterns = [
    path('api/chat/', views.poser_question, name='api_chat'),
    path('api/chat/stream/', views.chat_stream, name='chat_stream'),
    path('api/tts/', views.tts_synthesize, name='api_tts'),
    path('api/sessions/', views.lister_sessions, name='lister_sessions'),
    path('api/sessions/<int:session_id>/', views.recuperer_session, name='recuperer_session'),
]