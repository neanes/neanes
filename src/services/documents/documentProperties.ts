import type { DocumentProperties } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import { CommandFactory } from '@/services/history/CommandService';

import { documentPropertiesSchema } from './documentPropertiesSchema';

export function replaceDocumentProperties(
  workspace: Workspace,
  input: DocumentProperties,
) {
  const properties = documentPropertiesSchema.parse(input);
  workspace.commandService.executeAsBatch([
    new CommandFactory<DocumentProperties>().create('update-properties', {
      target: workspace.score.documentProperties,
      newValues: properties,
    }),
  ]);
}
