/**
 * Firestore's SDK throws a client-side error if any field value is `undefined`
 * (e.g. an optional number input left blank). Strip those keys out before
 * addDoc/updateDoc/setDoc so optional fields can be safely omitted instead.
 */
export function stripUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {}
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key]
    }
  }
  return result
}
