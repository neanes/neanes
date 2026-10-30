import { z } from 'zod';

// Only visit schema positions: defaults, enum values, and property-name maps
// are data, not schemas, and must not be replaced by references.
type Schema = Record<string, unknown>;
const maps = [
  'properties',
  'patternProperties',
  '$defs',
  'definitions',
  'dependentSchemas',
];
const lists = ['anyOf', 'oneOf', 'allOf', 'prefixItems'];
const singles = [
  'items',
  'additionalProperties',
  'unevaluatedProperties',
  'unevaluatedItems',
  'contains',
  'propertyNames',
  'not',
  'if',
  'then',
  'else',
];
function visitChildren(schema: Schema, visit: (child: Schema) => Schema) {
  for (const key of maps) {
    const map = schema[key] as Record<string, Schema> | undefined;
    if (map) {
      for (const [name, child] of Object.entries(map)) {
        if (typeof child === 'object') {
          map[name] = visit(child);
        }
      }
    }
  }
  for (const key of lists) {
    const list = schema[key] as (Schema | boolean)[] | undefined;
    if (list) {
      schema[key] = list.map((child) =>
        typeof child === 'object' ? visit(child) : child,
      );
    }
  }
  for (const key of singles) {
    const child = schema[key];
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      schema[key] = visit(child as Schema);
    }
  }
}

export function compactJsonSchema(
  type: z.ZodType,
  io: 'input' | 'output' = 'output',
): Schema {
  // Keep small schemas inline so repeated scalars do not exhaust client
  // reference expansion limits. Larger repeated shapes are shared below.
  const root = z.toJSONSchema(type, {
    reused: 'inline',
    io,
  }) as Schema;
  const counts = new Map<string, number>();
  const keys = new WeakMap<Schema, string>();
  const count = (schema: Schema): Schema => {
    const key = JSON.stringify(schema);
    if (key.length >= 160 && !schema.$id && !schema.$schema) {
      keys.set(schema, key);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    visitChildren(schema, count);
    return schema;
  };
  count(root);
  const definitions = (root.$defs ?? {}) as Record<string, Schema>;
  const names = new Map<string, string>();
  const added: Record<string, Schema> = {};
  const reference = (schema: Schema): Schema => {
    const key = keys.get(schema);
    if (key !== undefined && counts.get(key)! > 1) {
      let name = names.get(key);
      if (name === undefined) {
        name = `shared${names.size}`;
        while (Object.hasOwn(definitions, name)) {
          name += '_';
        }
        names.set(key, name);
        visitChildren(schema, reference);
        added[name] = schema;
      }
      return { $ref: `#/$defs/${name}` };
    }
    visitChildren(schema, reference);
    return schema;
  };
  visitChildren(root, reference);
  if (Object.keys(added).length > 0) {
    root.$defs = { ...definitions, ...added };
  }
  return root;
}
