import { z } from 'zod';

import type { Score } from '@/models/Score';

import { elementPropertySchemas } from '../contracts/elementPropertySchemas';
import { automationErrorSchema } from '../contracts/errors';
import type { AutomationTool } from '../contracts/protocol';
import { automationResultSchemas } from '../contracts/results';
import type { ElementDiscovery } from '../documents/elementDiscovery';

// Include object references and exact stored fields, including nulls and blank children,
// to detect mutations that save serialization and projected reads can omit.
export function snapshotElements(discovery: ElementDiscovery, score: Score) {
  return JSON.stringify(
    [...discovery.entries(score)].map(({ element, collection, index }) => ({
      elementRef: discovery.reference(element),
      elementType: element.elementType,
      collection,
      index,
      properties: Object.fromEntries(
        Object.keys(elementPropertySchemas[element.elementType].shape).map(
          (key) => [key, Reflect.get(element, key)],
        ),
      ),
    })),
  );
}

export function automationOutputSchema(tool: AutomationTool) {
  return z.discriminatedUnion('success', [
    z.strictObject({
      success: z.literal(true),
      result: automationResultSchemas[tool],
    }),
    z.strictObject({ success: z.literal(false), error: automationErrorSchema }),
  ]);
}
