import {
  findProperty,
  JsonSyntaxError,
  offsetToLineColumn,
  parseJsonAst,
  toPlainValue,
  type JsonValueNode,
} from '../../../utils'
import type { ApiConfiguration } from '../types/api-configuration'
import type { LintProblem, LintResult, LintSeverity } from '../types/json-lint'
import { configToForm, HTTP_METHODS } from './form-model'
import { validateForm } from './validation'

// Lints the JSON tab of the config editor in three passes:
//  1. syntax   – position-aware parse (src/utils/json-ast.ts)
//  2. shape    – field types mirroring the backend serializers (ApiConfiguration)
//  3. rules    – the same validateForm() used by the Form tab, mapped back to JSON paths
// Only syntax/shape errors block "Apply to form"; rule errors are shown in both tabs.

type ValueKind = JsonValueNode['kind']

const KIND_LABEL: Record<ValueKind, string> = {
  object: 'an object',
  array: 'an array',
  string: 'a string',
  number: 'a number',
  boolean: 'a boolean',
  null: 'null',
}

const STRING_OR_NULL: ValueKind[] = ['string', 'null']

/** Top-level fields: allowed kinds and whether they are required. */
const ROOT_FIELDS: Record<string, { kinds: ValueKind[]; required?: boolean }> = {
  name: { kinds: ['string'], required: true },
  description: { kinds: STRING_OR_NULL },
  termsOfService: { kinds: STRING_OR_NULL },
  version: { kinds: STRING_OR_NULL },
  secured: { kinds: ['boolean'] },
  authConfig: { kinds: STRING_OR_NULL },
  contact: { kinds: ['object'] },
  license: { kinds: ['object'] },
  paths: { kinds: ['object'], required: true },
}

const CONTACT_FIELDS = ['name', 'url', 'email']
const LICENSE_FIELDS = ['name', 'url']

/** Fields of one method definition under paths.<operation>[i]. */
const METHOD_FIELDS: Record<string, { kinds: ValueKind[]; required?: boolean }> = {
  method: { kinds: ['string'], required: true },
  statusCode: { kinds: ['number'], required: true },
  body: { kinds: STRING_OR_NULL },
  headers: { kinds: ['object', 'null'] },
}

function childPath(parent: string, key: string | number): string {
  if (typeof key === 'number') return `${parent}[${key}]`
  if (/^[A-Za-z_$][\w$]*$/.test(key)) return parent ? `${parent}.${key}` : key
  return `${parent}[${JSON.stringify(key)}]`
}

function expected(kinds: ValueKind[]): string {
  return kinds.map((k) => KIND_LABEL[k]).join(' or ')
}

