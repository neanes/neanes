import {
  Fthora,
  GorgonNeume,
  MeasureBar,
  Neume,
  petastiNeumes,
  QuantitativeNeume,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';

export interface NeumeReplacement<T> {
  isPairedWith?: Neume[];
  isNotPairedWith?: Neume[];
  replaceWith: T | null;
}

export interface QuantitativeNeumeReplacement<T> {
  isPairedWithVocalExpression?: VocalExpressionNeume[];
  isNotPairedWithVocalExpression?: VocalExpressionNeume[];
  replaceWith: T;
}

const kentemataNeumesNoOmalon: Neume[] = [
  QuantitativeNeume.Kentemata,
  QuantitativeNeume.OligonPlusHamiliPlusKentemata,
  QuantitativeNeume.OligonPlusIsonPlusKentemata,
  QuantitativeNeume.OligonPlusHyporoePlusKentemata,
  QuantitativeNeume.OligonPlusElaphronPlusKentemata,
  QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
  QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
  QuantitativeNeume.OligonKentimaMiddleKentimata,
  QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft,
  QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight,
  QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
];

export const kentemataNeumes: Neume[] = [
  ...kentemataNeumesNoOmalon,
  QuantitativeNeume.OligonPlusKentemata,
];

const petastiNeumesNoGorgon = petastiNeumes.filter(
  (x) => x !== QuantitativeNeume.PetastiPlusHyporoe,
);

const bottomAllowedGorgonNeumes: Neume[] = [
  QuantitativeNeume.Apostrophos,
  QuantitativeNeume.Ison,
  QuantitativeNeume.Oligon,
  QuantitativeNeume.OligonPlusKentima,
  QuantitativeNeume.OligonPlusKentimaBelow,
  QuantitativeNeume.OligonPlusKentimaAbove,
  QuantitativeNeume.OligonPlusHypsiliRight,
  QuantitativeNeume.OligonPlusHypsiliLeft,
  QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal,
  QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
  QuantitativeNeume.OligonPlusDoubleHypsili,
  QuantitativeNeume.OligonKentimataDoubleYpsili,
  QuantitativeNeume.OligonKentimaDoubleYpsiliRight,
  QuantitativeNeume.OligonKentimaDoubleYpsiliLeft,
  QuantitativeNeume.OligonTripleYpsili,
  QuantitativeNeume.OligonKentimataTripleYpsili,
  QuantitativeNeume.OligonKentimaTripleYpsili,
  QuantitativeNeume.OligonPlusIson,
  QuantitativeNeume.OligonPlusApostrophos,
  QuantitativeNeume.OligonPlusElaphron,
  QuantitativeNeume.OligonPlusElaphronPlusApostrophos,
  QuantitativeNeume.OligonPlusHamili,
  QuantitativeNeume.Kentemata,
  QuantitativeNeume.Elaphron,
  QuantitativeNeume.Hamili,
];

const bottomOnlyKlasmaNeumes: Neume[] = [
  ...petastiNeumes,

  QuantitativeNeume.OligonPlusDoubleHypsili,
  QuantitativeNeume.OligonPlusApostrophos,
  QuantitativeNeume.OligonPlusElaphron,
  QuantitativeNeume.OligonPlusElaphronPlusApostrophos,
  QuantitativeNeume.OligonPlusHamili,
  QuantitativeNeume.OligonPlusIson,
];

const topOnlyKlasmaNeumes: Neume[] = [
  QuantitativeNeume.Ison,
  QuantitativeNeume.KentemataPlusOligon,
  QuantitativeNeume.Oligon,
  QuantitativeNeume.OligonPlusKentimaBelow,
  QuantitativeNeume.OligonPlusKentima,
  QuantitativeNeume.OligonPlusHypsiliRight,
  QuantitativeNeume.Hamili,
  QuantitativeNeume.HamiliPlusApostrophos,
  QuantitativeNeume.HamiliPlusElaphron,
  QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
  QuantitativeNeume.DoubleHamili,
  QuantitativeNeume.Apostrophos,
  QuantitativeNeume.Elaphron,
  QuantitativeNeume.ElaphronPlusApostrophos,
  QuantitativeNeume.RunningElaphron,
];

const rests: Neume[] = [
  QuantitativeNeume.VareiaDotted,
  QuantitativeNeume.VareiaDotted2,
  QuantitativeNeume.VareiaDotted3,
  QuantitativeNeume.VareiaDotted4,
  QuantitativeNeume.Breath,
  QuantitativeNeume.Cross,
];

const secondaryNeumesAllowedNeumes: Neume[] = [
  QuantitativeNeume.OligonPlusIsonPlusKentemata,
  QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
  QuantitativeNeume.OligonPlusElaphronPlusKentemata,
  QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
  QuantitativeNeume.OligonPlusHamiliPlusKentemata,
  QuantitativeNeume.OligonPlusHyporoePlusKentemata,
  QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
  QuantitativeNeume.OligonPlusKentemata,
  QuantitativeNeume.RunningElaphron,
  QuantitativeNeume.PetastiPlusRunningElaphron,
];

const tertiaryNeumesAllowedNeumes: Neume[] = [
  QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
];

const measureBarAboveNeumes: Neume[] = [
  QuantitativeNeume.Hyporoe,
  QuantitativeNeume.KentemataPlusOligon,
  QuantitativeNeume.OligonPlusHyporoePlusKentemata,
  QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
  QuantitativeNeume.PetastiPlusHyporoe,
  QuantitativeNeume.PetastiPlusRunningElaphron,
  QuantitativeNeume.RunningElaphron,
];

export const gorgonReplacementMap = new Map<
  GorgonNeume,
  NeumeReplacement<GorgonNeume>[]
>([
  [
    GorgonNeume.Gorgon_Top,
    [
      {
        isPairedWith: [...petastiNeumesNoGorgon],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.Gorgon_Bottom,
    [
      {
        isNotPairedWith: bottomAllowedGorgonNeumes,
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.GorgonDottedLeft,
    [
      {
        isPairedWith: [...petastiNeumesNoGorgon],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.GorgonDottedRight,
    [
      {
        isPairedWith: [...petastiNeumesNoGorgon],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.Digorgon,
    [
      {
        isPairedWith: [...petastiNeumesNoGorgon],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.DigorgonDottedLeft1,
    [
      {
        isPairedWith: [...petastiNeumesNoGorgon],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.DigorgonDottedLeft2,
    [
      {
        isPairedWith: [...petastiNeumesNoGorgon],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.DigorgonDottedRight,
    [
      {
        isPairedWith: [...petastiNeumesNoGorgon],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.Trigorgon,
    [
      {
        isPairedWith: [...petastiNeumesNoGorgon],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.TrigorgonDottedLeft1,
    [
      {
        isPairedWith: [...petastiNeumesNoGorgon],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.TrigorgonDottedLeft2,
    [
      {
        isPairedWith: [...petastiNeumesNoGorgon],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.TrigorgonDottedRight,
    [
      {
        isPairedWith: [...petastiNeumesNoGorgon],
        replaceWith: null,
      },
    ],
  ],
  [
    GorgonNeume.Argon,
    [
      {
        isNotPairedWith: [QuantitativeNeume.KentemataPlusOligon],
        replaceWith: null,
      },
    ],
  ],
  [
    GorgonNeume.Hemiolion,
    [
      {
        isNotPairedWith: [QuantitativeNeume.KentemataPlusOligon],
        replaceWith: null,
      },
    ],
  ],
  [
    GorgonNeume.Diargon,
    [
      {
        isNotPairedWith: [QuantitativeNeume.KentemataPlusOligon],
        replaceWith: null,
      },
    ],
  ],
]);

export const timeReplacementMap = new Map<
  TimeNeume,
  NeumeReplacement<TimeNeume>[]
>([
  [
    TimeNeume.Hapli,
    [
      {
        isPairedWith: [
          QuantitativeNeume.IsonPlusApostrophos,
          QuantitativeNeume.DoubleApostrophos,
          ...kentemataNeumes,
        ],
        replaceWith: null,
      },
    ],
  ],

  [
    TimeNeume.Dipli,
    [
      {
        isPairedWith: [
          QuantitativeNeume.IsonPlusApostrophos,
          QuantitativeNeume.DoubleApostrophos,
          ...kentemataNeumes,
          ...petastiNeumes,
        ],
        replaceWith: null,
      },
    ],
  ],

  [
    TimeNeume.Tripli,
    [
      {
        isPairedWith: [
          QuantitativeNeume.IsonPlusApostrophos,
          QuantitativeNeume.DoubleApostrophos,
          ...kentemataNeumes,
          ...petastiNeumes,
        ],
        replaceWith: null,
      },
    ],
  ],

  [
    TimeNeume.Klasma_Top,
    [
      {
        isPairedWith: [
          ...kentemataNeumes,
          ...bottomOnlyKlasmaNeumes,
          QuantitativeNeume.Hyporoe,
          QuantitativeNeume.IsonPlusApostrophos,
          QuantitativeNeume.DoubleApostrophos,
        ],
        replaceWith: null,
      },
    ],
  ],

  [
    TimeNeume.Klasma_Bottom,
    [
      {
        isPairedWith: [
          ...kentemataNeumes,
          ...topOnlyKlasmaNeumes,
          QuantitativeNeume.Hyporoe,
          QuantitativeNeume.IsonPlusApostrophos,
          QuantitativeNeume.DoubleApostrophos,
        ],
        replaceWith: null,
      },
    ],
  ],
]);

export const vocalExpressionReplacementMap = new Map<
  VocalExpressionNeume,
  NeumeReplacement<VocalExpressionNeume>[]
>([
  [
    VocalExpressionNeume.Antikenoma,
    [
      {
        isPairedWith: [
          ...rests,
          QuantitativeNeume.Kentemata,
          QuantitativeNeume.IsonPlusApostrophos,
          QuantitativeNeume.DoubleApostrophos,
          QuantitativeNeume.PetastiPlusRunningElaphron,
        ],
        replaceWith: null,
      },
    ],
  ],
  [
    VocalExpressionNeume.Heteron,
    [
      {
        isNotPairedWith: [
          QuantitativeNeume.Ison,
          QuantitativeNeume.Oligon,
          QuantitativeNeume.OligonPlusApostrophos,
          QuantitativeNeume.OligonPlusDoubleHypsili,
          QuantitativeNeume.OligonPlusHypsiliLeft,
          QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal,
          QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
          QuantitativeNeume.OligonPlusHypsiliRight,
          QuantitativeNeume.OligonPlusKentima,
          QuantitativeNeume.OligonPlusKentimaAbove,
          QuantitativeNeume.OligonPlusKentimaBelow,
        ],
        replaceWith: null,
      },
    ],
  ],
  [
    VocalExpressionNeume.HeteronConnecting,
    [
      {
        isPairedWith: [...rests],
        replaceWith: null,
      },
    ],
  ],
  [
    VocalExpressionNeume.Psifiston,
    [
      {
        isPairedWith: [
          ...rests,
          QuantitativeNeume.Apostrophos,
          QuantitativeNeume.Kentemata,
          QuantitativeNeume.Hyporoe,
          QuantitativeNeume.Hamili,
          QuantitativeNeume.HamiliPlusApostrophos,
          QuantitativeNeume.HamiliPlusElaphron,
          QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
          QuantitativeNeume.DoubleHamili,
          QuantitativeNeume.Elaphron,
          QuantitativeNeume.ElaphronPlusApostrophos,
          QuantitativeNeume.RunningElaphron,
          QuantitativeNeume.PetastiPlusRunningElaphron,
          QuantitativeNeume.IsonPlusApostrophos,
          QuantitativeNeume.DoubleApostrophos,
        ],
        replaceWith: null,
      },
    ],
  ],
  [
    VocalExpressionNeume.Homalon,
    [
      {
        isPairedWith: [
          ...petastiNeumes,
          ...kentemataNeumes,
          ...rests,
          QuantitativeNeume.PetastiPlusRunningElaphron,
          QuantitativeNeume.DoubleApostrophos,
          QuantitativeNeume.IsonPlusApostrophos,
          QuantitativeNeume.Hyporoe,
        ],
        replaceWith: null,
      },
    ],
  ],
  [
    VocalExpressionNeume.HomalonConnecting,
    [
      {
        isPairedWith: [
          ...petastiNeumes,
          ...kentemataNeumesNoOmalon,
          ...rests,
          QuantitativeNeume.PetastiPlusRunningElaphron,
          QuantitativeNeume.DoubleApostrophos,
          QuantitativeNeume.IsonPlusApostrophos,
          QuantitativeNeume.Hyporoe,
        ],
        replaceWith: null,
      },
    ],
  ],
  [
    VocalExpressionNeume.Vareia,
    [
      {
        isPairedWith: [...petastiNeumes, ...kentemataNeumes, ...rests],
        replaceWith: null,
      },
    ],
  ],
]);

export const fthoraReplacementMap = new Map<Fthora, NeumeReplacement<Fthora>[]>(
  [],
);

export const measureBarLeftToAbove = new Map<MeasureBar, MeasureBar>([
  [MeasureBar.MeasureBarRight, MeasureBar.MeasureBarRightAbove],
  [MeasureBar.MeasureBarTop, MeasureBar.MeasureBarTopAbove],
  [MeasureBar.MeasureBarDouble, MeasureBar.MeasureBarDoubleAbove],
  [MeasureBar.MeasureBarShortDouble, MeasureBar.MeasureBarShortDoubleAbove],
  [MeasureBar.MeasureBarTheseos, MeasureBar.MeasureBarTheseosAbove],
  [MeasureBar.MeasureBarShortTheseos, MeasureBar.MeasureBarShortTheseosAbove],
]);

export const measureBarAboveToLeft = new Map<MeasureBar, MeasureBar>();

for (const [key, value] of measureBarLeftToAbove) {
  measureBarAboveToLeft.set(value, key);
}

export const quantitativeNeumeReplacementMap = new Map<
  QuantitativeNeume,
  QuantitativeNeumeReplacement<QuantitativeNeume>[]
>([
  // [
  //   QuantitativeNeume.KentemataPlusOligon,
  //   [
  //     {
  //       isPairedWithVocalExpression: [VocalExpressionNeume.Psifiston],
  //       replaceWith: QuantitativeNeume.KentemataPlusOligonSpecial,
  //     },
  //   ],
  // ],
  // [
  //   QuantitativeNeume.KentemataPlusOligonSpecial,
  //   [
  //     {
  //       isNotPairedWithVocalExpression: [VocalExpressionNeume.Psifiston],
  //       replaceWith: QuantitativeNeume.KentemataPlusOligon,
  //     },
  //   ],
  // ],
]);

export const getGorgonReplacements = (neume: GorgonNeume) => {
  return gorgonReplacementMap.get(neume);
};

export const getTimeReplacements = (neume: TimeNeume) => {
  return timeReplacementMap.get(neume);
};

export const getVocalExpressionReplacements = (neume: VocalExpressionNeume) => {
  return vocalExpressionReplacementMap.get(neume);
};

export const getFthoraReplacements = (neume: Fthora) => {
  return fthoraReplacementMap.get(neume);
};

export const getQuantitativeReplacements = (neume: QuantitativeNeume) => {
  return quantitativeNeumeReplacementMap.get(neume);
};

export const areVocalExpressionsEquivalent = (
  neume1: VocalExpressionNeume,
  neume2: VocalExpressionNeume,
) => {
  return areNeumesEquivalent(
    neume1,
    neume2,
    getVocalExpressionReplacements(neume1),
    getVocalExpressionReplacements(neume2),
  );
};

const areNeumesEquivalent = (
  neume1: Neume,
  neume2: Neume,
  replacements1: NeumeReplacement<Neume>[] | undefined,
  replacements2: NeumeReplacement<Neume>[] | undefined,
) => {
  if (neume1 === neume2) {
    return true;
  }
  if (replacements1) {
    if (replacements1.find((x) => x.replaceWith == neume2)) {
      return true;
    }
  }

  if (replacements2) {
    if (replacements2.find((x) => x.replaceWith == neume1)) {
      return true;
    }
  }

  return false;
};

export const onlyTakesTopKlasma = (neume: QuantitativeNeume) =>
  topOnlyKlasmaNeumes.includes(neume);

export const onlyTakesBottomKlasma = (neume: QuantitativeNeume) =>
  bottomOnlyKlasmaNeumes.includes(neume);

export const onlyTakesTopGorgon = (neume: QuantitativeNeume) =>
  !bottomAllowedGorgonNeumes.includes(neume);

export const takesSecondaryNeumes = (neume: QuantitativeNeume) =>
  secondaryNeumesAllowedNeumes.includes(neume);

export const takesTertiaryNeumes = (neume: QuantitativeNeume) =>
  tertiaryNeumesAllowedNeumes.includes(neume);

export const isMeasureBarAbove = (neume: QuantitativeNeume) =>
  measureBarAboveNeumes.includes(neume);
