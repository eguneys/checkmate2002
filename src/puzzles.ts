export type Puzzle = {
  id: string,
  fen: string,
  moves: string,
  tags: Record<string, true>,
  has_tags: Record<string, boolean>,
  has_pattern: Record<string, true>
}

export type Pattern = { name: string, pattern: string }

export const puzzle_has_tags = (puzzle: Puzzle): Record<string, boolean> => {
  let nb_tags = Object.keys(puzzle.has_tags).length
  return { ...puzzle.has_tags, "has_tag": nb_tags > 0, "single_tag": nb_tags > 1 }
}

export const puzzle_all_tags = (puzzle: Puzzle): Record<string, boolean> => {
  return { ...puzzle.tags, ...puzzle_has_tags(puzzle) }
}
