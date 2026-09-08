import { describe, expect, it } from 'vitest';

import { fontService } from './FontService';

describe('FontService.resolveContextualSubstitutions', () => {
  it('applies a yporroi gorgon substitution across an unrelated mark', () => {
    expect(
      fontService.resolveContextualSubstitutions('Neanes', [
        'yporroi',
        'apli',
        'gorgonAbove',
      ]),
    ).toEqual(['yporroi.gorgon', 'apli', 'gorgonAbove']);
  });

  it('does not skip a mark in the gorgon attachment class', () => {
    expect(
      fontService.resolveContextualSubstitutions('Neanes', [
        'yporroi',
        'digorgon',
        'gorgonAbove',
      ]),
    ).toEqual(['yporroi.digorgon', 'digorgon', 'gorgonAbove']);
  });

  it('keeps marks significant for lookups without a mark attachment type', () => {
    expect(
      fontService.resolveContextualSubstitutions('Neanes', [
        'yporroi',
        'apli',
        'antikenoma',
      ]),
    ).toEqual(['yporroi', 'apli', 'antikenoma']);
  });
});
