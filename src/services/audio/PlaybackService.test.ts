import { PlaybackService } from './PlaybackService';

describe('PlaybackService', () => {
  describe('constructTetrachordScale', () => {
    it('should construct the first half of a disjunct tetrachord scale with separating tone at the end', () => {
      const service = new PlaybackService();

      expect(service.constructTetrachordScale([1, 2, 3])).toEqual([
        1, 2, 3, 12,
      ]);
    });
  });

  describe('constructDiapasonScale', () => {
    it('should construct a disjunct octave scale', () => {
      const service = new PlaybackService();

      expect(service.constructDiapasonScale([1, 2, 3])).toEqual([
        1, 2, 3, 12, 1, 2, 3,
      ]);
    });
  });

  describe('constructZygosScale', () => {
    it('should construct the zygos scale', () => {
      const service = new PlaybackService();

      expect(service.constructZygosScale([1, 2, 3, 4], [5, 6, 7])).toEqual([
        1, 2, 3, 4, 5, 6, 7,
      ]);

      expect(service.constructZygosScale([18, 4, 16, 4], [12, 10, 8])).toEqual([
        18, 4, 16, 4, 12, 10, 8,
      ]);
    });
  });

  describe('constructKlitonScale', () => {
    it('should construct the kliton scale', () => {
      const service = new PlaybackService();

      expect(service.constructKlitonScale([10, 20, 30], [1, 2, 3])).toEqual([
        1, 10, 20, 30, 1, 2, 3,
      ]);

      expect(service.constructKlitonScale([14, 12, 4], [12, 10, 8])).toEqual([
        12, 14, 12, 4, 12, 10, 8,
      ]);
    });
  });

  describe('constructSpathiScale', () => {
    it('should construct the spathi scale', () => {
      const service = new PlaybackService();

      expect(service.constructSpathiScale([4, 5, 6, 7], [1, 2, 3])).toEqual([
        1, 2, 3, 4, 5, 6, 7,
      ]);

      expect(service.constructSpathiScale([20, 4, 4, 14], [12, 10, 8])).toEqual(
        [12, 10, 8, 20, 4, 4, 14],
      );
    });
  });
});
