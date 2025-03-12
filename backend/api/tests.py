from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Player, Game, Round

class GameTests(APITestCase):
    def setUp(self):
        self.player1_data = {"name": "Jugador 1"}
        self.player2_data = {"name": "Jugador 2"}
        
    def test_create_game(self):
        """
        Asegura que podemos crear un nuevo juego
        """
        data = {
            "player1_name": "Jugador 1",
            "player2_name": "Jugador 2"
        }
        response = self.client.post('/api/create-game/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Game.objects.count(), 1)
        self.assertEqual(Player.objects.count(), 2)

    def test_make_move(self):
        """
        Asegura que podemos hacer movimientos válidos
        """
        # Crear juego
        game_data = {
            "player1_name": "Jugador 1",
            "player2_name": "Jugador 2"
        }
        game_response = self.client.post('/api/create-game/', game_data, format='json')
        game_id = game_response.data['id']
        player1_id = game_response.data['player1']['id']
        
        # Hacer movimiento
        move_data = {
            "player_id": player1_id,
            "movement": "ROCK"
        }
        response = self.client.post(f'/api/games/{game_id}/make_move/', move_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
