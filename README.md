# GAME

## Instalación y Ejecución

### Requisitos Previos
- Python 3.10 o superior
- Node.js (v18 o superior)
- PostgreSQL
- Angular CLI (`npm install -g @angular/cli`)

### Configuración Inicial

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd appinIT-project
```

2. **Configurar el Backend (Django)**
```bash
# Crear y activar entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
cd backend
pip install -r requirements.txt

# Configurar la base de datos
python manage.py makemigrations
python manage.py migrate

# Iniciar el servidor de desarrollo
python manage.py runserver

# El backend estará disponible en http://localhost:8000
```

3. **Configurar el Frontend (Angular)**
```bash
# Instalar dependencias
cd frontend
npm install

# Iniciar el servidor de desarrollo
ng serve

# El frontend estará disponible en http://localhost:4200
```

### Uso del Proyecto

1. **Iniciar el Backend**
```bash
# Activar el entorno virtual
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Desde la carpeta backend
cd backend
python manage.py runserver
```

2. **Iniciar el Frontend**
```bash
# En otra terminal, desde la carpeta frontend
cd frontend
ng serve
```

3. **Acceder a la Aplicación**
- Abrir el navegador en `http://localhost:4200`
- La API estará disponible en `http://localhost:8000`

### Comandos Útiles

**Backend (Django)**
```bash
# Crear superusuario
python manage.py createsuperuser

# Verificar migraciones pendientes
python manage.py showmigrations

# Ejecutar tests
python manage.py test

# Shell de Django
python manage.py shell
```

**Frontend (Angular)**
```bash
# Ejecutar tests
ng test

# Construir para producción
ng build --configuration production

# Verificar errores de lint
ng lint
```

### Estructura del Proyecto
```
appinIT-project/
├── backend/              # Proyecto Django
│   ├── api/             # Aplicación principal
│   ├── manage.py        # Script de gestión de Django
│   └── requirements.txt # Dependencias Python
│
└── frontend/            # Proyecto Angular
    ├── src/            # Código fuente
    └── package.json    # Dependencias Node.js
```

El flujo de datos es el siguiente:

## 1. Cuando se crea un nuevo juego:
- Se registran los dos jugadores con sus nombres
- Se crea un nuevo juego con puntuaciones iniciales en 0
- El juego se marca como activo (is_active: true)

## 2. Durante el juego:
- Se van registrando las rondas con los movimientos de cada jugador
- Cada ronda guarda los movimientos de ambos jugadores y determina un ganador
- Se actualizan las puntuaciones de los jugadores

## 3. Al finalizar el juego:
- Se marca el juego como inactivo (is_active: false)
- Se registra el ganador final
- Se mantiene el historial completo de todas las rondas jugadas

## Consultas SQL Útiles

### Ver ganadores de ronda
```sql
SELECT r.id, r.player1_move, r.player2_move, p.name as winner_name 
FROM api_round r 
LEFT JOIN api_player p ON r.winner_id = p.id;
```

### Ver ganadores de juegos 
```sql
SELECT g.id, p1.name as player1_name, p2.name as player2_name, 
       g.player1_score, g.player2_score, w.name as winner_name 
FROM api_game g 
JOIN api_player p1 ON g.player1_id = p1.id 
JOIN api_player p2 ON g.player2_id = p2.id 
LEFT JOIN api_player w ON g.winner_id = w.id;
```

## Flujo de Interacción Detallado

### 1. Interacción del Usuario → Frontend
```typescript
// game-board.component.ts
makeMove(move: string) {
    if (!this.game || !this.canMakeMove) return;

    const playerId = this.isPlayer1Turn ? this.game.player1.id : this.game.player2.id;

    // Llamada al servicio
    this.gameService.makeMove(this.gameId, playerId, move).subscribe({
      next: (updatedGame) => {
        this.game = updatedGame;
        // Actualizar la UI
      },
      error: (error) => {
        console.error('Error al realizar movimiento:', error);
        alert(error.error.error);
      }
    });
}
```

### 2. Frontend → Backend (HTTP Request)
```typescript
// game.service.ts
makeMove(gameId: number, playerId: number, movement: string): Observable<Game> {
    return this.http.post<Game>(
        `${this.apiUrl}/games/${gameId}/make_move/`,
        { player_id: playerId, movement: movement }
    );
}
```

### 3. Backend → Validación y Procesamiento
```python
# views.py
@action(detail=True, methods=['post'])
def make_move(self, request, pk=None):
    try:
        # 1. Obtener y validar datos
        game = self.get_object()
        player_id = request.data.get('player_id')
        movement = request.data.get('movement')

        # 2. Validaciones
        if not movement in [Round.ROCK, PAPER, SCISSORS]:
            raise ValidationError("Movimiento inválido")
```

