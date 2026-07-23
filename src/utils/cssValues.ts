import type { ComponentValue } from '@csstools/css-parser-algorithms';
import {
  isTokenNode,
  isWhiteSpaceOrCommentNode,
  parseCommaSeparatedListOfComponentValues,
  parseListOfComponentValues,
} from '@csstools/css-parser-algorithms';
import { isTokenComma, isTokenIdent, tokenize } from '@csstools/css-tokenizer';

export function parseCssComponentValues(value: string): ComponentValue[] {
  return parseListOfComponentValues(tokenize({ css: value }));
}

export function parseCssCommaSeparatedComponentValues(
  value: string,
): ComponentValue[][] {
  return parseCommaSeparatedListOfComponentValues(tokenize({ css: value }));
}

export function cssComponentValuesToString(values: ComponentValue[]): string {
  return values.map((value) => value.toString()).join('');
}

export function significantCssComponentValues(
  values: ComponentValue[],
): ComponentValue[] {
  return values.filter((value) => !isWhiteSpaceOrCommentNode(value));
}

export function cssIdentifier(value: ComponentValue): string | null {
  return isTokenNode(value) && isTokenIdent(value.value)
    ? value.value[4].value
    : null;
}

// Return only top-level identifiers. Functions and blocks remain single
// component values, so identifiers in var() fallbacks or other nested syntax
// are never promoted into the containing property's value.
export function topLevelCssIdentifiers(value: string): string[] {
  return parseCssComponentValues(value)
    .map(cssIdentifier)
    .filter((identifier): identifier is string => identifier != null);
}

// The identifier of a component-value list whose grammar is exactly one
// identifier, ignoring CSS whitespace and comments; null otherwise.
// cssIdentifier returns the decoded spelling, so callers also recognize
// standard CSS escapes.
export function singleCssIdentifierOf(values: ComponentValue[]): string | null {
  const significant = significantCssComponentValues(values);

  return significant.length === 1 ? cssIdentifier(significant[0]) : null;
}

export function singleCssIdentifier(value: string): string | null {
  return singleCssIdentifierOf(parseCssComponentValues(value));
}

export function splitCssComponentValuesOnComma(
  values: ComponentValue[],
): ComponentValue[][] {
  const groups: ComponentValue[][] = [[]];

  for (const value of values) {
    if (isTokenNode(value) && isTokenComma(value.value)) {
      groups.push([]);
    } else {
      groups[groups.length - 1].push(value);
    }
  }

  return groups;
}
