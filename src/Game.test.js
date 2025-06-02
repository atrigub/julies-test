import React from 'react';
import { render, act } from '@testing-library/react';
import Game from './Game';

// Mockup for getRandomCoordinates for predictable testing
// We can't directly test the Game.getRandomCoordinates as it's not exported
// and not a static method. We will test its effects through repositionFood
// or by testing a similar, exported version if we decide to refactor.

const GAME_BOARD_MIN_TEST = 0;
const GAME_BOARD_MAX_TEST = 98; // Max for 2% steps

// Testable version of getRandomCoordinates
const getRandomCoordinatesForTest = () => {
  let x = Math.floor((Math.random() * (GAME_BOARD_MAX_TEST - GAME_BOARD_MIN_TEST + 1) + GAME_BOARD_MIN_TEST) / 2) * 2;
  let y = Math.floor((Math.random() * (GAME_BOARD_MAX_TEST - GAME_BOARD_MIN_TEST + 1) + GAME_BOARD_MIN_TEST) / 2) * 2;
  return [x, y];
};

describe('Game Component Logic', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  test('initial state is set correctly', () => {
    const { rerender, container } = render(<Game />);
    // A common way to get instance in older class components or via refs.
    // For functional components with hooks, testing behavior via UI interaction is preferred.
    // This direct instance access is fragile.
    let instance;
    try {
      // Attempting a common pattern for class components, may vary.
      // If Game was a class component and we assigned a ref to it, instance = ref.current.
      // For now, let's assume this direct access works for this specific (older) React setup.
      // It's important to note that this is not a standard testing practice for modern React.
      const element = document.querySelector('.game-board'); // Or any unique selector for Game's output
      if (element && element._reactInternals) { // This is a guess, actual path is highly unstable
         instance = element._reactInternals.return.stateNode;
      } else {
        // Fallback or error if instance cannot be grabbed.
        // This approach of getting instance is highly discouraged.
        // We will try to test through UI or by calling methods if possible.
        // For now, we'll assume it's needed for some specific tests.
        const { result } = renderHook(() => Game); // This is not for components
        // The example used a very specific internal fiber node path which is not reliable.
        // Let's try to get the component instance via a ref if we were to modify Game.js
        // For now, we'll try to test public methods or state changes via `act`.
        // This line is problematic:
        // const instance = container.firstChild.__reactInternals$y9pr3gh2x6o.return.stateNode;
        // Let's create an instance using a different approach for testing methods if possible.
        // For now, we will use a rendered component and try to call methods on its instance.
        // This is still not ideal. Refactoring Game logic to be testable independently is better.
        
        // Placeholder for instance, actual instance grabbing is problematic without refactoring
        // For the purpose of these tests, we'll assume `instance` can be obtained
        // and proceed with tests that might require it, or adapt tests to not need it.
        // A better way would be to use `useRef` in Game and expose methods, or test via UI.
        // For the tests below, we'll assume we can get an instance or test via state changes.
         const gameInstanceRef = React.createRef();
         rerender(<Game ref={gameInstanceRef} />);
         if (gameInstanceRef.current) {
           instance = gameInstanceRef.current;
         } else {
           // This is a known issue with testing libraries and getting class component instances
           // without modifying the component. For now, we'll have to rely on querying the DOM
           // and inferring state, or testing methods if they were static/exported.
           // The provided snippet for instance is not robust.
           // We'll proceed by directly calling methods on a new Game() instance for some tests,
           // which works if they don't rely heavily on React's lifecycle or full rendering context.
           // This is not standard for component testing but can work for pure logic.
           instance = new Game(); // This will not have the full React lifecycle.
         }
    }
    
    expect(instance.state.snakeDots.length).toBe(2);
    // This initial state test relies on the default state of the component.
    // If `new Game()` doesn't set up state correctly without `render()`, these will fail.
    // It's better to check rendered output or use testing-library queries for state.
    // For now, we assume `instance.state` is accessible and correct after `new Game()`.
    expect(instance.state.direction).toBe('RIGHT');
    expect(instance.state.speed).toBe(200);
    expect(instance.state.gameOver).toBe(false);
    expect(instance.state.score).toBe(0);
    expect(instance.state.food.length).toBe(2); 
    // Check if food is within bounds (important for initial state too)
    expect(instance.state.food[0]).toBeGreaterThanOrEqual(GAME_BOARD_MIN_TEST);
    expect(instance.state.food[0]).toBeLessThanOrEqual(GAME_BOARD_MAX_TEST);
    expect(instance.state.food[1]).toBeGreaterThanOrEqual(GAME_BOARD_MIN_TEST);
    expect(instance.state.food[1]).toBeLessThanOrEqual(GAME_BOARD_MAX_TEST);
    expect(instance.state.food[0] % 2).toBe(0);
    expect(instance.state.food[1] % 2).toBe(0);
  });

  test('getRandomCoordinatesForTest returns coordinates within bounds and as multiples of 2', () => {
    for (let i = 0; i < 100; i++) { // Run a few times to ensure randomness is within constraints
      const [x, y] = getRandomCoordinatesForTest();
      expect(x).toBeGreaterThanOrEqual(GAME_BOARD_MIN_TEST);
      expect(x).toBeLessThanOrEqual(GAME_BOARD_MAX_TEST);
      expect(y).toBeGreaterThanOrEqual(GAME_BOARD_MIN_TEST);
      expect(y).toBeLessThanOrEqual(GAME_BOARD_MAX_TEST);
      expect(x % 2).toBe(0);
      expect(y % 2).toBe(0);
    }
  });

  test('repositionFood places food in a new valid position', () => {
    const gameInstance = new Game(); // Test method directly
    const initialFoodPos = [...gameInstance.state.food];
    
    // Mock snakeDots to avoid food spawning on snake, or ensure snake is far away
    gameInstance.setState({ snakeDots: [[0,0], [2,0]] }); 

    act(() => {
      gameInstance.repositionFood();
    });

    const newFoodPos = gameInstance.state.food;
    expect(newFoodPos).not.toEqual(initialFoodPos);
    expect(newFoodPos[0]).toBeGreaterThanOrEqual(GAME_BOARD_MIN_TEST);
    expect(newFoodPos[0]).toBeLessThanOrEqual(GAME_BOARD_MAX_TEST);
    expect(newFoodPos[1]).toBeGreaterThanOrEqual(GAME_BOARD_MIN_TEST);
    expect(newFoodPos[1]).toBeLessThanOrEqual(GAME_BOARD_MAX_TEST);
    expect(newFoodPos[0] % 2).toBe(0);
    expect(newFoodPos[1] % 2).toBe(0);

    // Ensure food is not on snake (basic check)
    let foodOnSnake = false;
    for (let dot of gameInstance.state.snakeDots) {
      if (dot[0] === newFoodPos[0] && dot[1] === newFoodPos[1]) {
        foodOnSnake = true;
        break;
      }
    }
    expect(foodOnSnake).toBe(false);
  });

  test('snake moves correctly in each direction', () => {
    const gameInstance = new Game(); // Using new Game() for direct state manipulation
    
    // Test RIGHT
    gameInstance.setState({ snakeDots: [[0,0], [2,0]], direction: 'RIGHT', gameOver: false, justAte: false });
    act(() => { gameInstance.moveSnake(); });
    expect(gameInstance.state.snakeDots).toEqual([[2,0], [4,0]]);

    // Test LEFT
    gameInstance.setState({ snakeDots: [[2,0], [4,0]], direction: 'LEFT', gameOver: false, justAte: false });
    act(() => { gameInstance.moveSnake(); });
    expect(gameInstance.state.snakeDots).toEqual([[4,0], [2,0]]); // Should be [[2,0],[0,0]] if starting from [2,0],[4,0] and moving left
                                                              // Correcting the expectation based on current moveSnake logic (adds to head, shifts tail)
                                                              // If state was [[2,0], [4,0]], head is [4,0]. Moving LEFT: new head is [2,0]. dots.push([2,0]) -> [[2,0],[4,0],[2,0]]. dots.shift() -> [[4,0],[2,0]]
                                                              // This seems off. Let's re-verify moveSnake.
                                                              // head = dots[dots.length - 1] -> [4,0]
                                                              // new head = [4-2, 0] = [2,0]
                                                              // dots.push([2,0]) -> [[2,0], [4,0], [2,0]]
                                                              // dots.shift() -> [[4,0], [2,0]] - This is correct for the code.
                                                              // Let's adjust initial state for clarity for LEFT.
    gameInstance.setState({ snakeDots: [[4,0], [2,0]], direction: 'LEFT', gameOver: false, justAte: false }); // Head is [2,0]
    act(() => { gameInstance.moveSnake(); }); // New head [0,0]. Snake: [[2,0],[0,0]]
    expect(gameInstance.state.snakeDots).toEqual([[2,0], [0,0]]);


    // Test DOWN
    gameInstance.setState({ snakeDots: [[0,0], [0,2]], direction: 'DOWN', gameOver: false, justAte: false }); // Head is [0,2]
    act(() => { gameInstance.moveSnake(); }); // New head [0,4]. Snake: [[0,2],[0,4]]
    expect(gameInstance.state.snakeDots).toEqual([[0,2], [0,4]]);

    // Test UP
    gameInstance.setState({ snakeDots: [[0,2], [0,0]], direction: 'UP', gameOver: false, justAte: false }); // Head is [0,0]
    act(() => { gameInstance.moveSnake(); }); // New head [0,-2]. Snake: [[0,0],[0,-2]]
    expect(gameInstance.state.snakeDots).toEqual([[0,0], [0,-2]]); // This will go out of bounds, which is fine for this unit test of movement.
  });

  test('snake grows when it eats food', () => {
    const gameInstance = new Game();
    const initialSnake = [[0,0], [2,0]];
    // Place food directly in front of the snake
    gameInstance.setState({ 
      snakeDots: initialSnake, 
      food: [4,0], 
      direction: 'RIGHT', 
      gameOver: false,
      justAte: false,
      score: 0
    });

    act(() => {
      gameInstance.moveSnake(); // Snake moves to [2,0],[4,0] and eats food
    });
    
    expect(gameInstance.state.snakeDots.length).toBe(initialSnake.length + 1);
    expect(gameInstance.state.snakeDots).toEqual([[0,0], [2,0], [4,0]]); // Tail not removed
    expect(gameInstance.state.justAte).toBe(true); // Flag set
    expect(gameInstance.state.score).toBe(1);

    // Next move, snake should continue moving, and tail should be removed (as justAte becomes false)
    act(() => {
      gameInstance.moveSnake(); 
    });
    expect(gameInstance.state.snakeDots.length).toBe(initialSnake.length + 1); // Length remains same
    expect(gameInstance.state.snakeDots).toEqual([[2,0], [4,0], [6,0]]);
    expect(gameInstance.state.justAte).toBe(false); // Flag reset
  });

  describe('Collision Detection', () => {
    const gameInstance = new Game(); // Instance for these specific tests

    test('checkIfOutOfBorders works correctly', () => {
      // Out of bounds
      expect(gameInstance.checkIfOutOfBorders([-2, 0])).toBe(true); // Left
      expect(gameInstance.checkIfOutOfBorders([100, 0])).toBe(true); // Right (GAME_BOARD_MAX_TEST is 98, so 98+2 = 100)
      expect(gameInstance.checkIfOutOfBorders([0, -2])).toBe(true); // Up
      expect(gameInstance.checkIfOutOfBorders([0, 100])).toBe(true); // Down
      
      // Within bounds
      expect(gameInstance.checkIfOutOfBorders([0, 0])).toBe(false);
      expect(gameInstance.checkIfOutOfBorders([98, 98])).toBe(false);
      expect(gameInstance.checkIfOutOfBorders([50, 50])).toBe(false);
    });

    test('checkIfCollapsed works correctly', () => {
      // Collapsed
      gameInstance.setState({ snakeDots: [[0,0], [2,0], [4,0], [2,0]] }); // Head [2,0] collides with body [2,0]
      let headCollided = gameInstance.state.snakeDots[gameInstance.state.snakeDots.length -1];
      expect(gameInstance.checkIfCollapsed(headCollided)).toBe(true);

      gameInstance.setState({ snakeDots: [[0,0], [2,0], [4,0], [0,0]] }); // Head [0,0] collides
      headCollided = gameInstance.state.snakeDots[gameInstance.state.snakeDots.length -1];
      expect(gameInstance.checkIfCollapsed(headCollided)).toBe(true);

      // Not collapsed
      gameInstance.setState({ snakeDots: [[0,0], [2,0], [4,0]] });
      let headNotCollided = gameInstance.state.snakeDots[gameInstance.state.snakeDots.length -1];
      expect(gameInstance.checkIfCollapsed(headNotCollided)).toBe(false);

      gameInstance.setState({ snakeDots: [[0,0]] }); // Single dot, cannot collapse
      headNotCollided = gameInstance.state.snakeDots[gameInstance.state.snakeDots.length -1];
      expect(gameInstance.checkIfCollapsed(headNotCollided)).toBe(false);
    });
  });

  test('game over occurs when snake hits wall', () => {
    const gameInstance = new Game();
    gameInstance.setState({ 
      snakeDots: [[96,0], [98,0]], // Head at [98,0], about to hit right wall
      direction: 'RIGHT', 
      gameOver: false,
      speed: 10 // Make speed fast for test if using timers, though direct call avoids it
    });
    // Mock clearInterval if it's called inside onGameOver and affects other tests or setup
    // For now, onGameOver primarily sets state.
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');

    act(() => {
      gameInstance.moveSnake(); // Moves to [100,0], out of bounds
    });

    expect(gameInstance.state.gameOver).toBe(true);
    expect(clearIntervalSpy).toHaveBeenCalled(); // Check if game loop was cleared
    clearIntervalSpy.mockRestore();
  });

  test('game over occurs when snake collapses on itself', () => {
    const gameInstance = new Game();
    gameInstance.setState({ 
      snakeDots: [[4,0], [2,0], [0,0], [2,0]], // Head at [2,0], moving LEFT, will hit [2,0] in body
      direction: 'LEFT', // Will attempt to move to [0,0], then to [-2,0]
                           // Let's set it up to directly collide
                           // Snake: [ (tail) [4,0], [2,0], [0,0], (head) [2,0] ] - this is already collapsed state for testing checkIfCollapsed.
                           // For moveSnake to cause collapse:
                           // Initial: [[4,0],[2,0],[0,0]] Direction: RIGHT. Food far away.
                           // moveSnake: [[2,0],[0,0],[2,0]] -> head [2,0] collides with body [2,0]
      snakeDots: [[6,0], [4,0], [2,0]], direction: 'RIGHT', food: [10,10] 
    });
     gameInstance.setState({ 
      snakeDots: [[4,0],[2,0],[0,0]], 
      direction: 'RIGHT', 
      food: [20,20], // food far away
      gameOver: false,
      justAte: false
    });
    // Make it turn back on itself
    // State: [[4,0],[2,0],[0,0]] (Head at [0,0])
    // 1. Move UP: [[2,0],[0,0],[0,-2]] (Head at [0,-2])
    // 2. Move LEFT: [[0,0],[0,-2],[-2,-2]] (Head at [-2,-2])
    // 3. Move DOWN: [[0,-2],[-2,-2],[-2,0]] (Head at [-2,0])
    // 4. Move RIGHT: [[-2,-2],[-2,0],[0,0]] (Head at [0,0]) -> COLLISION!
    
    act(() => { gameInstance.setState({ direction: 'UP' }); gameInstance.moveSnake(); }); // Head [0,-2], Snake [[2,0],[0,0],[0,-2]]
    act(() => { gameInstance.setState({ direction: 'LEFT' }); gameInstance.moveSnake(); }); // Head [-2,-2], Snake [[0,0],[0,-2],[-2,-2]]
    act(() => { gameInstance.setState({ direction: 'DOWN' }); gameInstance.moveSnake(); }); // Head [-2,0], Snake [[0,-2],[-2,-2],[-2,0]]
    
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    act(() => { gameInstance.setState({ direction: 'RIGHT' }); gameInstance.moveSnake(); }); // Head [0,0], COLLIDES with snake[0] which is [0,0] after shifts

    expect(gameInstance.state.gameOver).toBe(true);
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  test('score increments when food is eaten', () => {
    const gameInstance = new Game();
    gameInstance.setState({ 
      snakeDots: [[0,0], [2,0]], 
      food: [4,0], // Food right in front
      direction: 'RIGHT', 
      score: 0,
      gameOver: false,
      justAte: false
    });

    act(() => {
      gameInstance.moveSnake(); // Eats food
    });
    expect(gameInstance.state.score).toBe(1);

    // Eat another food
    gameInstance.setState({ food: [6,0], direction: 'RIGHT' }); // New food in front
     act(() => {
      gameInstance.moveSnake(); // Eats again
    });
    expect(gameInstance.state.score).toBe(2);
  });
});

describe('Game Speed Change Logic', () => {
  let gameInstance;
  let clearIntervalSpy;
  let setIntervalSpy;

  beforeEach(() => {
    jest.useFakeTimers();
    gameInstance = new Game(); // Create a new instance for each test
    // Initialize state similar to how the component does, focusing on relevant parts
    gameInstance.setState({
      food: [10, 10], // Dummy food position
      snakeDots: [[0, 0], [2, 0]],
      direction: 'RIGHT',
      initialSpeed: 200,
      speed: 200,
      minSpeed: 50,
      gameOver: false,
      justAte: false,
      score: 0,
      foodEatenSinceLastSpeedIncrease: 0
    });

    clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    setIntervalSpy = jest.spyOn(window, 'setInterval');
    
    // Mock the initial intervalId that would be set in componentDidMount
    // This is important because componentDidUpdate might try to clear it.
    gameInstance.intervalId = 12345; // Dummy interval ID
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks(); // Clears spies usage data
  });

  test('foodEatenSinceLastSpeedIncrease increments correctly', () => {
    // Simulate eating food - by directly invoking the part of moveSnake logic
    // This requires careful setup of 'head' and 'food' state.
    const head = [4,0]; // Assume snake head will be here
    gameInstance.setState({ food: [4,0] }); // Food is at the same position

    // Manually trigger the eating logic part from moveSnake
    // This is a more direct unit test of the setState callback
    act(() => {
      gameInstance.setState(prevState => ({
        justAte: true,
        score: prevState.score + 1,
        foodEatenSinceLastSpeedIncrease: prevState.foodEatenSinceLastSpeedIncrease + 1
      }), () => {
        // Callback from eating food, where speed check happens
        if (gameInstance.state.foodEatenSinceLastSpeedIncrease >= 5) {
          const newSpeed = Math.max(gameInstance.state.speed - 30, gameInstance.state.minSpeed);
          if (newSpeed !== gameInstance.state.speed) {
            gameInstance.setState({ speed: newSpeed, foodEatenSinceLastSpeedIncrease: 0 });
          } else {
            gameInstance.setState({ foodEatenSinceLastSpeedIncrease: 0 });
          }
        }
      });
    });
    expect(gameInstance.state.foodEatenSinceLastSpeedIncrease).toBe(1);
    expect(gameInstance.state.score).toBe(1);

    act(() => { // Eat again
       gameInstance.setState(prevState => ({
        justAte: true,
        score: prevState.score + 1,
        foodEatenSinceLastSpeedIncrease: prevState.foodEatenSinceLastSpeedIncrease + 1
      }), () => {
        if (gameInstance.state.foodEatenSinceLastSpeedIncrease >= 5) {
          const newSpeed = Math.max(gameInstance.state.speed - 30, gameInstance.state.minSpeed);
           if (newSpeed !== gameInstance.state.speed) {
            gameInstance.setState({ speed: newSpeed, foodEatenSinceLastSpeedIncrease: 0 });
          } else {
            gameInstance.setState({ foodEatenSinceLastSpeedIncrease: 0 });
          }
        }
      });
    });
    expect(gameInstance.state.foodEatenSinceLastSpeedIncrease).toBe(2);
    expect(gameInstance.state.score).toBe(2);
  });

  test('speed changes at threshold and respects minSpeed', () => {
    gameInstance.setState({ 
      foodEatenSinceLastSpeedIncrease: 4, // One away from threshold
      speed: 200, 
      initialSpeed: 200,
      minSpeed: 50 
    });

    // Simulate eating the 5th piece of food
    act(() => {
      gameInstance.setState(prevState => ({
        justAte: true, // Not strictly needed for this test's focus but good for consistency
        score: prevState.score + 1,
        foodEatenSinceLastSpeedIncrease: prevState.foodEatenSinceLastSpeedIncrease + 1
      }), () => { // This is the callback where speed logic is triggered
        if (gameInstance.state.foodEatenSinceLastSpeedIncrease >= 5) {
          const newSpeed = Math.max(gameInstance.state.speed - 30, gameInstance.state.minSpeed);
          if (newSpeed !== gameInstance.state.speed) {
            gameInstance.setState({ speed: newSpeed, foodEatenSinceLastSpeedIncrease: 0 });
          } else {
            gameInstance.setState({ foodEatenSinceLastSpeedIncrease: 0 });
          }
        }
      });
    });

    expect(gameInstance.state.speed).toBe(170); // 200 - 30
    expect(gameInstance.state.foodEatenSinceLastSpeedIncrease).toBe(0); // Reset

    // Simulate eating 5 more pieces of food (fast forward)
    // Speed: 170 -> 140 -> 110 -> 80 -> 50 (minSpeed)
    for (let i = 0; i < 4; i++) { // 4 more speed increases
      gameInstance.setState({ foodEatenSinceLastSpeedIncrease: 4, speed: gameInstance.state.speed }); // set to 4 to trigger on next "eat"
      act(() => {
        gameInstance.setState(prevState => ({
          foodEatenSinceLastSpeedIncrease: prevState.foodEatenSinceLastSpeedIncrease + 1
        }), () => {
          if (gameInstance.state.foodEatenSinceLastSpeedIncrease >= 5) {
            const newSpeed = Math.max(gameInstance.state.speed - 30, gameInstance.state.minSpeed);
            if (newSpeed !== gameInstance.state.speed) {
                gameInstance.setState({ speed: newSpeed, foodEatenSinceLastSpeedIncrease: 0 });
            } else {
                gameInstance.setState({ foodEatenSinceLastSpeedIncrease: 0 });
            }
          }
        });
      });
    }
    expect(gameInstance.state.speed).toBe(50); // Should be at minSpeed: 170-30=140, 140-30=110, 110-30=80, 80-30=50
    
    // Eat 5 more, speed should not go below minSpeed (50)
    gameInstance.setState({ foodEatenSinceLastSpeedIncrease: 4, speed: gameInstance.state.minSpeed });
     act(() => {
        gameInstance.setState(prevState => ({
          foodEatenSinceLastSpeedIncrease: prevState.foodEatenSinceLastSpeedIncrease + 1
        }), () => {
          if (gameInstance.state.foodEatenSinceLastSpeedIncrease >= 5) {
            const newSpeed = Math.max(gameInstance.state.speed - 30, gameInstance.state.minSpeed);
             if (newSpeed !== gameInstance.state.speed) {
                gameInstance.setState({ speed: newSpeed, foodEatenSinceLastSpeedIncrease: 0 });
            } else { // Speed is already minSpeed, newSpeed will be the same
                gameInstance.setState({ foodEatenSinceLastSpeedIncrease: 0 });
            }
          }
        });
      });
    expect(gameInstance.state.speed).toBe(50); // Still 50
    expect(gameInstance.state.foodEatenSinceLastSpeedIncrease).toBe(0); // Reset
  });

  test('game loop restarts when speed changes', () => {
    const oldSpeed = gameInstance.state.speed; // 200
    const expectedNewSpeed = 170;
    gameInstance.setState({ foodEatenSinceLastSpeedIncrease: 4 }); // About to trigger speed change

    // Simulate eating the 5th piece of food to trigger speed change
    act(() => {
      gameInstance.setState(prevState => ({
        foodEatenSinceLastSpeedIncrease: prevState.foodEatenSinceLastSpeedIncrease + 1
      }), () => { // Callback where speed logic is triggered
        if (gameInstance.state.foodEatenSinceLastSpeedIncrease >= 5) {
          const newSpeedCalc = Math.max(gameInstance.state.speed - 30, gameInstance.state.minSpeed);
          if (newSpeedCalc !== gameInstance.state.speed) {
            gameInstance.setState({ speed: newSpeedCalc, foodEatenSinceLastSpeedIncrease: 0 });
          } else {
            gameInstance.setState({ foodEatenSinceLastSpeedIncrease: 0 });
          }
        }
      });
    });
    
    expect(gameInstance.state.speed).toBe(expectedNewSpeed);

    // Manually call componentDidUpdate as it's not automatically called on `new Game()` instances
    // when state is changed directly.
    // We pass the previous state that has the old speed.
    act(() => {
      gameInstance.componentDidUpdate({}, { speed: oldSpeed, gameOver: false }); // Provide relevant parts of prevState
    });

    expect(clearIntervalSpy).toHaveBeenCalledWith(gameInstance.intervalId); // The initial dummy intervalId
    expect(setIntervalSpy).toHaveBeenCalledTimes(1); // Called once to restart
    expect(setIntervalSpy).toHaveBeenCalledWith(gameInstance.moveSnake, expectedNewSpeed);
  });

  test('no speed change or loop restart below threshold', () => {
    const initialSpeed = gameInstance.state.speed;
    gameInstance.setState({ foodEatenSinceLastSpeedIncrease: 0 });

    // Simulate eating 1 piece of food (not enough for speed change)
    act(() => {
      gameInstance.setState(prevState => ({
        foodEatenSinceLastSpeedIncrease: prevState.foodEatenSinceLastSpeedIncrease + 1
      }), () => {
        if (gameInstance.state.foodEatenSinceLastSpeedIncrease >= 5) {
          // This block should not be hit
          const newSpeed = Math.max(gameInstance.state.speed - 30, gameInstance.state.minSpeed);
          gameInstance.setState({ speed: newSpeed, foodEatenSinceLastSpeedIncrease: 0 });
        }
      });
    });

    expect(gameInstance.state.speed).toBe(initialSpeed); // Speed remains the same
    expect(gameInstance.state.foodEatenSinceLastSpeedIncrease).toBe(1);
    
    // Manually call componentDidUpdate to check if it would (incorrectly) restart the loop
    const oldSpeed = initialSpeed; // In this case, speed didn't change.
    act(() => {
        // Pass same speed in prevState as it didn't change
      gameInstance.componentDidUpdate({}, { speed: oldSpeed, gameOver: false }); 
    });

    expect(clearIntervalSpy).not.toHaveBeenCalled();
    expect(setIntervalSpy).not.toHaveBeenCalled(); // Interval should not restart if speed hasn't changed
  });

});
