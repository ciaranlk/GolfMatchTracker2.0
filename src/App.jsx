// This version supports exactly 8 predefined matches with no dynamic +New Game button
// Each match is configured in advance with inputs for team names, handicaps, course info
// Once "Start" is clicked for a game, it becomes active and usable

import React, { useState, useEffect } from 'react';
import './App.css';

function calculateCourseHandicap(index, slope, rating) {
  return Math.round(index * (slope / 113) + (rating - 72));
}

function App() {
  const defaultGameState = {
    started: false,
    redName: '',
    blueName: '',
    redIndex: 10,
    blueIndex: 8,
    rating: 72,
    slope: 113,
    chRed: 0,
    chBlue: 0,
    shotsGiven: 0,
    shotsTo: '',
    holes: Array.from({ length: 18 }, (_, i) => ({ hole: i + 1, par: 4, si: i + 1, red: 0, blue: 0 }))
  };

  const [games, setGames] = useState(() => {
    const saved = localStorage.getItem('games8');
    return saved ? JSON.parse(saved) : Array.from({ length: 8 }, () => ({ ...defaultGameState }));
  });

  const [activeGameIndex, setActiveGameIndex] = useState(0);

  useEffect(() => {
    localStorage.setItem('games8', JSON.stringify(games));
  }, [games]);

  const startGame = (index) => {
    const updatedGames = [...games];
    const game = updatedGames[index];
    const chRed = calculateCourseHandicap(game.redIndex, game.slope, game.rating);
    const chBlue = calculateCourseHandicap(game.blueIndex, game.slope, game.rating);
    const shotsGiven = Math.abs(chRed - chBlue);
    const shotsTo = chRed > chBlue ? 'Blue' : 'Red';

    updatedGames[index] = {
      ...game,
      started: true,
      chRed,
      chBlue,
      shotsGiven,
      shotsTo
    };
    setGames(updatedGames);
    setActiveGameIndex(index);
  };

  const updateHole = (gameIndex, holeIndex, team, delta) => {
    const updatedGames = [...games];
    const game = updatedGames[gameIndex];
    game.holes[holeIndex][team] += delta;
    if (game.holes[holeIndex][team] < 0) game.holes[holeIndex][team] = 0;
    setGames(updatedGames);
  };

  const calculateResult = (game, hole) => {
    const { red, blue, si } = hole;
    const { shotsGiven, shotsTo } = game;

    let redScore = red;
    let blueScore = blue;

    const strokeHoles = Array.from({ length: shotsGiven }, (_, i) => i + 1);
    if (strokeHoles.includes(si)) {
      if (shotsTo === 'Red') redScore--;
      else if (shotsTo === 'Blue') blueScore--;
    }

    if (redScore < blueScore) return game.redName;
    if (blueScore < redScore) return game.blueName;
    return 'Half';
  };

  const computeMatchStatus = (game) => {
    let redUp = 0;
    let blueUp = 0;
    let holesPlayed = 0;

    game.holes.forEach(hole => {
      if (hole.red > 0 || hole.blue > 0) {
        holesPlayed++;
        const result = calculateResult(game, hole);
        if (result === game.redName) redUp++;
        else if (result === game.blueName) blueUp++;
      }
    });

    const lead = redUp - blueUp;
    const remaining = 18 - holesPlayed;

    if (lead > remaining) return `${game.redName} ${lead}&${remaining}`;
    if (-lead > remaining) return `${game.blueName} ${-lead}&${remaining}`;
    if (holesPlayed === 18) return lead > 0 ? `${game.redName} 1 Up` : lead < 0 ? `${game.blueName} 1 Up` : 'All Square';
    if (lead > 0) return `${game.redName} ${lead} Up`;
    if (lead < 0) return `${game.blueName} ${-lead} Up`;
    return 'All Square';
  };

  return (
    <div className="app-container">
      <h1>Golf Matchplay Tracker</h1>
      <div className="game-list">
        {games.map((game, index) => (
          <button
            key={index}
            onClick={() => setActiveGameIndex(index)}
            className={index === activeGameIndex ? 'active' : ''}
          >
            {game.redName || 'Red'} vs {game.blueName || 'Blue'} ({computeMatchStatus(game)})
          </button>
        ))}
      </div>

      <div className="setup-section">
        {games.map((game, index) => (
          <div key={index} style={{ margin: '10px 0' }}>
            <strong>Game {index + 1}</strong>
            <input placeholder="Red" value={game.redName} onChange={e => {
              const updated = [...games];
              updated[index].redName = e.target.value;
              setGames(updated);
            }} />
            <input placeholder="Blue" value={game.blueName} onChange={e => {
              const updated = [...games];
              updated[index].blueName = e.target.value;
              setGames(updated);
            }} />
            <input type="number" value={game.redIndex} onChange={e => {
              const updated = [...games];
              updated[index].redIndex = +e.target.value;
              setGames(updated);
            }} />
            <input type="number" value={game.blueIndex} onChange={e => {
              const updated = [...games];
              updated[index].blueIndex = +e.target.value;
              setGames(updated);
            }} />
            <input type="number" value={game.rating} onChange={e => {
              const updated = [...games];
              updated[index].rating = +e.target.value;
              setGames(updated);
            }} />
            <input type="number" value={game.slope} onChange={e => {
              const updated = [...games];
              updated[index].slope = +e.target.value;
              setGames(updated);
            }} />
            {!game.started && <button onClick={() => startGame(index)}>Start</button>}
          </div>
        ))}
      </div>

      {games[activeGameIndex]?.started && (
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
              {games[activeGameIndex].holes.map((hole, i) => {
                const result = calculateResult(games[activeGameIndex], hole);
                const resultClass = result === games[activeGameIndex].redName ? 'red-row' : result === games[activeGameIndex].blueName ? 'blue-row' : '';
                return (
                  <tr key={i} className={resultClass}>
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
                      <button onClick={() => updateHole(activeGameIndex, i, 'red', -1)}>-</button>
                      {hole.red}
                      <button onClick={() => updateHole(activeGameIndex, i, 'red', 1)}>+</button>
                    </td>
                    <td>
                      <button onClick={() => updateHole(activeGameIndex, i, 'blue', -1)}>-</button>
                      {hole.blue}
                      <button onClick={() => updateHole(activeGameIndex, i, 'blue', 1)}>+</button>
                    </td>
                    <td>{result}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
