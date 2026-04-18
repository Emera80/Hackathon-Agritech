from django.urls import path
from . import views

urlpatterns = [
    path('api/chat/', views.poser_question, name='api_chat'),
    path('api/sessions/', views.lister_sessions, name='lister_sessions'),
    path('api/sessions/<int:session_id>/', views.recuperer_session, name='recuperer_session'),
]