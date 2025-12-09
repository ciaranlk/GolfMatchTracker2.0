import React, { useState, useEffect } from 'react';
import './App.css';

function calculateCourseHandicap(index, slope, rating) {
  return Math.round(index * (slope / 113) + (rating - 72));
}

function App() {
  const [games, setGames] = useState(() => {
    const saved = localStorage.getItem('games');
    return saved ? JSON.parse(saved) : Array(8).fill(null);
  });
  const [activeGameIndex, setActiveGameIndex] = useState(0);

  const startGame = (index) => {
    const redName = document.getElementById(`redName-${index}`).value;
    const blueName = document.getElementById(`blueName-${index}`).value;
    const redIndex = +document.getElementById(`redIndex-${index}`).value;
    const blueIndex = +document.getElementById(`blueIndex-${index}`).value;
    const rating = +document.getElementById(`rating-${index}`).value;
    const slope = +document.getElementById(`slope-${index}`).value;

    const chRed = calculateCourseHandicap(redIndex, slope, rating);
    const chBlue = calculateCourseHandicap(blueIndex, slope, rating);
    const shotsGiven = Math.abs(chRed - chBlue);
    const shotsTo = chRed > chBlue ? redName : blueName;

    const newGame = {
      redName,
      blueName,
      redIndex,
      blueIndex,
      rating,
      slope,
      chRed,
      chBlue,
      shotsGiven,
      shotsTo,
      holes: Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, par: 4, si: i + 1, red: 0, blue: 0 })),
    };

    const updatedGames = [...games];
    updatedGames[index] = newGame;
    setGames(updatedGames);
    setActiveGameIndex(index);
  };

  useEffect(() => {
    localStorage.setItem('games', JSON.stringify(games));
  }, [games]);

  const updateHole = (index, team, delta) => {
    const updatedGames = [...games];
    const game = updatedGames[activeGameIndex];
    game.holes[index][team] += delta;
    if (game.holes[index][team] < 0) {
      game.holes[index][team] = 0;
    }
    setGames(updatedGames);
  };

  const calculateResult = (hole) => {
    const { red, blue, si } = hole;
    const game = games[activeGameIndex];
    if (!game) return '-';
    const { shotsGiven, shotsTo, redName, blueName } = game;

    let redScore = red;
    let blueScore = blue;

    const strokeHoles = Array.from({ length: shotsGiven }, (_, i) => i + 1);
    const applyShot = strokeHoles.includes(si);

    if (applyShot) {
      if (shotsTo === redName) redScore -= 1;
      else if (shotsTo === blueName) blueScore -= 1;
    }

    if (redScore < blueScore) return redName;
    if (blueScore < redScore) return blueName;
    return 'Half';
  };

  const computeMatchStatus = (game) => {
    let redUp = 0;
    let blueUp = 0;
    let remaining = game.holes.length;

    for (let i = 0; i < game.holes.length; i++) {
      const hole = game.holes[i];
      const result = calculateResult(hole);
      if (result === game.redName) redUp++;
      else if (result === game.blueName) blueUp++;
      remaining--;

      const diff = Math.abs(redUp - blueUp);
      if (diff > remaining) {
        const winner = redUp > blueUp ? game.redName : game.blueName;
        return `${winner} ${diff}&${remaining}`;
      }
    }

    const diff = redUp - blueUp;
    if (diff > 0) return `${game.redName} ${diff} Up`;
    if (diff < 0) return `${game.blueName} ${-diff} Up`;
    return 'All Square';
  };

  return (
    <div className="app-container">
      <h1>Golf Matchplay Tracker</h1>

      <div className="game-tabs">
        {games.map((game, i) => (
          <button
            key={i}
            className={i === activeGameIndex ? 'active' : ''}
            onClick={() => setActiveGameIndex(i)}
          >
            {game ? `${game.redName} vs ${game.blueName} (${computeMatchStatus(game)})` : `Game ${i + 1}`}
          </button>
        ))}
      </div>

      {games.map((game, i) => !game && (
        <div key={i} className="game-setup">
          <label>Game {i + 1} </label>
          <input id={`redName-${i}`} placeholder="Red" defaultValue="Red" />
          <input id={`blueName-${i}`} placeholder="Blue" defaultValue="Blue" />
          <input id={`redIndex-${i}`} type="number" defaultValue={10} />
          <input id={`blueIndex-${i}`} type="number" defaultValue={8} />
          <input id={`rating-${i}`} type="number" defaultValue={72} />
          <input id={`slope-${i}`} type="number" defaultValue={113} />
          <button onClick={() => startGame(i)}>Start</button>
        </div>
      ))}

      {games[activeGameIndex] && (
        <div>
          <h3>{games[activeGameIndex].redName} vs {games[activeGameIndex].blueName}</h3>
          <p>{games[activeGameIndex].redName} CH: {games[activeGameIndex].chRed}, {games[activeGameIndex].blueName} CH: {games[activeGameIndex].chBlue}</p>
          <table>
            <thead>
              <tr>
                <th>Hole</th><th>Par</th><th>SI</th>
                <th>{games[activeGameIndex].redName}</th>
                <th>{games[activeGameIndex].blueName}</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {games[activeGameIndex].holes.map((hole, i) => (
                <tr key={i}>
                  <td>{hole.hole}</td>
                  <td><input value={hole.par} onChange={e => {
                    const updated = [...games];
                    updated[activeGameIndex].holes[i].par = +e.target.value;
                    setGames(updated);
                  }} /></td>
                  <td><input value={hole.si} onChange={e => {
                    const updated = [...games];
                    updated[activeGameIndex].holes[i].si = +e.target.value;
                    setGames(updated);
                  }} /></td>
                  <td>
                    <button onClick={() => updateHole(i, 'red', -1)}>-</button>
                    {hole.red}
                    <button onClick={() => updateHole(i, 'red', 1)}>+</button>
                  </td>
                  <td>
                    <button onClick={() => updateHole(i, 'blue', -1)}>-</button>
                    {hole.blue}
                    <button onClick={() => updateHole(i, 'blue', 1)}>+</button>
                  </td>
                  <td>{calculateResult(hole)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
