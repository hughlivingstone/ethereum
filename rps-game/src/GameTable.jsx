import React from 'react'

class GameTable extends React.Component {
  render() {
    const rows = [];
    this.props.games.forEach((game) => {
      rows.push(
        <GameRow
          user={this.props.user}
          game={game}
          key={game.address}
          onJoinClick={this.props.onJoinClick}
        />
      );
    });

    return (
      <table className="pure-table">
        <thead>
          <tr>
            <th>Address</th>
            <th>Player1</th>
            <th>Player2</th>
            <th>Cost</th>
            <th>Join</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    );
  }
}

class GameRow extends React.Component {
  render() {
    const game = this.props.game;
    // Only give option to join if the user is one of the players in the game
    const canJoin = this.props.user === game.player1 || this.props.user === game.player2
    const joinButton = canJoin ? (
      <button onClick={() => this.props.onJoinClick(game.address, game.cost)}>
      Join
     </button>
    ) : "";
    return (
      <tr>
        <td>{game.address}</td>
        <td>{game.player1}</td>
        <td>{game.player2}</td>
        <td>{game.cost}</td>
        <td>
          {joinButton}
        </td>
      </tr>
    );
  }
}

export default GameTable;
