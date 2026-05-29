from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
# --- Routes d'Authentification ---
    path('api/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', views.register_user, name='register_user'),

    
    path('api/chat/', views.poser_question, name='api_chat'),
    path('api/chat/stream/', views.chat_stream, name='chat_stream'),
    path('api/tts/', views.tts_synthesize, name='api_tts'),
    path('api/sessions/', views.lister_sessions, name='lister_sessions'),
    path('api/sessions/<int:session_id>/', views.recuperer_session, name='recuperer_session'),
    path('api/video/search/', views.rechercher_video, name='video_search'),
    path('api/image/search/', views.rechercher_image, name='image_search'),
]