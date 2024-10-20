import { hopefox } from 'hopefox'
import { Chess, parseUci } from "hopefox"
import { makeFen, parseFen } from "hopefox/fen"
import { Pattern, Puzzle } from "./puzzles"

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
    let has_pattern: string[] = []

    return {
      id,
      fen,
      moves,
      tags: tags.split(' '),
      has_tags,
      has_pattern
    }
  })
}

const puzzle_all_tags = (puzzle: Puzzle) => [...puzzle.tags, ...puzzle.has_tags]


const yn_filter = (filter: string) => {
  return (puzzle: Puzzle) => {
    let all_tags = puzzle_all_tags(puzzle)
    let [y,n] = filter.split('_!_').map(_ => _.trim())

    let ys = y === '' ? [] : y.split(' ')

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


const filter_puzzles = (_filter?: string) => {
  filter = _filter
  send_puzzles()
}

const send_puzzles = () => {


  if (dirty_patterns) {
    puzzles.forEach((puzzle, i) => {
      send_progress(i, puzzles.length)
      let has_pattern = puzzle.has_pattern
      puzzle.has_tags = []
      puzzle.has_pattern = []
      patterns.forEach(pattern => {
        if (has_pattern.includes(pattern.pattern) || hopefox(puzzle.fen, pattern.pattern)) {
          puzzle.has_tags.push(pattern.name)
          puzzle.has_pattern.push(pattern.pattern)
          if (!puzzle.has_tags.includes('has_tag')) {
            puzzle.has_tags.push('has_tag')
          }
        }
      })
    })
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