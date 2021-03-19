import { ScoreElement, EmptyElement } from '@/models/Element';

export class Score {
    public staff: Staff = new Staff();
}

export class Staff {
    public elements: ScoreElement[] = [new EmptyElement()];
}