import { Accessor, createContext, createSignal, JSX } from "solid-js"
import MyWorker from './worker?worker'
import { Puzzle } from "./puzzles"

type MyWorkerType = {
    error: Accessor<string | undefined>,
    progress: Accessor<[number, number] | undefined>,
    puzzles: Accessor<Puzzle[] | undefined>,
    filter_puzzles: (_?: string) => void
}

export const MyWorkerContext = createContext<MyWorkerType>()

export const MyWorkerProvider = (props: { children: JSX.Element }) => {
    let worker  = new MyWorker({})

    const [error, set_error] = createSignal<string | undefined>()
    const [progress, set_progress] = createSignal<[number, number] | undefined>()

    const [puzzles, set_puzzles] = createSignal<Puzzle[] | undefined>()

    worker.onerror = (err) => {
        set_error(err.message)
    }

    worker.onmessage = (e) => {
        switch (e.data.t) {
            case 'progress':
                set_progress(e.data.d)
                return
            case 'puzzles':
                set_puzzles(e.data.d)
                return
        }
    }


    let res = {
        error,
        progress,
        puzzles,
        filter_puzzles(filter?: string) {
            worker.postMessage({ filter })
        }
    }

    return <MyWorkerContext.Provider value={res}>
        {props.children}
    </MyWorkerContext.Provider>
}