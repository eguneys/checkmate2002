import { Chess, parseUci } from "hopefox"
import { makeFen, parseFen } from "hopefox/fen"
import { Puzzle } from "./puzzles"

export const fetch_puzzles = () => fetch('/data/tenk_puzzle.csv').then(_ => _.text()).then(parsePuzzles)

const parsePuzzles = (text: string): Puzzle[] => {
  let res = text.trim().split('\n')
  return res.map((_, i) => {
    send_progress(i, res.length)
    let [id, fen, moves, _a, _b, _c, _d, tags] = _.split(',')

    let pos = Chess.fromSetup(parseFen(fen).unwrap()).unwrap()

    moves.split(' ').forEach(uci => {
      pos.play(parseUci(uci)!)
    })

    fen = makeFen(pos.toSetup())

    let has_tags: string[] = []

    return {
      id,
      fen,
      moves,
      tags: tags.split(' '),
      has_tags
    }
  })
}

const puzzle_all_tags = (puzzle: Puzzle) => [...puzzle.tags, ...puzzle.has_tags]


const yn_filter = (filter: string) => {
  return (puzzle: Puzzle) => {
    let all_tags = puzzle_all_tags(puzzle)
    let [y,n] = filter.split('_!_').map(_ => _.trim())

    let ys = y.split(' ')

    if (n) {

      let ns = n.split(' ')

      if (all_tags.find(_ => ns.includes(_))) {
        return false
      }
    }

    return ys.every(y => all_tags.includes(y))
  }

}

function send_progress(i: number, t: number) {
  postMessage({t: 'progress', d: [i, t]})
}

function clear_progress() {
  postMessage({ t: 'progress' })
}

let filter: string | undefined = undefined

const filter_puzzles = (_filter?: string) => {
  filter = _filter
  send_puzzles()
}

const send_puzzles = () => {
  let d = filter ? puzzles.filter(yn_filter(filter)) : puzzles
  postMessage({ t: 'puzzles', d})
}

onmessage = (e) => {
    switch (e.data.t) {
        case 'filter': {
            filter_puzzles(e.data.d)
        }
    }

}

let puzzles = await fetch_puzzles()
clear_progress()
send_puzzles()

