import React from 'react';

class MyGames extends React.Component {
    render() {
        const games = [];
        if (this.props.myGames) {
            Object.keys(this.props.myGames).map((key) => {
                var game = this.props.myGames[key]
                games.push(
                    <Game
                        key={game.address}
                        players={game.players}
                        gameAddress={game.address}
                        user={this.props.user}
                        cost={game.cost}
                        onJoinClick={this.props.onJoinClick}
                        onPlayMoveClick={this.props.onPlayMoveClick}
                        onRevealMoveClick={this.props.onRevealMoveClick}
                        result={game.result}
                    />
                );
            });
        }
        return (
            <div>
                {games}
            </div>
        );
    }
}

class Game extends React.Component {

    getDisplyState() {
        var joined = false;
        var userPlayedSecretMove = false;
        var otherPlayedSecretMove = false
        this.props.players.forEach((player) => {
            if (player.address === this.props.user && player.joined) {
                joined = true;
                if (player.secretMove) {
                    userPlayedSecretMove = true;
                }
            } else {
                if (player.secretMove) {
                    otherPlayedSecretMove = true;
                }
            }
        });

        var gameDisplayState;
        if (this.props.result) {
            gameDisplayState = <FinishedState />
        }
        else if (userPlayedSecretMove && otherPlayedSecretMove) {
            gameDisplayState = <RevealMoveState
                onRevealMoveClick={this.props.onRevealMoveClick}
            />
        }
        else if (!joined) {
            gameDisplayState = <InitialState
                gameAddress={this.props.gameAddress}
                players={this.props.players}
                cost={this.props.cost}
                onJoinClick={this.props.onJoinClick}
            />
        } else {
            gameDisplayState = <JoinedState
                gameAddress={this.props.gameAddress}
                onPlayMoveClick={this.props.onPlayMoveClick}
            />
        }
        return gameDisplayState;
    }

    // TODO add in play move button and listen to event to populate secret moves
    render() {
        return (
            <React.Fragment>
                <GameStatusTable
                    gameAddress={this.props.gameAddress}
                    players={this.props.players}
                />
                {this.getDisplyState()}
            </React.Fragment >
        );
    }
}

class PlayerRow extends React.Component {
    render() {
        const player = this.props.player;
        var joinedText = player.joined ? "Yes" : "No";
        return (
            <tr>
                <td>{player.address}</td>
                <td>{joinedText}</td>
                <td>{player.secretMove}</td>
                <td>{player.revealedMove}</td>
            </tr>
        );
    }
}

class GameStatusTable extends React.Component {
    render() {
        const gameAddress = this.props.gameAddress;
        const rows = [];
        var joined = false;
        this.props.players.forEach((player) => {
            rows.push(
                <PlayerRow
                    player={player}
                    key={player.address}
                />
            );
        });
        return (
            <React.Fragment>
                <h3>Game: {gameAddress}</h3>
                <table className="pure-table">
                    <thead>
                        <tr>
                            <th>Player Address</th>
                            <th>Joined</th>
                            <th>Secret Move</th>
                            <th>Revealed Move</th>
                        </tr>
                    </thead>
                    <tbody>{rows}</tbody>
                </table>
            </React.Fragment >)
    }
}

class InitialState extends React.Component {
    // TODO add in play move button and listen to event to populate secret moves
    render() {
        const gameAddress = this.props.gameAddress;
        const rows = [];
        this.props.players.forEach((player) => {
            rows.push(
                <PlayerRow
                    player={player}
                    key={player.address}
                />
            );
        });

        return (
            <React.Fragment>
                <h3>Game: {gameAddress}</h3>
                <table className="pure-table">
                    <thead>
                        <tr>
                            <th>Player Address</th>
                            <th>Joined</th>
                            <th>Secret Move</th>
                            <th>Revealed Move</th>
                        </tr>
                    </thead>
                    <tbody>{rows}</tbody>
                </table>
                <button className="pure-button pure-button-primary"
                    onClick={() => this.props.onJoinClick(this.props.gameAddress, this.props.cost)}>
                    Join
                </button>
            </React.Fragment >
        );
    }
}

class JoinedState extends React.Component {
    constructor(props) {
        super(props);
        this.state = { move: '0', password: ''};
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({ move: event.target.value });
    }

    handlePasswordChange(e) {
        this.setState({ password: e.target.value });
    }

    handleSubmit(event) {
        this.props.onPlayMoveClick(this.props.gameAddress, this.state.move, this.state.password);
        event.preventDefault();
    }

    render() {
        return (
            <form className="pure-form" onSubmit={this.handleSubmit}>
                <fieldset>
                    <select id="move" onChange={this.handleChange}>
                        <option value='1'>Rock</option>
                        <option value='2'>Paper</option>
                        <option value='3'>Scissors</option>
                    </select>
                    <input onChange={this.handlePasswordChange} placeholder="Clear-text password " />
                    <button type="submit" className="pure-button pure-button-primary">Play Move</button>
                </fieldset>
            </form>
        );
    }
}

class PlayedSecretMoveSate extends React.Component {
    render() {
        return (
            <div>
                <h3> Waiting on player 2 move</h3>
            </div>
        );
    }
}

class RevealMoveState extends React.Component {
    constructor(props) {
        super(props);
        this.state = { move: '0', password: ''};
        this.handleMoveChange = this.handleMoveChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleMoveChange(event) {
        this.setState({ move: event.target.value });
    }

    handlePasswordChange(e) {
        this.setState({ password: e.target.value });
    }

    handleSubmit(event) {
        this.props.onRevealMove(this.props.gameAddress, this.props.cost);
        event.preventDefault();
    }


    render() {
        return (
            <div>
                <form className="pure-form" onSubmit={this.handleSubmit}>
                    <fieldset>
                        <select id="move" onChange={this.handleMoveChange}>
                            <option value='1'>Rock</option>
                            <option value='2'>Paper</option>
                            <option value='3'>Scissors</option>
                        </select>
                        <input onChange={this.handlePasswordChange} placeholder="Clear-text password " />
                        <button type="submit" className="pure-button pure-button-primary">Reveal Move</button>
                    </fieldset>
                </form>
            </div>
        )
    }
}

class FinishedState extends React.Component {
    render() {
        return (
            <div>
                <h2> Player 1 wins 1000 </h2>
            </div>
        )
    }
}

export default MyGames;

    // Show players in game created


    // Reqs
    // 1. Select a move and play
    // 2. Reveal a move 
    // 3. Cancel game
    // 4. See result
    // 5. See other person revealed move
    //
    // Player | Joined | SecretMove | Revealed Move |

    // Play Move: move|Dropdown  - password|inputfield 
    //    Calls create move - waits and then plays the move auto

    // Reveal Move: move|Dropdown  - password|inputfield
    //     Calls reveal 

    // Cancel Game Button

    // Result Component - <h2> Result  - win/tie 
