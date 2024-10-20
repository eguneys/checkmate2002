export type Puzzle = {
  id: string,
  fen: string,
  moves: string,
  tags: Record<string, true>,
  has_tags: Record<string, true>,
  has_pattern: Record<string, true>
}

export type Pattern = { name: string, pattern: string }

export const puzzle_has_tags = (puzzle: Puzzle): Record<string, true> => {
  let nb_tags = Object.keys(puzzle.has_tags).length
  let res = { ... puzzle.has_tags }
  if (nb_tags > 0) {
    res.has_tag = true
    if (nb_tags === 1) {
      res.single_tag = true
    } else {
      res.many_tags = true
    }
  }
  res[`id_${puzzle.id}`] = true
  return res
}

export const puzzle_all_tags = (puzzle: Puzzle): Record<string, boolean> => {
  return { ...puzzle.tags, ...puzzle_has_tags(puzzle) }
}
