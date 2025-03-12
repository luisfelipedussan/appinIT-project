from rest_framework import serializers
from .models import Player, Game, Round

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ['id', 'name', 'created_at']

class RoundSerializer(serializers.ModelSerializer):
    result = serializers.SerializerMethodField()

    class Meta:
        model = Round
        fields = ['id', 'player1_move', 'player2_move', 'winner', 'created_at', 'result']
        
    def get_result(self, obj):
        if not obj.player1_move or not obj.player2_move:
            return "Ronda en progreso"
        if not obj.winner:
            return "Empate"
        return f"Ganador: {obj.winner.name}"

class GameSerializer(serializers.ModelSerializer):
    player1 = PlayerSerializer()
    player2 = PlayerSerializer()
    winner = PlayerSerializer()
    rounds = RoundSerializer(many=True, read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Game
        fields = [
            'id', 'player1', 'player2', 'player1_score', 'player2_score',
            'winner', 'is_active', 'created_at', 'rounds', 'status'
        ] 

    def get_status(self, obj):
        if not obj.is_active:
            return f"Juego terminado. Ganador: {obj.winner.name}"
        return "Juego en progreso" 