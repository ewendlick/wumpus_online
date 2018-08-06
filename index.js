const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const chalk = require('chalk')
const port = process.env.PORT || 3000

// TODO: sort this out with 'app'
const express = require('express')

const map = require('./maps/map')


let PLAYERS = []
let ALLOWED_PLAYERS = [0, 1] // change to a number, ALLOWED_PLAYER_COUNT
let getPlayersTurn = () => { return ALLOWED_PLAYERS[turnCounter % ALLOWED_PLAYERS.length] }
let turnCounter = 0

// TODO: Should this be redone?
const LEFT = 37
const UP = 38
const RIGHT = 39
const DOWN = 40
const ALLOWED_KEY_CODES = [LEFT, UP, RIGHT, DOWN]

const BASIC_MAP = map.basic

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})
app.use(express.static('static'))


io.on('connection', socket => {
  console.log(chalk.blue('〇 A user connected with socket ID' + socket.id))
  socket.on('disconnect', () => {
    console.log(chalk.red('× A user disconnected with socket ID' + socket.id))
  })
})

io.on('connection', (socket) => {
  // Create a user and give them a socket.id
  PLAYERS.push({ id: socket.id,
                 x: 1,
                 y: 1,
                 remainingArrows: 2 })

  // "Constructor"
  io.emit('map', BASIC_MAP)
  io.emit('players', PLAYERS)
  io.emit('turn', playersTurn())

  socket.on('client key down', (msg) => {
    if (acceptInput(socket.id)) {
      handleInput(socket.id, msg)
      console.log(chalk.green(`Accepted input from: ${socket.id}`))
      io.emit('players', PLAYERS)
      io.emit('turn', playersTurn())
    } else {
      // Testing purposes
      console.log(chalk.red(`Rejected input from: ${socket.id}`))
    }
  })

  socket.on('disconnect', () => {
    PLAYERS = PLAYERS.filter(player => {
      return player.id !== socket.id
    })
    console.log(chalk.red(PLAYERS.length + ' players'))
  })
})

http.listen(port, () => {
  console.log('Express is running and listening on *:' + port);
})

// TODO: user names?
// We are checking against socketId when we don't need to.
function playersTurn () {
  return `Player ${getPlayersTurn() + 1}'s turn`

  // TODO: it would be nice if this said "your turn"
  // const currentPlayerIndex = PLAYERS.findIndex(player => {
  //   return player.id === socketId
  // })
  // const turn = getPlayersTurn()
  // console.log('turn ' + turn + ' currentPlayerIndex ' + currentPlayerIndex)
  // if (currentPlayerIndex === turn) {
  //   console.log('a')
  //   return 'Your turn'
  // } else {
  //   console.log('b')
  //   return `Player ${turn + 1}'s turn`
  // }
}

function acceptInput (socketId) {
  // Check if the socket.id is in the list. We only allow two players.
  // TODO: may need to reevaluate this: do we need to check if the socket id matches the first two players
  // if we are checking against players that are allowed to play?
  return PLAYERS[1] !== undefined &&
    (socketId === PLAYERS[0].id || socketId === PLAYERS[1].id) &&
    PLAYERS[getPlayersTurn()].id === socketId
}

function handleInput(socketId, keyCode) {
  if (!ALLOWED_KEY_CODES.includes(keyCode)) {
    console.log('Keycode not allowed')
    return
  }

  const moveable = ' ><' // moveable squares
  // TODO: implement movement impedement
  const player = PLAYERS.find(player => {
    return player.id === socketId
  })

  if (keyCode === LEFT && moveable.includes(BASIC_MAP[player.y][player.x - 1])) {
    console.log('left')
    PLAYERS[PLAYERS.findIndex(player => player.id === socketId)].x--
    turnCounter++
  } else if (keyCode === UP && moveable.includes(BASIC_MAP[player.y - 1][player.x])) {
    console.log('up')
    PLAYERS[PLAYERS.findIndex(player => player.id === socketId)].y--
    turnCounter++
  } else if (keyCode === RIGHT && moveable.includes(BASIC_MAP[player.y][player.x + 1])) {
    console.log('right')
    PLAYERS[PLAYERS.findIndex(player => player.id === socketId)].x++
    turnCounter++
  } else if (keyCode === DOWN && moveable.includes(BASIC_MAP[player.y + 1][player.x])) {
    console.log('down')
    PLAYERS[PLAYERS.findIndex(player => player.id === socketId)].y++
    turnCounter++
  } else {
    // Do nothing. Do not update the turn counter
  }
}
