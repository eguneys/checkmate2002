export type Puzzle = {
  id: string,
  fen: string,
  moves: string,
  tags: string[],
  has_tags: string[]
}

export type Pattern = { name: string, pattern: string }