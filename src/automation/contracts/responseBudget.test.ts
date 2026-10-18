import { describe, expect, it } from 'vitest';

import { Workspace } from '@/models/Workspace';

import { automationTools } from '../../../electron/main/automation/tools';
import { ElementDiscovery } from '../documents/elementDiscovery';
import {
  applyElementEdits,
  createdElementResult,
  planElementEdits,
} from '../documents/elementEdits';
import { getElementCatalog } from './elementSchemas';
import { assertResultBudget, MAX_RESULT_CHARACTERS } from './responseBudget';
import { automationOutputSchema } from './results';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

describe('JSON result budgets', () => {
  it.each([false, true])(
    'allows a complete catalog with includeNeumes:%s without raising other tool budgets',
    (includeNeumes) => {
      const result = getElementCatalog({
        includeProperties: true,
        includeNeumes,
      });
      expect(JSON.stringify(result).length).toBeGreaterThan(
        MAX_RESULT_CHARACTERS,
      );
      expect(() =>
        assertResultBudget(result, 'get_element_catalog'),
      ).not.toThrow();
      expect(() => assertResultBudget(result, 'get_page_setup')).toThrow(
        'JSON response budget',
      );
      expect(
        automationOutputSchema('get_element_catalog').safeParse({
          success: true,
          result,
        }).success,
      ).toBe(true);
    },
  );
  it('counts escaped wire JSON rather than source string length', () => {
    expect(() => assertResultBudget({ text: 'a'.repeat(1000) })).not.toThrow();
    expect(() =>
      assertResultBudget({ text: '\u0000'.repeat(MAX_RESULT_CHARACTERS / 5) }),
    ).toThrow('JSON response budget');
  });

  it('preserves the complete acknowledgment for a real 1000-note insert', () => {
    const workspace = new Workspace(false);
    const discovery = new ElementDiscovery();
    const plan = planElementEdits(
      workspace,
      discovery,
      [
        {
          action: 'insert',
          elements: Array.from({ length: 1000 }, (_, index) => ({
            elementType: 'Note',
            clientId: `note-${index}`,
          })),
        },
      ],
      ['Source Serif'],
    );
    applyElementEdits(workspace, plan);
    expect(workspace.score.staff.elements).toHaveLength(1001);
    const result = {
      documentId: workspace.id,
      revision: 1,
      filePath: null,
      sourceFormat: null,
      title: '',
      hasUnsavedChanges: true,
      selected: false,
      elementCount: 1001,
      applied: true,
      ...createdElementResult(plan.created, discovery, true),
    };
    expect(JSON.stringify(result).length).toBeGreaterThan(
      MAX_RESULT_CHARACTERS,
    );
    expect(() => assertResultBudget(result, 'edit_elements')).not.toThrow();
    const outcome = { success: true, result };
    expect(automationOutputSchema('edit_elements').parse(outcome)).toEqual(
      outcome,
    );
    const { created, ...metadata } = result;
    expect(result.createdCount).toBe(1000);
    expect(created).toHaveLength(1000);
    expect(created![999].clientId).toBe('note-999');
    expect(
      discovery.lookup(workspace.score, {
        elementRef: created![999].elementRef,
        before: 0,
        after: 0,
        includeContent: false,
      }).elements[0].elementRef,
    ).toBe(created![999].elementRef);
    const compact = {
      ...metadata,
      ...createdElementResult(plan.created, discovery, false),
    };
    expect(compact).not.toHaveProperty('created');
    expect(compact.createdCount).toBe(1000);
    expect(JSON.stringify(compact).length).toBeLessThan(1000);
    expect(
      automationOutputSchema('edit_elements').parse({
        success: true,
        result: compact,
      }),
    ).toEqual({ success: true, result: compact });
    for (const tool of automationTools().filter(
      (tool) => !tool.annotations?.readOnlyHint,
    )) {
      expect(() =>
        assertResultBudget(
          result,
          tool.name as Parameters<typeof assertResultBudget>[1],
        ),
      ).not.toThrow();
    }
  });
});
