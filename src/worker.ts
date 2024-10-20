import { hopefox } from 'hopefox'
import { Chess, parseUci } from "hopefox"
import { makeFen, parseFen } from "hopefox/fen"
import { Pattern, Puzzle, puzzle_all_tags } from "./puzzles"
import tenk from './assets/tenk_puzzle.csv?raw'

let puzzles: Puzzle[] = []
let filter: string | undefined = undefined
let patterns: Pattern[] = []

let dirty_patterns = true

const init = async () => {

  puzzles = await fetch_puzzles()
  dirty_patterns = true
  clear_progress()
  send_puzzles()


}

const set_patterns = (ps: Pattern[]) => {
  patterns = ps
  dirty_patterns = true

  send_puzzles()
}



//export const fetch_puzzles = () => fetch('./data/tenk_puzzle.csv').then(_ => _.text()).then(parsePuzzles)
const fetch_puzzles = async () => parsePuzzles(tenk)

const parsePuzzles = (text: string): Puzzle[] => {
  let res = text.trim().split('\n')
  return res.map((_, i) => {
    send_progress(i, res.length)
    let [id, fen, moves, _a, _b, _c, _d, _tags] = _.split(',')

    let pos = Chess.fromSetup(parseFen(fen).unwrap()).unwrap()

    moves.split(' ').forEach(uci => {
      pos.play(parseUci(uci)!)
    })

    fen = makeFen(pos.toSetup())

    let has_tags: Record<string, true> = {}
    let has_pattern: Record<string, true> = {}

    let tags: Record<string, true> = {}
    _tags.split(' ').forEach(_ => tags[_] = true)

    return {
      id,
      fen,
      moves,
      tags,
      has_tags,
      has_pattern
    }
  })
}

const yn_filter = (filter: string) => {
  return (puzzle: Puzzle) => {
    let all_tags = puzzle_all_tags(puzzle)
    let [y,n] = filter.split('_!_').map(_ => _.trim())

    let ys = y === '' ? [] : y.split(' ')

    if (n) {

      let ns = n.split(' ')

      if (ns.find(_ => all_tags[_])) {
        return false
      }
    }

    return ys.every(y => all_tags[y])
  }

}

function send_progress(i: number, t: number) {
  postMessage({t: 'progress', d: [i, t]})
}

function clear_progress() {
  postMessage({ t: 'progress' })
}


const filter_puzzles = (_filter?: string) => {
  filter = _filter
  send_puzzles()
}

const send_puzzles = () => {

  if (dirty_patterns) {
    for (let i = 0; i < puzzles.length; i++) {
      let puzzle = puzzles[i]
      if (i % 500 === 0) send_progress(i, puzzles.length)
      let has_pattern = puzzle.has_pattern
      puzzle.has_pattern = {}
      for (let pattern of patterns) {
        puzzle.has_pattern[pattern.pattern] = true
        if (!has_pattern[pattern.pattern]) {
          let compute = hopefox(puzzle.fen, pattern.pattern)
          if (compute) {
            puzzle.has_tags[pattern.name] = compute
          } else {
            delete puzzle.has_tags[pattern.name]
          }
        }
      }
    }
    dirty_patterns = false
  }

  let all = puzzles
  let filtered = filter ? puzzles.filter(yn_filter(filter)) : puzzles
  postMessage({ t: 'puzzles', d: { all, filtered }})
  clear_progress()
}

onmessage = (e) => {
    switch (e.data.t) {
      case 'filter': {
        filter_puzzles(e.data.d)
      } break
      case 'patterns': {
        set_patterns(e.data.d)
      } break
    }

}


init()