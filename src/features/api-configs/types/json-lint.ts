import type { ApiConfiguration } from './api-configuration'

export type LintSeverity = 'error' | 'warning'

export interface LintProblem {
  severity: LintSeverity
  message: string
  /** Location in the JSON document, e.g. "paths.users[0].statusCode" ("" = root). */
  path?: string
  /** Offset in the text, used to move the cursor to the problem. */
  offset: number
  /** 1-based. */
  line: number
  /** 1-based. */
  column: number
}

export interface LintResult {
  /** Sorted by position. */
  problems: LintProblem[]
  /**
   * The parsed configuration when the JSON is well-formed and has the right
   * shape (it can be applied to the form, even if business rules fail);
   * null otherwise.
   */
  config: ApiConfiguration | null
}