/** Lint the editor's JSON text. Pure and synchronous; safe to run on every change. */
export function lintConfigJson(text: string): LintResult {
  const problems: LintProblem[] = []

  const report = (severity: LintSeverity, message: string, offset: number, path?: string) => {
    problems.push({ severity, message, path, offset, ...offsetToLineColumn(text, offset) })
  }

  // 1. Syntax
  let root: JsonValueNode
  try {
    root = parseJsonAst(text)
  } catch (e) {
    if (e instanceof JsonSyntaxError) {
      report('error', e.message, e.offset)
      return { problems, config: null }
    }
    throw e
  }

  // 2. Shape
  checkDuplicateKeys(root, '', report)

  if (root.kind !== 'object') {
    report('error', `The configuration must be a JSON object ({ … }), not ${KIND_LABEL[root.kind]}.`, root.start)
    return { problems, config: null }
  }

  const checkKind = (
    node: JsonValueNode,
    kinds: ValueKind[],
    path: string,
    hint = '',
  ): boolean => {
    if (kinds.includes(node.kind)) return true
    report('error', `Expected ${expected(kinds)}, but found ${KIND_LABEL[node.kind]}.${hint}`, node.start, path)
    return false
  }

  const checkStringFields = (node: JsonValueNode, allowed: string[], path: string) => {
    if (node.kind !== 'object') return
    for (const prop of node.properties) {
      const propPath = childPath(path, prop.key)
      if (!allowed.includes(prop.key)) {
        report('warning', `Unknown property "${prop.key}"; it is ignored. Expected: ${allowed.join(', ')}.`, prop.keyStart, propPath)
      } else {
        checkKind(prop.value, ['string'], propPath)
      }
    }
  }

  for (const prop of root.properties) {
    const spec = ROOT_FIELDS[prop.key]
    if (!spec) {
      report(
        'warning',
        `Unknown property "${prop.key}"; it is ignored. Expected: ${Object.keys(ROOT_FIELDS).join(', ')}.`,
        prop.keyStart,
        prop.key,
      )
      continue
    }
    if (!checkKind(prop.value, spec.kinds, prop.key)) continue
    if (prop.key === 'contact') checkStringFields(prop.value, CONTACT_FIELDS, 'contact')
    if (prop.key === 'license') checkStringFields(prop.value, LICENSE_FIELDS, 'license')
  }
  for (const [key, spec] of Object.entries(ROOT_FIELDS)) {
    if (spec.required && !findProperty(root, key)) {
      report('error', `Missing required property "${key}".`, root.start, key)
    }
  }

  const pathsNode = findProperty(root, 'paths')?.value
  if (pathsNode?.kind === 'object') {
    for (const operation of pathsNode.properties) {
      const opPath = childPath('paths', operation.key)
      if (!checkKind(operation.value, ['array'], opPath, ' List the method definitions, e.g. [{ "method": "GET", "statusCode": 200 }].')) {
        continue
      }
      if (operation.value.kind !== 'array') continue // narrowed for TS; checkKind reported it
      operation.value.items.forEach((item, index) => {
        const itemPath = childPath(opPath, index)
        if (!checkKind(item, ['object'], itemPath) || item.kind !== 'object') return
        for (const field of item.properties) {
          const fieldPath = childPath(itemPath, field.key)
          const spec = METHOD_FIELDS[field.key]
          if (!spec) {
            report('warning', `Unknown property "${field.key}"; it is ignored. Expected: ${Object.keys(METHOD_FIELDS).join(', ')}.`, field.keyStart, fieldPath)
            continue
          }
          const valueKind = field.value.kind
          const hint =
            field.key === 'body' && (valueKind === 'object' || valueKind === 'array')
              ? ' To return JSON, put it inside a string, e.g. "{\\"id\\": 1}".'
              : field.key === 'statusCode' && valueKind === 'string'
                ? ' Remove the quotes, e.g. 200.'
                : ''
          if (!checkKind(field.value, spec.kinds, fieldPath, hint)) continue
          if (field.key === 'method' && field.value.kind === 'string') {
            const method = field.value.value as string
            const known: readonly string[] = HTTP_METHODS
            if (method.trim() && !known.includes(method.trim().toUpperCase())) {
              report('warning', `Unknown HTTP method "${method}". Supported: ${HTTP_METHODS.join(', ')}.`, field.value.start, fieldPath)
            }
          }
          if (field.key === 'headers' && field.value.kind === 'object') {
            for (const header of field.value.properties) {
              const headerPath = childPath(fieldPath, header.key)
              if (
                !checkKind(header.value, ['array'], headerPath, ' Wrap the value in a list, e.g. ["value"].') ||
                header.value.kind !== 'array'
              ) {
                continue
              }
              header.value.items.forEach((v, i) => checkKind(v, ['string'], childPath(headerPath, i)))
            }
          }
        }
        for (const [key, spec] of Object.entries(METHOD_FIELDS)) {
          if (spec.required && !findProperty(item, key)) {
            report('error', `Missing required property "${key}".`, item.start, childPath(itemPath, key))
          }
        }
      })
    }
  }

  if (problems.some((p) => p.severity === 'error')) {
    return { problems: sortProblems(problems), config: null }
  }

  // 3. Business rules (shared with the Form tab)
  const config = toPlainValue(root) as ApiConfiguration
  const operationNames = Object.keys(config.paths)
  const errors = validateForm(configToForm(config))

  for (const [key, message] of Object.entries(errors)) {
    const opMatch = /^op:(\d+):(?:(name|methods)|m:(\d+):(method|statusCode))$/.exec(key)
    if (!opMatch) {
      const target =
        key === 'operations'
          ? findProperty(root, 'paths')
          : findProperty(root, key) ?? (key === 'authConfig' ? findProperty(root, 'secured') : undefined)
      report('error', message, target?.value.start ?? root.start, key === 'operations' ? 'paths' : key)
      continue
    }
    const [, opIndex, opField, methodIndex, methodField] = opMatch
    const opName = operationNames[Number(opIndex)]
    // configToForm adds a blank operation when paths is empty; that is already
    // reported by the "operations" rule.
    if (opName === undefined) continue
    const opProp = findProperty(pathsNode, opName)
    const opPath = childPath('paths', opName)
    if (opField === 'name') {
      report('error', message, opProp?.keyStart ?? root.start, opPath)
    } else if (opField === 'methods') {
      report('error', message, opProp?.value.start ?? root.start, opPath)
    } else {
      const item = opProp?.value.kind === 'array' ? opProp.value.items[Number(methodIndex)] : undefined
      const fieldNode = findProperty(item, methodField)?.value
      report('error', message, fieldNode?.start ?? item?.start ?? root.start, childPath(childPath(opPath, Number(methodIndex)), methodField))
    }
  }

  return { problems: sortProblems(problems), config }
}

function checkDuplicateKeys(
  node: JsonValueNode,
  path: string,
  report: (severity: LintSeverity, message: string, offset: number, path?: string) => void,
) {
  if (node.kind === 'array') {
    node.items.forEach((item, i) => checkDuplicateKeys(item, childPath(path, i), report))
    return
  }
  if (node.kind !== 'object') return
  const seen = new Set<string>()
  for (const prop of node.properties) {
    const propPath = childPath(path, prop.key)
    if (seen.has(prop.key)) {
      report('warning', `Duplicate key "${prop.key}"; only the last one is kept.`, prop.keyStart, propPath)
    }
    seen.add(prop.key)
    checkDuplicateKeys(prop.value, propPath, report)
  }
}

function sortProblems(problems: LintProblem[]): LintProblem[] {
  return problems.slice().sort((a, b) => a.offset - b.offset)
}
