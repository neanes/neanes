import { v4 as uuid } from 'uuid';

import { Staff } from './Staff';

export class Footnote {
  public id = uuid();
  public marker: string | null = null;
  public staff = new Staff();
}
