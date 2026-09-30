import type { ConfigForm } from './formModel'

// Client-side validation mirroring the backend ApiConfigurationValidator, but
// returning per-field errors keyed by a path so the form can show them inline.
// Keys: "name", "authConfig", "operations", `op:${i}:name`, `op:${i}:methods`,
// `op:${i}:m:${j}:method`, `op:${i}:m:${j}:statusCode`.

export type ValidationErrors = Record<string, string>

function isBlank(value: string): boolean {
  return value.trim().length === 0
}

export function validateForm(form: ConfigForm): ValidationErrors {
  const errors: ValidationErrors = {}

  // 1. name required
  if (isBlank(form.name)) {
    errors['name'] = 'Name is required.'
  }

  // 2. at least one operation (with a name)
  const namedOperations = form.operations.filter((op) => !isBlank(op.name))
  if (namedOperations.length === 0) {
    errors['operations'] = 'Add at least one operation with a name.'
  }

  // Detect duplicate operation names (a map key collision would silently drop one)
  const seen = new Set<string>()

  form.operations.forEach((op, i) => {
    const trimmedName = op.name.trim()

    if (isBlank(op.name)) {
      // Only flag a blank name if the operation has content worth keeping.
      if (op.methods.length > 0) {
        errors[`op:${i}:name`] = 'Operation name is required.'
      }
    } else if (seen.has(trimmedName)) {
      errors[`op:${i}:name`] = `Duplicate operation name "${trimmedName}".`
    } else {
      seen.add(trimmedName)
    }

    // 3. each operation must have at least one method
    if (op.methods.length === 0) {
      errors[`op:${i}:methods`] = 'Add at least one method.'
    }

    // Track methods seen within this operation (case-insensitive) to flag
    // duplicates — the backend matches methods with equalsIgnoreCase, so two
    // entries for the same verb are ambiguous.
    const seenMethods = new Set<string>()

    op.methods.forEach((m, j) => {
      // 4a. method required
      if (isBlank(m.method)) {
        errors[`op:${i}:m:${j}:method`] = 'Method is required.'
      } else {
        const normalized = m.method.trim().toUpperCase()
        if (seenMethods.has(normalized)) {
          errors[`op:${i}:m:${j}:method`] = `Duplicate method "${normalized}" in this operation.`
        } else {
          seenMethods.add(normalized)
        }
      }
      // 4b. statusCode in 100–599
      const code = Number(m.statusCode)
      if (!Number.isInteger(code) || code < 100 || code > 599) {
        errors[`op:${i}:m:${j}:statusCode`] = 'Status must be 100–599.'
      }
    })
  })

  // 5. secured requires authConfig
  if (form.secured && isBlank(form.authConfig)) {
    errors['authConfig'] = 'Auth config is required when the API is secured.'
  }

  return errors
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0
}
