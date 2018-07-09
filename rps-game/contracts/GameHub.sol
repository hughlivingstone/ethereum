pragma solidity ^0.4.19;

import "./RockPaperScissors.sol";

/**
 * The game hub manages the creation and joining of games.  The balances of players is also managed in this contract
 */
contract GameHub {
    event LogGameCreated(address indexed gameAddress, address indexed playerOne, address indexed playerTwo, uint cost);
    event LogPlayerJoined(address indexed gameAddress, address indexed player);
    event LogGameResult(address indexed gameAddress, address indexed playerOne, address indexed playerTwo, uint result, uint winningAmount);
    event LogFundWithdrawal(address indexed fundRecipient, uint amount);

    mapping(address => uint) gameMap;
    address[] public games;
    mapping (address => uint) public playerBalances;
    
    enum GameResult { Tied, PlayerOneWin, PlayerTwoWin}

    modifier onlyByGameContract(address gameAddress)
    {
        require(gameAddress > 0);
        uint gameLocation = gameMap[gameAddress];
        address game = games[gameLocation];
        require(game == gameAddress);
        _;
    }
    
    function createRockPaperScissorsGame(address playerOne, address playerTwo, uint cost) public returns (address) {
        require(playerOne > 0 && playerTwo > 0);
        require(playerOne != playerTwo);
        
        RockPaperScissors rpsGame = new RockPaperScissors(playerOne, playerTwo, this, cost);
        games.push(rpsGame);
        gameMap[rpsGame] = games.length - 1;

        LogGameCreated(rpsGame, playerOne, playerTwo, cost);

        return rpsGame;
    }

    /**
     * Players join a game they have been assigned to via this method.  They pay here and the Hub manages their balances so they can 
     * use their winnings for subsequent games.
     */
    function joinGame(address gameAddress) payable public returns (bool) {
        require(gameAddress > 0);
        uint gameLocation = gameMap[gameAddress];
        address storedGame = games[gameLocation];
        require(storedGame == gameAddress);
        
        RockPaperScissors rpsGame = RockPaperScissors(storedGame);
        playerBalances[msg.sender] += msg.value;
        
        uint gameCost = rpsGame.cost();
        require(playerBalances[msg.sender] >= gameCost);

        playerBalances[msg.sender] -= gameCost;

        rpsGame.playerJoined(msg.sender);
        LogPlayerJoined(gameAddress, msg.sender);

        return true;
    }

    /**
     * The Game will send the result to Hub so players balances can be amended accordingly.
     */
    function gameResult(address gameAddress, address playerOne, address playerTwo, GameResult result, uint cost) 
        public
        onlyByGameContract(msg.sender) 
        returns (bool) {        
        uint resultAmount = cost * 2;
        
        if (result == GameResult.Tied) {
            playerBalances[playerOne] += cost;
            playerBalances[playerTwo] += cost;
            // tied so each player gets the cost back
            resultAmount = cost;
        } else if(result == GameResult.PlayerOneWin) {
            playerBalances[playerOne] += resultAmount;
        } else if (result == GameResult.PlayerTwoWin) {
            playerBalances[playerTwo] += resultAmount;
        } else {
            revert();
        }
    
        LogGameResult(gameAddress, playerOne, playerTwo, uint(result), resultAmount);
        return true;
    }

    function widthdrawFund() public returns (bool) {
        uint balance = playerBalances[msg.sender];
        require(balance > 0);
        playerBalances[msg.sender] = 0;
        LogFundWithdrawal(msg.sender, balance);
        msg.sender.transfer(balance);
        
        return true;
    }
}