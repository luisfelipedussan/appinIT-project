from django.contrib import admin
from .models import Player, Game, Round

@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_at')
    search_fields = ('name',)

@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ('id', 'player1', 'player2', 'player1_score', 'player2_score', 'winner', 'is_active', 'created_at')
    list_filter = ('is_active',)

@admin.register(Round)
class RoundAdmin(admin.ModelAdmin):
    list_display = ('id', 'game', 'player1_move', 'player2_move', 'winner', 'created_at')
    list_filter = ('game',)
