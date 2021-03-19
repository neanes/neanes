import { ScoreElement, EmptyElement } from '@/models/save/v1/Element';

const ScoreVersion: string = '1.0';

export { ScoreVersion };

export class Score {
    public version: string = ScoreVersion;
    public staff: Staff = new Staff();
}

export class Staff {
    public elements: ScoreElement[] = [new EmptyElement()];
}