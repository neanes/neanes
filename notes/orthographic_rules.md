# Orthographic Rules

## Apostrophos

- The apostrophos cannot accept a psēfiston.

## Kentēmata

- Kentēmata may never hold more than one beat, and thus cannot take a klasma, haplē, etc. If kentēmata need to be held for more than one beat, an ison must be placed after them and given the appropriate duration. This also applies to compound neumes that end in kentēmata.
- Kentēmata may never take vocal expression neumes (except for the heteron).

## Gorgon

- Compound neumes may only accept a gorgon on the top.
- Yporroē only accepts a gorgon on the top.
- Neumes containing a petastē cannot accept a gorgon.
- Neumes containing a psēfiston cannot accept a gorgon, except for the oligon with kentēmata below it.

## Klasmas

### Bottom-only

These neumes only accept klasma on the bottom.

```text
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

```text
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

```text
QuantitativeNeume.Hyporoe,
QuantitativeNeume.Kentemata,
QuantitativeNeume.OligonPlusKentemata,
QuantitativeNeume.OligonPlusHamiliPlusKentemata,
QuantitativeNeume.OligonPlusIsonPlusKentemata,
QuantitativeNeume.OligonPlusElaphronPlusKentemata,
QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
```

## Petastē

- The petastē can never be held for more than one beat.
- The petastē can never take a gorgon.

## Psēfiston

### Psēfiston not allowed

The following neumes cannot accept a psēfiston.

```text
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

## Yporroē

The yporroē cannot take a klasma.
