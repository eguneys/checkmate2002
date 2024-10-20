export type Puzzle = {
  id: string,
  fen: string,
  moves: string,
  tags: string[],
  has_tags: string[],
  has_pattern: string[]
}

export type Pattern = { name: string, pattern: string }