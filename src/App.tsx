import { Color, Key } from 'chessground/types'
import './App.css'
import Chessboard from './Chessboard'
import { batch, createEffect, createMemo, createSignal, For, mapArray, on, Show, useContext } from 'solid-js'
import { MyWorkerContext, MyWorkerProvider } from './Worker'
import { Pattern, Puzzle, puzzle_all_tags, puzzle_has_tags } from './puzzles'
import { makePersistedNamespaced } from './persisted'
import { DrawShape } from 'chessground/draw'
import { Chess, parseSquare, Square } from 'hopefox'
import { parseFen } from 'hopefox/fen'
import { get_king_squares } from 'hopefox/squareSet'

function App() {
  return (<>
    <MyWorkerProvider>
      <WithWorker />
    </MyWorkerProvider>
  </>)
}

function WithWorker() {

  const [selected_fen, set_selected_fen] = createSignal<string | undefined>()

  const [pattern, set_pattern] = createSignal<string | undefined>()

  return (<>
  
  <div class='checkmate-2002'>
      <Board on_pattern={set_pattern} fen={selected_fen()}/>
      <PatternView pattern={pattern()} />
      <Puzzles on_selected_fen={set_selected_fen}/>

<Progress/>
  </div>
  </>)
}

const Progress = () => {

  const { progress } = useContext(MyWorkerContext)!


  return (<>
    <Show when={progress()}>{progress =>
      <div class='progress'> {progress()[0]}/{progress()[1]} </div>
    }</Show>
  </>
  )
}

class PuzzleMemo {

  static create = (puzzle: Puzzle) => {

    return new PuzzleMemo(puzzle)
  }

  get id() {
    return this.puzzle.id
  }

  get fen() {
    return this.puzzle.fen
  }

  get tags() {
    return this.puzzle.tags
  }

  get has_tags() {
    return puzzle_has_tags(this.puzzle)
  }

  get all_tags() {
    return puzzle_all_tags(this.puzzle)
  }

  private constructor(readonly puzzle: Puzzle) {}
}


const Puzzles = (props: { on_selected_fen: (_: string) => void }) => {

  let { puzzles, filter_puzzles } = useContext(MyWorkerContext)!

  const [filter, set_filter] = makePersistedNamespaced<string | undefined>(undefined, 'filter')

  const filtered = createMemo(mapArray(() => puzzles(), PuzzleMemo.create))

  const [id_selected, set_id_selected] = createSignal()

  const selected_fen = createMemo(() => filtered().find(_ => _.id === id_selected())?.fen)

  createEffect(on(selected_fen, (fen) => {
    if (fen) {
      props.on_selected_fen(fen)
    } else {
      set_id_selected(filtered()[0]?.id)
    }
  }))

  createEffect(on(filter, f => {
    filter_puzzles(f)
  }))


  let $el_filter: HTMLInputElement

  const on_filter_change = (filter: string) => {
    set_filter(filter)
  }

  return (
      <div class='puzzles'>
        <div class='filter'>
          <input spellcheck={false} value={filter()} onInput={() => on_filter_change($el_filter.value)} ref={_ => $el_filter = _} type="text" placeholder="Filter y_filter _!_ n_filter"></input>
          <span>{filtered().length}/{10000} Positions</span>
        </div>
        <div class='list'>
      <Show when={filtered()}>{ puzzles => 
        <For each={puzzles().slice(0, 1000)}>{puzzle => 
            <div onClick={() => set_id_selected(puzzle.id)} class={'puzzle' + (puzzle.id === id_selected() ? ' active' : '')}>
              <span class='id'><a target="_blank" href={`https://lichess.org/training/${puzzle.id}`}>{puzzle.id}</a></span>
              <span class='has-tags'><For each={Object.keys(puzzle.has_tags).filter(_ => !_.includes('id_'))}>{tag => <span class='tag'>{tag}</span>}</For></span>
              <span class='tags'><For each={Object.keys(puzzle.tags)}>{tag => <span class='tag'>{tag}</span>}</For></span>
            </div>
        }</For>
      }</Show>
      </div>

      </div>
  )
}


