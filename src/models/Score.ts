import { ScoreElement, EmptyElement } from '@/models/Element';

const ScoreVersion: string = '0.1';

export { ScoreVersion };

export class Score {
    public version: string = ScoreVersion;
    public staff: Staff = new Staff();
}

export class Staff {
    public elements: ScoreElement[] = [new EmptyElement()];
}