import React, { useState, useEffect } from "react";
import "./Grid.css";

const App = () => {
    const [board, setBoard] = useState(Array(9).fill(Array(9).fill("")));
    const [errors, setErrors] = useState([]);
    const [message, setMessage] = useState("");
    const [difficulty, setDifficulty] = useState("medium");
    const [solution, setSolution] = useState([]);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);

    useEffect(() => {
        generatePuzzle(difficulty);
    }, [difficulty]);

    useEffect(() => {
        let timerInterval;
        if (timerRunning) {
            timerInterval = setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerInterval);
        }

        return () => clearInterval(timerInterval);  // Cleanup the interval on unmount
    }, [timerRunning]);

    const generatePuzzle = (selectedDifficulty) => {
        const fullBoard = generateFullBoard();
        setSolution(fullBoard); // Save the solution for the hint system
        const puzzleBoard = removeNumbers(fullBoard, selectedDifficulty);
        setBoard(puzzleBoard);
        setMessage("");
        setErrors([]);
        resetTimer();
    };

    const generateFullBoard = () => {
        const board = Array(9)
            .fill(0)
            .map(() => Array(9).fill(""));
        solveSudoku(board);
        return board;
    };

    const solveSudoku = (board) => {
        const findEmpty = () => {
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    if (!board[row][col]) return [row, col];
                }
            }
            return null;
        };

        const isValid = (board, row, col, num) => {
            for (let i = 0; i < 9; i++) {
                if (board[row][i] === num || board[i][col] === num) return false;
                const subgridRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
                const subgridCol = 3 * Math.floor(col / 3) + (i % 3);
                if (board[subgridRow][subgridCol] === num) return false;
            }
            return true;
        };

        const emptySpot = findEmpty();
        if (!emptySpot) return true;

        const [row, col] = emptySpot;
        for (let num = 1; num <= 9; num++) {
            if (isValid(board, row, col, num.toString())) {
                board[row][col] = num.toString();
                if (solveSudoku(board)) return true;
                board[row][col] = "";
            }
        }
        return false;
    };

    const removeNumbers = (board, selectedDifficulty) => {
        const levels = { easy: 30, medium: 40, hard: 50 };
        const removeCount = levels[selectedDifficulty];
        const newBoard = board.map((row) => [...row]);

        let removed = 0;
        while (removed < removeCount) {
            const row = Math.floor(Math.random() * 9);
            const col = Math.floor(Math.random() * 9);

            if (newBoard[row][col]) {
                newBoard[row][col] = "";
                removed++;
            }
        }
        return newBoard;
    };

    const handleInputChange = (row, col, value) => {
        if (value !== "" && (!/^[1-9]$/.test(value))) return;

        const updatedBoard = board.map((r, i) =>
            r.map((cell, j) => (i === row && j === col ? value : cell))
        );

        setBoard(updatedBoard);
    };

    const checkSolution = () => {
        const newErrors = [];
        for (let i = 0; i < 9; i++) {
            const rowSet = new Set();
            const colSet = new Set();
            for (let j = 0; j < 9; j++) {
                if (board[i][j]) {
                    if (rowSet.has(board[i][j])) newErrors.push([i, j]);
                    else rowSet.add(board[i][j]);
                }

                if (board[j][i]) {
                    if (colSet.has(board[j][i])) newErrors.push([j, i]);
                    else colSet.add(board[j][i]);
                }
            }
        }

        for (let gridRow = 0; gridRow < 3; gridRow++) {
            for (let gridCol = 0; gridCol < 3; gridCol++) {
                const subgridSet = new Set();
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 3; j++) {
                        const row = gridRow * 3 + i;
                        const col = gridCol * 3 + j;
                        if (board[row][col]) {
                            if (subgridSet.has(board[row][col])) {
                                newErrors.push([row, col]);
                            } else {
                                subgridSet.add(board[row][col]);
                            }
                        }
                    }
                }
            }
        }

        setErrors(newErrors);

        if (newErrors.length === 0 && board.flat().every((cell) => cell !== "")) {
            setMessage("Congratulations! You solved the puzzle!");
            stopTimer();
        } else {
            setMessage("There are errors in the solution. Please try again.");
        }
    };

    const giveHint = () => {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (!board[row][col]) {
                    const updatedBoard = board.map((r, i) =>
                        r.map((cell, j) =>
                            i === row && j === col ? solution[row][col] : cell
                        )
                    );
                    setBoard(updatedBoard);
                    return;
                }
            }
        }
        setMessage("No more hints available!");
    };

    const isError = (row, col) => {
        return errors.some(([errorRow, errorCol]) => errorRow === row && errorCol === col);
    };

    const resetTimer = () => {
        setElapsedSeconds(0);
        setTimerRunning(false);
    };

    const startTimer = () => {
        setTimerRunning(true);
    };

    const stopTimer = () => {
        setTimerRunning(false);
    };

    return (
        <div className="sudoku-container">
            <h1>Sudoku Game</h1>
            <div className="controls">
                <div id="timer">Time: {String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:{String(elapsedSeconds % 60).padStart(2, '0')}</div>
                <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>
                <button onClick={() => generatePuzzle(difficulty)}>Generate New Puzzle</button>
                <button onClick={checkSolution}>Check Solution</button>
                <button onClick={giveHint}>Hint</button>
            </div>
            <p>{message}</p>
            <div className="grid">
                {board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                        <input
                            key={`${rowIndex}-${colIndex}`}
                            type="text"
                            maxLength="1"
                            value={cell}
                            onChange={(e) => handleInputChange(rowIndex, colIndex, e.target.value)}
                            className={`cell ${isError(rowIndex, colIndex) ? "error" : ""}`}
                            disabled={cell !== ""}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default App;
