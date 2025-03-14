from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from .models import Player, Game, Round
from .serializers import PlayerSerializer, GameSerializer, RoundSerializer
import logging
from rest_framework.exceptions import ValidationError

# Configuración del logger para el módulo
logger = logging.getLogger(__name__)

# ViewSet para manejar las operaciones CRUD de jugadores
class PlayerViewSet(viewsets.ModelViewSet):
    queryset = Player.objects.all()
    serializer_class = PlayerSerializer

# ViewSet para manejar las operaciones relacionadas con los juegos
class GameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.all()
    serializer_class = GameSerializer
    
    @action(detail=True, methods=['post'])
    def make_move(self, request, pk=None):
        """
        Endpoint para procesar un movimiento de un jugador en una ronda
        
        Args:
            request: Objeto Request con los datos del movimiento
            pk: ID del juego
            
        Returns:
            Response: Estado actualizado del juego
            
        Raises:
            ValidationError: Si el movimiento es inválido
            Game.DoesNotExist: Si el juego no existe
        """
        try:
            # Obtener el juego actual
            game = self.get_object()
            player_id = request.data.get('player_id')
            movement = request.data.get('movement')
            
            # Validar el movimiento
            if not movement in [Round.ROCK, Round.PAPER, Round.SCISSORS]:
                logger.error(f"Movimiento inválido: {movement}")
                raise ValidationError("Movimiento inválido. Debe ser ROCK, PAPER o SCISSORS")
            
            # Validar que se proporcionó el ID del jugador
            if not player_id:
                logger.error("ID de jugador no proporcionado")
                raise ValidationError("Se requiere el ID del jugador")
            
            # Verificar si el juego sigue activo
            if not game.is_active:
                return Response(
                    {"error": "El juego ya ha terminado"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Obtener la última ronda del juego
            current_round = game.rounds.order_by('-created_at').first()
            
            # Crear una nueva ronda si:
            # - No hay rondas
            # - La última ronda está completa (tiene ambos movimientos)
            # - La última ronda tiene un ganador
            if not current_round or \
               (current_round.player1_move and current_round.player2_move) or \
               current_round.winner:
                current_round = Round.objects.create(game=game)
                logger.info(f"Nueva ronda creada: {current_round.id}")
            
            # Validar el orden de los turnos
            if current_round.player1_move is None:
                # Si es el primer movimiento de la ronda, debe ser el jugador 1
                if player_id != game.player1.id:
                    return Response(
                        {"error": "Es el turno del Jugador 1"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif current_round.player2_move is None:
                # Si ya hay un movimiento del jugador 1, debe ser el jugador 2
                if player_id != game.player2.id:
                    return Response(
                        {"error": "Es el turno del Jugador 2"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                return Response(
                    {"error": "Esta ronda ya está completa"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Registrar el movimiento del jugador correspondiente
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
                    
                    # Verificar si hay un ganador del juego (3 victorias)
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
        """
        Endpoint para reiniciar un juego existente
        
        Args:
            request: Objeto Request
            pk: ID del juego a reiniciar
            
        Returns:
            Response: Datos del nuevo juego creado
        """
        try:
            old_game = self.get_object()
            
            # Asegurarnos de que el juego anterior quede inactivo
            if old_game.is_active:
                old_game.is_active = False
                old_game.save()
            
            # Crear nuevo juego con los mismos jugadores
            new_game = Game.objects.create(
                player1=old_game.player1,
                player2=old_game.player2,
                is_active=True
            )
            
            # Crear la primera ronda del nuevo juego
            Round.objects.create(game=new_game)
            
            # Obtener el juego actualizado con la nueva ronda
            new_game.refresh_from_db()
            
            logger.info(f"Juego {old_game.id} reiniciado como {new_game.id}")
            return Response(GameSerializer(new_game).data)
            
        except Exception as e:
            logger.error(f"Error al reiniciar juego: {str(e)}")
            return Response(
                {"error": "No se pudo reiniciar el juego"},
                status=status.HTTP_400_BAD_REQUEST
            )

@api_view(['POST'])
def create_game(request):
    """
    Endpoint para crear un nuevo juego
    
    Args:
        request: Objeto Request con los nombres de los jugadores
        
    Returns:
        Response: Datos del juego creado
    """
    player1_name = request.data.get('player1_name')
    player2_name = request.data.get('player2_name')
    
    # Validar que se proporcionaron ambos nombres
    if not player1_name or not player2_name:
        return Response(
            {"error": "Se requieren los nombres de ambos jugadores"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Crear los jugadores
    player1 = Player.objects.create(name=player1_name)
    player2 = Player.objects.create(name=player2_name)
    
    # Crear el juego
    game = Game.objects.create(
        player1=player1,
        player2=player2,
        is_active=True
    )
    
    return Response(GameSerializer(game).data)
