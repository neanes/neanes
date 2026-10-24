import { z } from 'zod';

import type { ScoreElement } from '@/models/Element';

import { elementPropertySchemas } from './elementPropertySchemas';

const valueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Value = z.infer<typeof valueSchema>;
type ElementPredicate =
  | { and: ElementPredicate[] }
  | { or: ElementPredicate[] }
  | { field: string; op: 'eq'; value: Value }
  | { field: string; op: 'in'; values: Value[] }
  | { field: string; op: 'isNull' | 'isNotNull' };

const predicate: z.ZodType<ElementPredicate> = z.lazy(() =>
  z.union([
    z.strictObject({ and: z.array(predicate).min(1).max(100) }),
    z.strictObject({ or: z.array(predicate).min(1).max(100) }),
    z.strictObject({
      field: z.string(),
      op: z.literal('eq'),
      value: valueSchema,
    }),
    z.strictObject({
      field: z.string(),
      op: z.literal('in'),
      values: z.array(valueSchema).min(1).max(100),
    }),
    z.strictObject({ field: z.string(), op: z.enum(['isNull', 'isNotNull']) }),
  ]),
);

function propertyAcceptsValue(schema: z.ZodType, value: Value) {
  // Read projections omit nulls, but optional properties can be null in the model.
  return value === null
    ? schema.isOptional() || schema.isNullable()
    : schema.safeParse(value).success;
}

// Check raw trees before recursive schema parsing at the process boundary.
export function assertElementPredicateBounds(root: unknown) {
  const pending = [{ node: root, depth: 1 }];
  let count = 0;
  while (pending.length) {
    const { node, depth } = pending.pop()!;
    if (++count > 100 || depth > 8) {
      throw new z.ZodError([
        {
          code: 'custom',
          path: ['where'],
          message: 'Predicates allow at most 100 nodes and 8 levels.',
        },
      ]);
    }
    if (node === null || typeof node !== 'object') {
      continue;
    }
    for (const name of ['and', 'or']) {
      const children: unknown = Reflect.get(node, name);
      if (!Array.isArray(children)) {
        continue;
      }
      if (children.length > 100) {
        throw new z.ZodError([
          {
            code: 'custom',
            path: ['where', name],
            message: 'Predicates allow at most 100 nodes.',
          },
        ]);
      }
      for (const child of children) {
        pending.push({ node: child, depth: depth + 1 });
      }
    }
  }
}

export const elementPredicateSchema = predicate.superRefine((root, ctx) => {
  const pending = [{ node: root, depth: 1 }];
  let count = 0;
  while (pending.length) {
    const { node, depth } = pending.pop()!;
    if (++count > 100 || depth > 8) {
      ctx.addIssue({
        code: 'custom',
        message: 'Predicates allow at most 100 nodes and 8 levels.',
      });
      return;
    }
    if ('and' in node || 'or' in node) {
      pending.push(
        ...('and' in node ? node.and : node.or).map((node) => ({
          node,
          depth: depth + 1,
        })),
      );
      continue;
    }
    const schemas = Object.values(elementPropertySchemas).flatMap((schema) =>
      Object.entries(schema.shape)
        .filter(([key]) => key === node.field)
        .map(([, value]) => value),
    );
    if (!schemas.length) {
      ctx.addIssue({
        code: 'custom',
        message: `Unknown element property: ${node.field}. Use get_element_catalog.`,
      });
      continue;
    }
    const values =
      node.op === 'eq' ? [node.value] : node.op === 'in' ? node.values : [];
    for (const value of values) {
      if (!schemas.some((schema) => propertyAcceptsValue(schema, value))) {
        ctx.addIssue({
          code: 'custom',
          message: `Invalid value for element property: ${node.field}.`,
        });
      }
    }
  }
});

export function matchesElement(
  element: ScoreElement,
  predicate: ElementPredicate,
): boolean {
  if ('and' in predicate) {
    return predicate.and.every((node) => matchesElement(element, node));
  }
  if ('or' in predicate) {
    return predicate.or.some((node) => matchesElement(element, node));
  }
  if (
    !Object.hasOwn(
      elementPropertySchemas[element.elementType].shape,
      predicate.field,
    )
  ) {
    return false;
  }
  const value: unknown = Reflect.get(element, predicate.field);
  switch (predicate.op) {
    case 'eq':
      return value === predicate.value;
    case 'in':
      return predicate.values.some((candidate) => value === candidate);
    case 'isNull':
      return value == null;
    case 'isNotNull':
      return value != null;
  }
}
