import { Color, Key } from 'chessground/types'
import './App.css'
import Chessboard from './Chessboard'
import { createEffect, createMemo, createSignal, For, mapArray, on, Show, Signal, useContext } from 'solid-js'
import { MyWorkerContext, MyWorkerProvider } from './Worker'
import { Puzzle } from './puzzles'

function App() {
  return (<>
    <MyWorkerProvider>
      <WithWorker />
    </MyWorkerProvider>
  </>)
}

function WithWorker() {

  const [selected_fen, set_selected_fen] = createSignal<string | undefined>()

  return (<>
  
  <div class='checkmate-2002'>
      <Board fen={selected_fen()}/>
      <Pattern />
      <Puzzles on_selected_fen={set_selected_fen}/>
  </div>
  </>)
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
    return this._has_tags[0]()
  }

  get all_tags() {
    return [...this.tags, ...this.has_tags]
  }

  add_tag(_: string) {
    this._has_tags[1]([...this.has_tags.filter(_ => _ !== _), _])
  }

  remove_tag(_: string) {
    this._has_tags[1](this.has_tags.filter(_ => _ !== _))
  }

  _has_tags: Signal<string[]> = createSignal<string[]>([])

  private constructor(readonly puzzle: Puzzle) {}
}


const Puzzles = (props: { on_selected_fen: (_: string) => void }) => {

  let ctx = useContext(MyWorkerContext)!

  const progress = createMemo(() => ctx.progress())

  const [filter, set_filter] = createSignal<string | undefined>()

  const filtered = createMemo(mapArray(() => ctx.puzzles(), PuzzleMemo.create))

  const [i_selected, set_i_selected] = createSignal(0)

  const selected_fen = createMemo(() => filtered()[i_selected()]?.fen)

  createEffect(on(selected_fen, (fen) => {
    if (fen) {
      props.on_selected_fen(fen)
    }
  }))

  createEffect(on(filter, f => {
    ctx.filter_puzzles(f)
  }))


  let $el_filter: HTMLInputElement

  const on_filter_change = (filter: string) => {
    set_filter(filter)
  }

  return (
      <div class='puzzles'>
        <div class='filter'>
          <input onInput={() => on_filter_change($el_filter.value)} ref={_ => $el_filter = _} type="text" placeholder="Filter y_filter _!_ n_filter"></input>
          <span>{filtered().length}/{10000} Positions</span>
        </div>
        <div class='list'>
      <Show when={filtered()}>{ puzzles => 
        <For each={puzzles().slice(0, 1000)}>{(puzzle, i) => 
            <div onClick={() => set_i_selected(i())} class={'puzzle' + (i() === i_selected() ? ' active' : '')}>
              <span class='id'><a target="_blank" href={`https://lichess.org/training/${puzzle.id}`}>{puzzle.id}</a></span>
              <span class='has-tags'><For each={puzzle.has_tags}>{tag => <span class='tag'>{tag}</span>}</For></span>
              <span class='tags'><For each={puzzle.tags}>{tag => <span class='tag'>{tag}</span>}</For></span>
            </div>
        }</For>
      }</Show>
      </div>
      <Show when={progress()}>{progress => 
        <div class='progress'> {progress()[0]}/{progress()[1]} </div>
      }</Show>
      </div>
  )
}

const Pattern = () => {
  return (
    <div class='pattern'>

    </div>
  )
}

const Board = (props: { fen?: string }) => {

  const color = createMemo<Color>(() => 'white')

  const on_move_after = (orig: Key, dest: Key) => {
    console.log(orig, dest)
  }


  return (
    <div class='board'>
      <div class='buttons'>
        <button>Flip Colors</button>
      </div>
      <div class='b-wrap'>
        <Chessboard fen_uci={props.fen ? [props.fen, undefined] : undefined} doPromotion={undefined} color={color()} dests={new Map()} onMoveAfter={on_move_after} />
      </div>
    </div>
  )
}

export default App
