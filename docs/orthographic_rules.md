# Orthographic Rules

## Apostrophos

- The apostrophos cannot accept a psefiston.

## Kentemata

- Kentemata may never hold more than one beat, and thus cannot take a klasma, hapli, etc. If a kentemata needs to be held for more than one beat, an ison must placed after it and given the appropriate duration. This also applies to compound neumes that end in kentemata.
- Kentemata may never take vocal expression neumes (except for the heteron).

## Gorgon

- Compound neumes may only accept a gorgon on the top.
- Hyporoe only accepts a gorgon on the top.
- Neumes containing a petasti cannot accept a gorgon.
- Neumes containg a psefiston cannot accept a gorgon, except for the oligon with a kentemata below it.

## Klasmas

### Bottom-only

These neumes only accept klasma on the bottom.

```
  QuantitativeNeume.PetastiWithIson,
  QuantitativeNeume.Petasti,
  QuantitativeNeume.PetastiPlusOligon,
  QuantitativeNeume.PetastiPlusKentimaAbove,
  QuantitativeNeume.PetastiPlusHypsiliRight,
  QuantitativeNeume.PetastiPlusHypsiliLeft,
  QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal,
  QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical,
  QuantitativeNeume.PetastiPlusDoubleHypsili,
  QuantitativeNeume.PetastiPlusApostrophos,
  QuantitativeNeume.PetastiPlusElaphron,
  QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,

  QuantitativeNeume.OligonPlusDoubleHypsili,
```

### Top-only

These neumes only accept klasma on the top.

```
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
```

### No Klasma Allowed

The following neumes can never take a klasma.

```
QuantitativeNeume.Hyporoe,
QuantitativeNeume.Kentemata,
QuantitativeNeume.OligonPlusKentemata,
QuantitativeNeume.OligonPlusHamiliPlusKentemata,
QuantitativeNeume.OligonPlusIsonPlusKentemata,
QuantitativeNeume.OligonPlusElaphronPlusKentemata,
QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
```

## Petasti

- The petasti can never be held for more than one beat.
- The petasti can never take a gorgon.

## Psefiston

### Psefiston not allowed

The following neumes cannot accpet a psefiston.

```
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
```

## Hyporoe

The hyporoe cannot take a klasma.
