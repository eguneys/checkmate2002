export type Puzzle = {
  id: string,
  fen: string,
  moves: string,
  tags: Record<string, true>,
  has_tags: Record<string, true>,
  has_pattern: Record<string, true>
}

export type Pattern = { name: string, pattern: string }