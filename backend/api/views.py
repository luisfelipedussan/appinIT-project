from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from .models import Player, Game, Round
from .serializers import PlayerSerializer, GameSerializer, RoundSerializer
import logging
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)

# Create your views here.

class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer

class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    
    @action(detail=True, methods=['post'])
    def make_move(self, request, pk=None):
        try:
            game = self.get_object()
            player_id = request.data.get('player_id')
            movement = request.data.get('movement')
            
            if not movement in [Round.ROCK, Round.PAPER, Round.SCISSORS]:
                logger.error(f"Movimiento inválido: {movement}")
                raise ValidationError("Movimiento inválido. Debe ser ROCK, PAPER o SCISSORS")
            
            if not player_id:
                logger.error("ID de jugador no proporcionado")
                raise ValidationError("Se requiere el ID del jugador")
            
            if not game.is_active:
                return Response(
                    {"error": "El juego ya ha terminado"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validar que sea el turno del jugador
            current_round = game.rounds.filter(winner=None).first()
            if not current_round:
                current_round = Round.objects.create(game=game)
                
            if current_round.player1_move and player_id == game.player1.id:
                return Response(
                    {"error": "No es tu turno"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if current_round.player2_move and player_id == game.player2.id:
                return Response(
                    {"error": "No es tu turno"},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Registrar movimiento
            if player_id == game.player1.id:
                current_round.player1_move = movement
            else:
                current_round.player2_move = movement
            
            current_round.save()
            
            # Si ambos jugadores han hecho su movimiento, determinar ganador
            if current_round.player1_move and current_round.player2_move:
                winner = current_round.determine_winner()
                if winner:
                    game.update_score(winner)
                    
                    # Verificar si hay un ganador del juego
                    if game.player1_score >= 3:
                        game.winner = game.player1
                        game.is_active = False
                    elif game.player2_score >= 3:
                        game.winner = game.player2
                        game.is_active = False
                    game.save()
            
            return Response(GameSerializer(game).data)
            
        except Game.DoesNotExist:
            logger.error(f"Juego no encontrado: {pk}")
            return Response(
                {"error": "Juego no encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValidationError as e:
            logger.error(f"Error de validación: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.critical(f"Error inesperado: {str(e)}", exc_info=True)
            return Response(
                {"error": "Error interno del servidor"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def restart_game(self, request, pk=None):
        try:
            old_game = self.get_object()
            
            # Crear nuevo juego con los mismos jugadores
            new_game = Game.objects.create(
                player1=old_game.player1,
                player2=old_game.player2,
                is_active=True
            )
            
            return Response(GameSerializer(new_game).data)
            
        except Exception as e:
            logger.error(f"Error al reiniciar juego: {str(e)}")
            return Response(
                {"error": "No se pudo reiniciar el juego"},
                status=status.HTTP_400_BAD_REQUEST
            )

@api_view(['POST'])
def create_game(request):
    player1_name = request.data.get('player1_name')
    player2_name = request.data.get('player2_name')
    
    if not player1_name or not player2_name:
        return Response(
            {"error": "Se requieren los nombres de ambos jugadores"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    player1 = Player.objects.create(name=player1_name)
    player2 = Player.objects.create(name=player2_name)
    
    game = Game.objects.create(
        player1=player1,
        player2=player2,
        is_active=True
    )
    
    return Response(GameSerializer(game).data)
