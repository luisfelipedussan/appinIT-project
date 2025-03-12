from django.db import models

# Create your models here.

class Player(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Game(models.Model):
    player1 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='games_as_player1')
    player2 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='games_as_player2')
    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)
    winner = models.ForeignKey(Player, on_delete=models.CASCADE, null=True, blank=True, related_name='games_won')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def update_score(self, winner):
        if winner == self.player1:
            self.player1_score += 1
        elif winner == self.player2:
            self.player2_score += 1
        self.save()

class Round(models.Model):
    ROCK = 'ROCK'
    PAPER = 'PAPER'
    SCISSORS = 'SCISSORS'
    
    MOVES = [
        (ROCK, 'Piedra'),
        (PAPER, 'Papel'),
        (SCISSORS, 'Tijera'),
    ]
    
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='rounds')
    player1_move = models.CharField(max_length=10, choices=MOVES, null=True, blank=True)
    player2_move = models.CharField(max_length=10, choices=MOVES, null=True, blank=True)
    winner = models.ForeignKey(Player, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def determine_winner(self):
        if self.player1_move == self.player2_move:
            return None
            
        if (
            (self.player1_move == self.PAPER and self.player2_move == self.ROCK) or
            (self.player1_move == self.ROCK and self.player2_move == self.SCISSORS) or
            (self.player1_move == self.SCISSORS and self.player2_move == self.PAPER)
        ):
            self.winner = self.game.player1
        else:
            self.winner = self.game.player2
            
        self.save()
        return self.winner
