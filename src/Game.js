import React, { Component } from 'react';
import Snake from './Snake';
import Food from './Food'; // Import Food component
import './Game.css'; // Import Game CSS

const GAME_BOARD_MIN = 0;
const GAME_BOARD_MAX = 98; // Max for 2% steps

const getRandomCoordinates = () => {
  let x = Math.floor((Math.random() * (GAME_BOARD_MAX - GAME_BOARD_MIN + 1) + GAME_BOARD_MIN) / 2) * 2;
  let y = Math.floor((Math.random() * (GAME_BOARD_MAX - GAME_BOARD_MIN + 1) + GAME_BOARD_MIN) / 2) * 2;
  return [x, y];
}

class Game extends Component {
  state = {
    food: getRandomCoordinates(),
    snakeDots: [
      [0, 0],
      [2, 0] 
    ],
    direction: 'RIGHT',
    initialSpeed: 200,
    speed: 200, // Current speed, initialized with initialSpeed
    minSpeed: 50,
    gameOver: false,
    justAte: false, // To handle snake growth
    score: 0,
    foodEatenSinceLastSpeedIncrease: 0
  }

  componentDidMount() {
    this.intervalId = setInterval(this.moveSnake, this.state.speed);
    document.onkeydown = this.onKeyDown;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.speed !== this.state.speed && !this.state.gameOver) {
      clearInterval(this.intervalId);
      this.intervalId = setInterval(this.moveSnake, this.state.speed);
    }
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
    document.onkeydown = null;
  }

  moveSnake = () => {
    if (this.state.gameOver) {
      return;
    }
    let dots = [...this.state.snakeDots];
    let head = dots[dots.length - 1];

    switch (this.state.direction) {
      case 'RIGHT':
        head = [head[0] + 2, head[1]];
        break;
      case 'LEFT':
        head = [head[0] - 2, head[1]];
        break;
      case 'DOWN':
        head = [head[0], head[1] + 2];
        break;
      case 'UP':
        head = [head[0], head[1] - 2];
        break;
      default:
        break;
    }
    dots.push(head); // Add new head
    
    // For now, always remove tail. Will be modified for eating.
    // dots.shift(); 
    
    // Collision with food
    if (head[0] === this.state.food[0] && head[1] === this.state.food[1]) {
      this.setState(prevState => ({
        justAte: true,
        score: prevState.score + 1,
        foodEatenSinceLastSpeedIncrease: prevState.foodEatenSinceLastSpeedIncrease + 1
      }), () => {
        // Callback after state is updated
        if (this.state.foodEatenSinceLastSpeedIncrease >= 5) {
          const newSpeed = Math.max(this.state.speed - 30, this.state.minSpeed);
          if (newSpeed !== this.state.speed) {
            this.setState({
              speed: newSpeed,
              foodEatenSinceLastSpeedIncrease: 0
            });
            // Game loop restart will be handled in the next subtask
          } else { 
            // Speed didn't change (already at minSpeed), but threshold was met.
            // So, just reset the counter.
            this.setState({
              foodEatenSinceLastSpeedIncrease: 0
            });
          }
        }
      });
      this.repositionFood();
    } else {
      if (this.state.justAte) {
        this.setState({ justAte: false }); // Reset after one growth cycle
      } else {
        dots.shift(); // Remove tail if not just eaten
      }
    }
    
    // Collision detection
    if (this.checkIfOutOfBorders(head) || this.checkIfCollapsed(head)) {
      this.onGameOver();
      return; // Stop further execution in moveSnake if game over
    }
    
    this.setState({
      snakeDots: dots
    });
  }

  checkIfOutOfBorders = (head) => {
    return head[0] >= GAME_BOARD_MAX + 2 || head[0] < GAME_BOARD_MIN || head[1] >= GAME_BOARD_MAX + 2 || head[1] < GAME_BOARD_MIN;
  }

  checkIfCollapsed = (head) => {
    let snake = [...this.state.snakeDots];
    snake.pop(); // Remove the head itself from the body check
    for (let dot of snake) {
      if (head[0] === dot[0] && head[1] === dot[1]) {
        return true;
      }
    }
    return false;
  }

  onGameOver = () => {
    this.setState({ gameOver: true });
    clearInterval(this.intervalId);
  }

  repositionFood = () => {
    let newFood;
    do {
      newFood = getRandomCoordinates();
    } while (this.isFoodOnSnake(newFood));
    this.setState({ food: newFood });
  }

  isFoodOnSnake = (foodCoordinates) => {
    for (let dot of this.state.snakeDots) {
      if (dot[0] === foodCoordinates[0] && dot[1] === foodCoordinates[1]) {
        return true;
      }
    }
    return false;
  }

  onKeyDown = (e) => {
    e = e || window.event;
    let newDirection = this.state.direction;
    switch (e.keyCode) {
      case 38: // ArrowUp
        if (this.state.direction !== 'DOWN') newDirection = 'UP';
        break;
      case 40: // ArrowDown
        if (this.state.direction !== 'UP') newDirection = 'DOWN';
        break;
      case 37: // ArrowLeft
        if (this.state.direction !== 'RIGHT') newDirection = 'LEFT';
        break;
      case 39: // ArrowRight
        if (this.state.direction !== 'LEFT') newDirection = 'RIGHT';
        break;
      default:
        return;
    }
    this.setState({ direction: newDirection });
  }

  render() {
    return (
      <div>
        <h1>Snake Game</h1>
        <div className="score">Score: {this.state.score}</div>
        <div className="game-board">
          <Snake snakeDots={this.state.snakeDots} />
          <Food dot={this.state.food} />
          {this.state.gameOver && <div className="game-over-message">GAME OVER!</div>}
        </div>
        {/* Game board and other elements will go here */}
      </div>
    );
  }
}

export default Game;
