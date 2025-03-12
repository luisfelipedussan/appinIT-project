from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlayerViewSet, GameViewSet, create_game

router = DefaultRouter()
router.register(r'players', PlayerViewSet)
router.register(r'games', GameViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('create-game/', create_game, name='create-game'),
] 