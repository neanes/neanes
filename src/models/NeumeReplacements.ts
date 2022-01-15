import {
  Neume,
  TimeNeume,
  QuantitativeNeume,
  Fthora,
  VocalExpressionNeume,
  GorgonNeume,
  petastiNeumes,
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

const kentemataNeumes: Neume[] = [
  QuantitativeNeume.Kentemata,
  QuantitativeNeume.OligonPlusKentemata,
  QuantitativeNeume.OligonPlusHamiliPlusKentemata,
  QuantitativeNeume.OligonPlusIsonPlusKentemata,
  QuantitativeNeume.OligonPlusHyporoePlusKentemata,
  QuantitativeNeume.OligonPlusElaphronPlusKentemata,
  QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
  QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
  QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft,
  QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight,
  QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
];

// Neumes that must be paired with special "_Right" neumes
const rightGorgonNeumes: Neume[] = [
  QuantitativeNeume.Apostrophos,
  QuantitativeNeume.Hyporoe,
  QuantitativeNeume.Kentemata,
  QuantitativeNeume.OligonPlusHyporoePlusKentemata,
  QuantitativeNeume.OligonPlusElaphronPlusKentemata,
  QuantitativeNeume.OligonPlusIsonPlusKentemata,
  QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
  QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
  QuantitativeNeume.OligonPlusHamiliPlusKentemata,
  QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
  QuantitativeNeume.Hamili,
  QuantitativeNeume.HamiliPlusApostrophos,
  QuantitativeNeume.HamiliPlusElaphron,
  QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
  QuantitativeNeume.DoubleHamili,
  QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical,
];

const bottomRightGorgonNeumes: Neume[] = [
  QuantitativeNeume.Apostrophos,
  QuantitativeNeume.Kentemata,
];

const bottomAllowedGorgonNeumes: Neume[] = [
  QuantitativeNeume.Apostrophos,
  QuantitativeNeume.Ison,
  QuantitativeNeume.Oligon,
  QuantitativeNeume.Kentemata,
  QuantitativeNeume.Elaphron,
  QuantitativeNeume.Hamili,
];

const rightTimeNeumes: Neume[] = [
  QuantitativeNeume.Apostrophos,
  QuantitativeNeume.Hyporoe,
  QuantitativeNeume.Hamili,
  QuantitativeNeume.HamiliPlusApostrophos,
  QuantitativeNeume.HamiliPlusElaphron,
  QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
  QuantitativeNeume.DoubleHamili,
];

const rightFthoraNeumes: Neume[] = [
  QuantitativeNeume.Apostrophos,
  QuantitativeNeume.DoubleHamili,
  QuantitativeNeume.Hyporoe,
  QuantitativeNeume.Hamili,
  QuantitativeNeume.HamiliPlusApostrophos,
  QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
  QuantitativeNeume.HamiliPlusElaphron,
  QuantitativeNeume.Kentemata,
  QuantitativeNeume.OligonPlusKentimaAbove,
  QuantitativeNeume.OligonPlusKentemata,
  QuantitativeNeume.OligonPlusHypsiliLeft,
  QuantitativeNeume.OligonPlusApostrophos,
  QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
  QuantitativeNeume.PetastiPlusKentimaAbove,
  QuantitativeNeume.PetastiPlusHypsiliLeft,
];

const bottomRightFthoraNeumes: Neume[] = [
  QuantitativeNeume.Hyporoe,
  QuantitativeNeume.Kentemata,
  QuantitativeNeume.Apostrophos,
];

const bottomOnlyKlasmaNeumes: Neume[] = [
  ...petastiNeumes,

  QuantitativeNeume.OligonPlusDoubleHypsili,
];

const topOnlyKlasmaNeumes: Neume[] = [
  QuantitativeNeume.Ison,
  QuantitativeNeume.KentemataPlusOligon,
  QuantitativeNeume.KentemataPlusOligonSpecial,
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
  QuantitativeNeume.PetastiPlusRunningElaphron,
];

export const gorgonReplacementMap = new Map<
  GorgonNeume,
  NeumeReplacement<GorgonNeume>[]
>([
  [
    GorgonNeume.Gorgon_Top,
    [
      {
        isPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.Gorgon_TopRight,
      },
      {
        isPairedWith: [...petastiNeumes],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.Gorgon_Bottom,
    [
      {
        isPairedWith: bottomRightGorgonNeumes,
        replaceWith: GorgonNeume.Gorgon_BottomRight,
      },
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
        isPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.GorgonDottedLeft_Right,
      },
      {
        isPairedWith: [...petastiNeumes],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.GorgonDottedRight,
    [
      {
        isPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.GorgonDottedRight_Right,
      },
      {
        isPairedWith: [...petastiNeumes],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.Digorgon,
    [
      {
        isPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.Digorgon_Right,
      },
      {
        isPairedWith: [...petastiNeumes],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.DigorgonDottedLeft1,
    [
      {
        isPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.DigorgonDottedLeft1_Right,
      },
      {
        isPairedWith: [...petastiNeumes],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.DigorgonDottedLeft2,
    [
      {
        isPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.DigorgonDottedLeft2_Right,
      },
      {
        isPairedWith: [...petastiNeumes],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.DigorgonDottedRight,
    [
      {
        isPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.DigorgonDottedRight_Right,
      },
      {
        isPairedWith: [...petastiNeumes],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.Trigorgon,
    [
      {
        isPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.Trigorgon_Right,
      },
      {
        isPairedWith: [...petastiNeumes],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.TrigorgonDottedLeft1,
    [
      {
        isPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.TrigorgonDottedLeft1_Right,
      },
      {
        isPairedWith: [...petastiNeumes],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.TrigorgonDottedLeft2,
    [
      {
        isPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.TrigorgonDottedLeft2_Right,
      },
      {
        isPairedWith: [...petastiNeumes],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.TrigorgonDottedRight,
    [
      {
        isPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.TrigorgonDottedRight_Right,
      },
      {
        isPairedWith: [...petastiNeumes],
        replaceWith: null,
      },
    ],
  ],

  [
    GorgonNeume.Gorgon_TopRight,
    [
      {
        isNotPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.Gorgon_Top,
      },
    ],
  ],

  [
    GorgonNeume.Gorgon_BottomRight,
    [
      {
        isNotPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.Gorgon_Bottom,
      },
    ],
  ],

  [
    GorgonNeume.GorgonDottedLeft_Right,
    [
      {
        isNotPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.GorgonDottedLeft,
      },
    ],
  ],

  [
    GorgonNeume.GorgonDottedRight_Right,
    [
      {
        isNotPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.GorgonDottedRight,
      },
    ],
  ],

  [
    GorgonNeume.Digorgon_Right,
    [{ isNotPairedWith: rightGorgonNeumes, replaceWith: GorgonNeume.Digorgon }],
  ],

  [
    GorgonNeume.DigorgonDottedLeft1_Right,
    [
      {
        isNotPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.DigorgonDottedLeft1,
      },
    ],
  ],

  [
    GorgonNeume.DigorgonDottedLeft2_Right,
    [
      {
        isNotPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.DigorgonDottedLeft2,
      },
    ],
  ],

  [
    GorgonNeume.DigorgonDottedRight_Right,
    [
      {
        isNotPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.DigorgonDottedRight,
      },
    ],
  ],

  [
    GorgonNeume.Trigorgon_Right,
    [
      {
        isNotPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.Trigorgon,
      },
    ],
  ],

  [
    GorgonNeume.TrigorgonDottedLeft1_Right,
    [
      {
        isNotPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.TrigorgonDottedLeft1,
      },
    ],
  ],

  [
    GorgonNeume.TrigorgonDottedLeft2_Right,
    [
      {
        isNotPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.TrigorgonDottedLeft2,
      },
    ],
  ],

  [
    GorgonNeume.TrigorgonDottedRight_Right,
    [
      {
        isNotPairedWith: rightGorgonNeumes,
        replaceWith: GorgonNeume.TrigorgonDottedRight,
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
      { isPairedWith: rightTimeNeumes, replaceWith: TimeNeume.Hapli_Right },
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
      { isPairedWith: rightTimeNeumes, replaceWith: TimeNeume.Dipli_Right },
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
      { isPairedWith: rightTimeNeumes, replaceWith: TimeNeume.Tripli_Right },
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
      { isPairedWith: rightTimeNeumes, replaceWith: TimeNeume.Klasma_TopRight },
      {
        isPairedWith: [
          ...kentemataNeumes,
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
          QuantitativeNeume.Hyporoe,
          QuantitativeNeume.IsonPlusApostrophos,
          QuantitativeNeume.DoubleApostrophos,
        ],
        replaceWith: null,
      },
    ],
  ],

  [
    TimeNeume.Hapli_Right,
    [{ isNotPairedWith: rightTimeNeumes, replaceWith: TimeNeume.Hapli }],
  ],

  [
    TimeNeume.Dipli_Right,
    [{ isNotPairedWith: rightTimeNeumes, replaceWith: TimeNeume.Dipli }],
  ],

  [
    TimeNeume.Tripli_Right,
    [{ isNotPairedWith: rightTimeNeumes, replaceWith: TimeNeume.Tripli }],
  ],

  [
    TimeNeume.Klasma_TopRight,
    [
      { isNotPairedWith: rightTimeNeumes, replaceWith: TimeNeume.Klasma_Top },
      { isPairedWith: [QuantitativeNeume.Hyporoe], replaceWith: null },
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
          QuantitativeNeume.Kentemata,
          QuantitativeNeume.IsonPlusApostrophos,
          QuantitativeNeume.DoubleApostrophos,
          QuantitativeNeume.PetastiPlusRunningElaphron,
        ],
        replaceWith: null,
      },
      {
        isPairedWith: [
          QuantitativeNeume.Apostrophos,
          QuantitativeNeume.Hyporoe,
        ],
        replaceWith: VocalExpressionNeume.AntikenomaShort,
      },
    ],
  ],
  [
    VocalExpressionNeume.Psifiston,
    [
      {
        isPairedWith: [
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
    VocalExpressionNeume.Heteron,
    [
      {
        isPairedWith: [...petastiNeumes, ...kentemataNeumes],
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
          ...kentemataNeumes,
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
        isPairedWith: [...petastiNeumes, ...kentemataNeumes],
        replaceWith: null,
      },
    ],
  ],
]);

export const fthoraReplacementMap = new Map<Fthora, NeumeReplacement<Fthora>[]>(
  [],
);

export const quantitativeNeumeReplacementMap = new Map<
  QuantitativeNeume,
  QuantitativeNeumeReplacement<QuantitativeNeume>[]
>([
  [
    QuantitativeNeume.KentemataPlusOligon,
    [
      {
        isPairedWithVocalExpression: [VocalExpressionNeume.Psifiston],
        replaceWith: QuantitativeNeume.KentemataPlusOligonSpecial,
      },
    ],
  ],

  [
    QuantitativeNeume.KentemataPlusOligonSpecial,
    [
      {
        isNotPairedWithVocalExpression: [VocalExpressionNeume.Psifiston],
        replaceWith: QuantitativeNeume.KentemataPlusOligon,
      },
    ],
  ],
]);

for (let fthora of Object.values(Fthora)) {
  const topRightFthora = fthora.replace('TopCenter', 'TopRight') as Fthora;
  const bottomRightFthora = fthora.replace(
    'BottomCenter',
    'BottomRight',
  ) as Fthora;

  const replacements = fthoraReplacementMap.get(fthora) || [];
  fthoraReplacementMap.set(fthora, replacements);

  if (
    fthora.endsWith('TopCenter') &&
    Object.values(Fthora).includes(topRightFthora)
  ) {
    replacements.push({
      isPairedWith: rightFthoraNeumes,
      replaceWith: topRightFthora,
    });

    // Add the opposite
    const replacementsTopRight = fthoraReplacementMap.get(topRightFthora) || [];
    fthoraReplacementMap.set(topRightFthora, replacementsTopRight);
    replacementsTopRight.push({
      isNotPairedWith: rightFthoraNeumes,
      replaceWith: fthora,
    });
  } else if (
    fthora.endsWith('BottomCenter') &&
    Object.values(Fthora).includes(bottomRightFthora)
  ) {
    replacements.push({
      isPairedWith: bottomRightFthoraNeumes,
      replaceWith: bottomRightFthora,
    });

    // Add the opposite
    const replacementsBottomRight =
      fthoraReplacementMap.get(bottomRightFthora) || [];
    fthoraReplacementMap.set(bottomRightFthora, replacementsBottomRight);
    replacementsBottomRight.push({
      isNotPairedWith: bottomRightFthoraNeumes,
      replaceWith: fthora,
    });
  }
}

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

export const areTimeNeumesEquivalent = (
  neume1: TimeNeume,
  neume2: TimeNeume,
) => {
  return areNeumesEquivalent(
    neume1,
    neume2,
    getTimeReplacements(neume1),
    getTimeReplacements(neume2),
  );
};

export const areGorgonsEquivalent = (
  neume1: GorgonNeume,
  neume2: GorgonNeume,
) => {
  return areNeumesEquivalent(
    neume1,
    neume2,
    getGorgonReplacements(neume1),
    getGorgonReplacements(neume2),
  );
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

export const areFthorasEquivalent = (neume1: Fthora, neume2: Fthora) => {
  return areNeumesEquivalent(
    neume1,
    neume2,
    getFthoraReplacements(neume1),
    getFthoraReplacements(neume2),
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