const PatternView = (props: { pattern?: string }) => {

  const { all_puzzles, set_patterns } = useContext(MyWorkerContext)!

  const default_patterns = [{ name: 'backrank', pattern: "OoOoOofnfnfnFoFoFo" }]

  const [saved_patterns, set_saved_patterns] = makePersistedNamespaced<Pattern[]>([], 'patterns')
  const patterns = createMemo(() => [...saved_patterns(), ...default_patterns])

  const [i_selected_pattern, set_i_selected_pattern] = createSignal(0)

  const selected_pattern = createMemo(() => patterns()[i_selected_pattern()])

  createEffect(on(patterns, ps => {
    set_patterns(ps)
  }))

  createEffect(on(selected_pattern, p => {
    $el_pattern_name.value = p.name
    $el_pattern.value = p.pattern
  }))

  const add_pattern = () => {
    let name = $el_pattern_name.value
    let pattern = $el_pattern.value

    // TODO remove
    name = 'backrank'

    if (!name || name.length < 3 || !pattern || pattern.length !== 18) {
      return false
    }

    if (default_patterns.find(_ => _.name === name)) {
      name += Math.random().toString(16).slice(2, 5)
    }

    batch(() => {
      set_saved_patterns([{name, pattern}, ...saved_patterns().filter(_ => _.name !== name)])
      set_i_selected_pattern(0)
    })
  }

  const delete_pattern = () => {
    let name = $el_pattern_name.value
    batch(() => {
      set_saved_patterns([...saved_patterns().filter(_ => _.name !== name)])
      set_i_selected_pattern(0)
    })
  }


  let $el_pattern_name: HTMLInputElement
  let $el_pattern: HTMLTextAreaElement

  createEffect(on(() => props.pattern, pattern => {
    if (!$el_pattern || !pattern) {
      return 
    }

    $el_pattern.value = pattern
  }))


  const has_pattern_nb = (name: string) => {
    return all_puzzles()?.filter(_ => _.has_tags[name]).length ?? 0
  }


  return (
    <div class='pattern-view'>
      <div class='list'>
        <For each={patterns()}>{(pattern, i) => 
          <div onClick={() => set_i_selected_pattern(i())} class={"pattern" + (i_selected_pattern() === i() ? ' active': '')}>
            <span class='name'>{pattern.name}</span>
            <span class='value'>{pattern.pattern}</span>
            <span class='nb'>{has_pattern_nb(pattern.name)}</span>
          </div>
        }</For>
      </div>
      <small class='nb'>{patterns().length} Patterns</small>
      <div class='controls'>
        <input class="name" ref={_ => $el_pattern_name = _} type="text" placeholder="Pattern Name"/>
        <textarea ref={_ => $el_pattern = _ } placeholder="OoOoOoFnFnFnfofofo" class="pattern" spellcheck={false} rows={3} cols={6} maxLength={18}/>
        <button onClick={add_pattern}>Add Pattern</button>
        <button onClick={delete_pattern} class='delete'>Delete</button>
      </div>
    </div>
  )
}

const Board = (props: { on_pattern: (_: string) => void, fen?: string }) => {

  const color = createMemo<Color>(() => 'white')

  const on_move_after = (orig: Key, dest: Key) => {
    console.log(orig, dest)
  }

  const copy_fen = () => {
    if (props.fen) {
      navigator.clipboard.writeText(props.fen)
    }
  }

  const on_shapes = (shapes: DrawShape[]) => {

    let ns: [Square, Square][] = []
    let os: Square[] = []
    shapes.map(_ => {
      if (_.dest === undefined) {
        os.push(parseSquare(_.orig)!)
      } else {
        ns.push([parseSquare(_.orig)!, parseSquare(_.dest)!])
      }
    })


    if (props.fen) {

      let pos = Chess.fromSetup(parseFen(props.fen).unwrap()).unwrap()

      let king = pos.board[pos.turn].intersect(pos.board.king).singleSquare()!

      let ks = get_king_squares(king)


      let pattern = ks.map(ks => {
        if (ks === undefined) {
          return `Oo`
        }


        if (os.includes(ks)) {
          let p = pos.board.get(ks)
          if (p) {

            let r = 'f' // p.role[0]
            return `${p.color === pos.turn ? r.toUpperCase() : r}o`
          }
        }

        
        let n = ns.find(_ => _[1] === ks)
        if (n) {
          let orig = n[0]

          let p = pos.board.get(orig)
          if (p) {
            let new_pos = pos.clone()
            new_pos.turn = p.color
            new_pos.board.take(king)
            if (new_pos.dests(orig).has(ks)) {
              return `${p.color === pos.turn ? 'F' : 'f'}n`
            }
          }
        }

        return `Xx`
      }).join('')

      props.on_pattern(pattern)

    }
  }

  return (
    <div class='board'>
      <div class='buttons'>
        <button>Flip Colors</button>
      </div>
      <div class='b-wrap'>
        <Chessboard onShapes={on_shapes} fen_uci={props.fen ? [props.fen, undefined] : undefined} doPromotion={undefined} color={color()} dests={new Map()} onMoveAfter={on_move_after} />
      </div>
      <div class='fen'>
        <input type='text' value={props.fen}></input> <button onClick={copy_fen}>Copy Fen</button>
      </div>
    </div>
  )
}

export default App
