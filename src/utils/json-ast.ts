// Minimal JSON parser that keeps source offsets for every value, so tools such
// as linters can point at the exact line/column of a problem. JSON.parse only
// returns values and its error messages (and positions) differ per browser.

interface JsonNodeBase {
  /** Offset of the first character of the value. */
  start: number
  /** Offset just past the last character of the value. */
  end: number
}

export interface JsonObjectNode extends JsonNodeBase {
  kind: 'object'
  /** In source order; duplicate keys are kept (JSON.parse keeps only the last). */
  properties: JsonPropertyNode[]
}

export interface JsonPropertyNode {
  key: string
  keyStart: number
  value: JsonValueNode
}

export interface JsonArrayNode extends JsonNodeBase {
  kind: 'array'
  items: JsonValueNode[]
}

export interface JsonPrimitiveNode extends JsonNodeBase {
  kind: 'string' | 'number' | 'boolean' | 'null'
  value: string | number | boolean | null
}

export type JsonValueNode = JsonObjectNode | JsonArrayNode | JsonPrimitiveNode

export class JsonSyntaxError extends Error {
  readonly offset: number
  constructor(message: string, offset: number) {
    super(message)
    this.name = 'JsonSyntaxError'
    this.offset = offset
  }
}

const WHITESPACE = ' \t\n\r'
const NUMBER_PATTERN = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y
const ESCAPES: Record<string, string> = {
  '"': '"',
  '\\': '\\',
  '/': '/',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
}

/** Parse `text` into an AST. Throws JsonSyntaxError with the failing offset. */
export function parseJsonAst(text: string): JsonValueNode {
  let pos = 0

  const fail = (message: string, at = pos): never => {
    throw new JsonSyntaxError(message, at)
  }
  const describe = () => {
    if (pos >= text.length) return 'end of input'
    const ch = text[pos]
    return ch === '\n' || ch === '\r' ? 'a line break' : `'${ch}'`
  }
  const skipWhitespace = () => {
    while (pos < text.length && WHITESPACE.includes(text[pos])) pos++
  }

  const parseString = (): string => {
    const start = pos
    pos++ // opening quote
    let out = ''
    while (true) {
      if (pos >= text.length) fail('Unterminated string.', start)
      const ch = text[pos]
      if (ch === '"') {
        pos++
        return out
      }
      if (ch === '\\') {
        const next = text[pos + 1]
        if (next === 'u') {
          const hex = text.slice(pos + 2, pos + 6)
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) fail('Invalid unicode escape; expected \\u followed by 4 hex digits.')
          out += String.fromCharCode(parseInt(hex, 16))
          pos += 6
        } else if (next !== undefined && next in ESCAPES) {
          out += ESCAPES[next]
          pos += 2
        } else {
          fail(`Invalid escape sequence "\\${next ?? ''}" in string.`)
        }
        continue
      }
      if (ch.charCodeAt(0) < 0x20) {
        fail('Line breaks and control characters must be escaped inside strings (use \\n).')
      }
      out += ch
      pos++
    }
  }

  const parseValue = (): JsonValueNode => {
    skipWhitespace()
    const start = pos
    const ch = text[pos]

    if (ch === '{') return parseObject()
    if (ch === '[') return parseArray()
    if (ch === '"') {
      const value = parseString()
      return { kind: 'string', value, start, end: pos }
    }
    if (ch === '-' || (ch >= '0' && ch <= '9')) {
      NUMBER_PATTERN.lastIndex = pos
      const match = NUMBER_PATTERN.exec(text)
      if (!match) return fail('Invalid number.')
      pos += match[0].length
      return { kind: 'number', value: Number(match[0]), start, end: pos }
    }
    for (const [word, value] of [['true', true], ['false', false], ['null', null]] as const) {
      if (text.startsWith(word, pos)) {
        pos += word.length
        return { kind: value === null ? 'null' : 'boolean', value, start, end: pos }
      }
    }
    if (ch === "'") return fail('Strings must use double quotes (").')
    return fail(`Unexpected ${describe()}; expected a value.`)
  }

  const parseObject = (): JsonObjectNode => {
    const start = pos
    pos++ // {
    const properties: JsonPropertyNode[] = []
    skipWhitespace()
    if (text[pos] === '}') {
      pos++
      return { kind: 'object', properties, start, end: pos }
    }
    while (true) {
      skipWhitespace()
      if (text[pos] !== '"') fail(`Expected a property name in double quotes but found ${describe()}.`)
      const keyStart = pos
      const key = parseString()
      const keyEnd = pos
      skipWhitespace()
      // Missing separators are reported where they belong (right after the previous
      // token), not at the next token, which may be on a later line.
      if (text[pos] !== ':') fail(`Expected ':' after property name "${key}" but found ${describe()}.`, keyEnd)
      pos++
      const value = parseValue()
      properties.push({ key, keyStart, value })
      skipWhitespace()
      if (text[pos] === ',') {
        const comma = pos
        pos++
        skipWhitespace()
        if (text[pos] === '}') fail('Trailing commas are not allowed in JSON.', comma)
        continue
      }
      if (text[pos] === '}') {
        pos++
        return { kind: 'object', properties, start, end: pos }
      }
      fail(`Expected ',' or '}' after the value of "${key}" but found ${describe()}.`, value.end)
    }
  }

  const parseArray = (): JsonArrayNode => {
    const start = pos
    pos++ // [
    const items: JsonValueNode[] = []
    skipWhitespace()
    if (text[pos] === ']') {
      pos++
      return { kind: 'array', items, start, end: pos }
    }
    while (true) {
      const item = parseValue()
      items.push(item)
      skipWhitespace()
      if (text[pos] === ',') {
        const comma = pos
        pos++
        skipWhitespace()
        if (text[pos] === ']') fail('Trailing commas are not allowed in JSON.', comma)
        continue
      }
      if (text[pos] === ']') {
        pos++
        return { kind: 'array', items, start, end: pos }
      }
      fail(`Expected ',' or ']' in array but found ${describe()}.`, item.end)
    }
  }

  skipWhitespace()
  if (pos >= text.length) fail('The document is empty.')
  const root = parseValue()
  skipWhitespace()
  if (pos < text.length) fail(`Unexpected ${describe()} after the end of the JSON value.`)
  return root
}

/** Convert an AST back to a plain value, with JSON.parse semantics (last duplicate key wins). */
export function toPlainValue(node: JsonValueNode): unknown {
  switch (node.kind) {
    case 'object':
      return Object.fromEntries(node.properties.map((p) => [p.key, toPlainValue(p.value)]))
    case 'array':
      return node.items.map(toPlainValue)
    default:
      return node.value
  }
}

/** Last property named `key` (the one JSON.parse keeps), if `node` is an object. */
export function findProperty(
  node: JsonValueNode | undefined,
  key: string,
): JsonPropertyNode | undefined {
  if (node?.kind !== 'object') return undefined
  for (let i = node.properties.length - 1; i >= 0; i--) {
    if (node.properties[i].key === key) return node.properties[i]
  }
  return undefined
}

/** 1-based line and column of `offset` in `text`. */
export function offsetToLineColumn(text: string, offset: number): { line: number; column: number } {
  let line = 1
  let lineStart = 0
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') {
      line++
      lineStart = i + 1
    }
  }
  return { line, column: offset - lineStart + 1 }
}
