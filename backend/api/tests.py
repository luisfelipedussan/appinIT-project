from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Player, Game, Round

class GameTests(APITestCase):
    def setUp(self):
        """
        Configuración inicial para cada test
        """
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
        
    def test_invalid_game_creation(self):
        """
        Prueba la creación de juego con datos inválidos
        """
        # Sin jugadores
        response = self.client.post('/api/create-game/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Con un solo jugador
        data = {"player1_name": "Jugador 1"}
        response = self.client.post('/api/create-game/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_game_flow(self):
        """
        Prueba el flujo completo de un juego
        """
        # Crear juego
        game_data = {
            "player1_name": "Jugador 1",
            "player2_name": "Jugador 2"
        }
        game_response = self.client.post('/api/create-game/', game_data, format='json')
        game_id = game_response.data['id']
        player1_id = game_response.data['player1']['id']
        player2_id = game_response.data['player2']['id']
        
        # Jugador 1 intenta hacer movimiento válido
        move_data = {
            "player_id": player1_id,
            "movement": "ROCK"
        }
        response = self.client.post(f'/api/games/{game_id}/make_move/', move_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Jugador 1 intenta hacer otro movimiento (debe fallar)
        response = self.client.post(f'/api/games/{game_id}/make_move/', move_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Jugador 2 hace movimiento
        move_data = {
            "player_id": player2_id,
            "movement": "SCISSORS"
        }
        response = self.client.post(f'/api/games/{game_id}/make_move/', move_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verificar resultado de la ronda
        self.assertEqual(response.data['player1_score'], 1)  # Piedra gana a Tijera

    def test_invalid_moves(self):
        """
        Prueba movimientos inválidos
        """
        # Crear juego
        game_data = {
            "player1_name": "Jugador 1",
            "player2_name": "Jugador 2"
        }
        game_response = self.client.post('/api/create-game/', game_data, format='json')
        game_id = game_response.data['id']
        player1_id = game_response.data['player1']['id']
        
        # Movimiento inválido
        move_data = {
            "player_id": player1_id,
            "movement": "INVALID"
        }
        response = self.client.post(f'/api/games/{game_id}/make_move/', move_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_game_completion(self):
        """
        Prueba un juego completo hasta que haya un ganador
        """
        # Crear juego
        game_data = {
            "player1_name": "Jugador 1",
            "player2_name": "Jugador 2"
        }
        game_response = self.client.post('/api/create-game/', game_data, format='json')
        game_id = game_response.data['id']
        player1_id = game_response.data['player1']['id']
        player2_id = game_response.data['player2']['id']
        
        # Simular 3 rondas donde jugador 1 gana
        for _ in range(3):
            # Jugador 1 juega ROCK
            self.client.post(f'/api/games/{game_id}/make_move/', {
                "player_id": player1_id,
                "movement": "ROCK"
            }, format='json')
            
            # Jugador 2 juega SCISSORS
            response = self.client.post(f'/api/games/{game_id}/make_move/', {
                "player_id": player2_id,
                "movement": "SCISSORS"
            }, format='json')
        
        # Verificar que el juego terminó y jugador 1 ganó
        self.assertFalse(response.data['is_active'])
        self.assertEqual(response.data['player1_score'], 3)
        self.assertEqual(response.data['winner']['id'], player1_id)

    def test_restart_game(self):
        """
        Prueba reiniciar un juego
        """
        # Crear juego inicial
        game_data = {
            "player1_name": "Jugador 1",
            "player2_name": "Jugador 2"
        }
        game_response = self.client.post('/api/create-game/', game_data, format='json')
        game_id = game_response.data['id']
        
        # Reiniciar juego
        response = self.client.post(f'/api/games/{game_id}/restart_game/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_active'])
        self.assertEqual(response.data['player1_score'], 0)
        self.assertEqual(response.data['player2_score'], 0)

    def test_turn_order(self):
        """
        Prueba que los jugadores deben jugar en orden correcto
        """
        # Crear juego
        game_data = {
            "player1_name": "Jugador 1",
            "player2_name": "Jugador 2"
        }
        game_response = self.client.post('/api/create-game/', game_data, format='json')
        game_id = game_response.data['id']
        player1_id = game_response.data['player1']['id']
        player2_id = game_response.data['player2']['id']
        
        # Jugador 2 intenta jugar primero (debe fallar)
        move_data = {
            "player_id": player2_id,
            "movement": "ROCK"
        }
        response = self.client.post(f'/api/games/{game_id}/make_move/', move_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Jugador 1 juega (debe funcionar)
        move_data = {
            "player_id": player1_id,
            "movement": "ROCK"
        }
        response = self.client.post(f'/api/games/{game_id}/make_move/', move_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Jugador 1 intenta jugar de nuevo (debe fallar)
        response = self.client.post(f'/api/games/{game_id}/make_move/', move_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Jugador 2 juega (debe funcionar)
        move_data = {
            "player_id": player2_id,
            "movement": "PAPER"
        }
        response = self.client.post(f'/api/games/{game_id}/make_move/', move_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