### 4. Backend → Base de Datos (Lectura)
```python
# 3. Obtener estado actual
current_round = game.rounds.order_by('-created_at').first()

# 4. Validar turno
if current_round.player1_move is None:
    if player_id != game.player1.id:
        return Response({"error": "Es el turno del Jugador 1"})
```

### 5. Backend → Base de Datos (Escritura)
```python
# 5. Registrar movimiento
if player_id == game.player1.id:
    current_round.player1_move = movement
else:
    current_round.player2_move = movement

current_round.save()  # Primera escritura a DB

# 6. Procesar resultado si la ronda está completa
if current_round.player1_move and current_round.player2_move:
    winner = current_round.determine_winner()
    if winner:
        game.update_score(winner)  # Segunda escritura a DB
```

### 6. Backend → Frontend (HTTP Response)
```python
# 7. Devolver estado actualizado
return Response(GameSerializer(game).data)
```

### 7. Frontend → Actualización de UI
```typescript
// 8. Actualizar estado del juego en el frontend
next: (updatedGame) => {
    this.game = updatedGame;

    const currentRound = updatedGame.rounds[updatedGame.rounds.length - 1];

    // 9. Actualizar turnos
    if (currentRound.player1_move && currentRound.player2_move) {
        this.isPlayer1Turn = true;
    } else if (currentRound.player1_move === null) {
        this.isPlayer1Turn = true;
    } else {
        this.isPlayer1Turn = false;
    }
}
```

### 8. Actualización Continua (Polling)
```typescript
// 10. Polling cada segundo para mantener el estado actualizado
private updateGameState() {
    this.updateSubscription = interval(1000).pipe(
        switchMap(() => this.gameService.getGameState(this.gameId))
    ).subscribe({
        next: (game) => {
            this.game = game;
            this.updateGameStatus();
        }
    });
}
```

## Estructura de la Base de Datos

### Tablas Principales
```sql
-- Tablas principales:
api_player (id, name, created_at)
api_game (id, player1_id, player2_id, player1_score, player2_score, winner_id, is_active)
api_round (id, game_id, player1_move, player2_move, winner_id, created_at)

-- Ejemplo de consultas que ocurren:
-- 1. Obtener juego actual
SELECT * FROM api_game WHERE id = ?;

-- 2. Obtener última ronda
SELECT * FROM api_round
WHERE game_id = ?
ORDER BY created_at DESC
LIMIT 1;

-- 3. Actualizar movimiento
UPDATE api_round
SET player1_move = ?
WHERE id = ?;

-- 4. Actualizar puntaje
UPDATE api_game
SET player1_score = player1_score + 1
WHERE id = ?;
```

## Modelos de Django

### 1. Player (Jugador)
```python
class Player(models.Model):
    name = models.CharField(max_length=100)        # Nombre del jugador
    created_at = models.DateTimeField(auto_now_add=True)  # Fecha de creación
```

### 2. Game (Juego)
```python
class Game(models.Model):
    player1 = models.ForeignKey(Player, ...)      # Referencia al Jugador 1
    player2 = models.ForeignKey(Player, ...)      # Referencia al Jugador 2
    player1_score = models.IntegerField(default=0) # Puntaje Jugador 1
    player2_score = models.IntegerField(default=0) # Puntaje Jugador 2
    winner = models.ForeignKey(Player, ...)       # Ganador del juego
    is_active = models.BooleanField(default=True) # Estado del juego
    created_at = models.DateTimeField(auto_now_add=True)  # Fecha de creación
```

### 3. Round (Ronda)
```python
class Round(models.Model):
    game = models.ForeignKey(Game, ...)          # Referencia al Juego
    player1_move = models.CharField(...)         # Movimiento del Jugador 1
    player2_move = models.CharField(...)         # Movimiento del Jugador 2
    winner = models.ForeignKey(Player, ...)      # Ganador de la ronda
    created_at = models.DateTimeField(auto_now_add=True)  # Fecha de creación
```

## Relaciones entre Tablas
- Un `Player` puede participar en múltiples `Game`s (como player1 o player2)
- Un `Game` tiene exactamente dos `Player`s
- Un `Game` puede tener múltiples `Round`s
- Cada `Round` pertenece a un único `Game`
- Un `Player` puede ser ganador de múltiples `Game`s y `Round`s

## Movimientos Posibles
```python
MOVES = [
    ('ROCK', 'Piedra'),
    ('PAPER', 'Papel'),
    ('SCISSORS', 'Tijera'),
]
```

## Métodos Principales
1. `Game.update_score(winner)`: Actualiza el puntaje cuando hay un ganador
2. `Round.determine_winner()`: Determina el ganador de una ronda basado en los movimientos


