import React from 'react'

class CreateGame extends React.Component {

  constructor(props) {
    super(props);
    this.handlePlayer1Change = this.handlePlayer1Change.bind(this);
    this.handlePlayer2Change = this.handlePlayer2Change.bind(this);
    this.handleCostChange = this.handleCostChange.bind(this);
    this.handleCreateGame = this.handleCreateGame.bind(this);
    this.state = { player1: '', player2: '', cost: '' };
  }

  render() {
    return (
      <form className="pure-form">
        <h2>Create a Game</h2>
        <fieldset>
          <input value={this.state.player1}
            onChange={this.handlePlayer1Change} placeholder="Player 1 address" />

          <input value={this.state.player2}
            onChange={this.handlePlayer2Change} placeholder="Player 2 address" />

          <input value={this.state.cost} type="number"
            onChange={this.handleCostChange} placeholder="1000" />

          <button onClick={this.handleCreateGame} className="pure-button pure-button-primary">
            Create Game!
                </button>
        </fieldset>
      </form>
    );
  }

  handlePlayer1Change(e) {
    this.setState({ player1: e.target.value });
    // this.props.onP1Change(e.target.value);
  }

  handlePlayer2Change(e) {
    this.setState({ player2: e.target.value });
    // this.props.onP2Change(e.target.value);
  }

  handleCostChange(e) {
    this.setState({ cost: e.target.value });
    // this.props.onCostChange(e.target.value);
  }

  handleCreateGame(e) {
    this.props.onCreateClick(this.state.player1, this.state.player2, this.state.cost);
  }
}

export default CreateGame;

