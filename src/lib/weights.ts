import { BPS_DENOMINATOR } from "./units";

export type Weights<K extends string> = Record<K, number>;

export function weightsTotal<K extends string>(weights: Weights<K>): number {
  let total = 0;
  for (const key in weights) total += weights[key];
  return total;
}

export function weightsAreComplete<K extends string>(weights: Weights<K>): boolean {
  return weightsTotal(weights) === BPS_DENOMINATOR;
}

/**
 * Sets one weight and redistributes the rest across the other keys so the
 * total always stays at 100%. The others keep their relative proportions
 * (or share evenly if they were all zero). Works in whole `step` units and
 * hands leftover steps to the largest fractional remainders, so the result
 * is deterministic and always sums exactly.
 */
export function rebalanceWeights<K extends string>(
  weights: Weights<K>,
  keys: readonly K[],
  changed: K,
  next: number,
  step = 100,
): Weights<K> {
  const totalSteps = Math.floor(BPS_DENOMINATOR / step);
  const nextSteps = Math.min(totalSteps, Math.max(0, Math.round(next / step)));
  const others = keys.filter((k) => k !== changed);
  const remainingSteps = totalSteps - nextSteps;
  const othersSum = others.reduce((sum, k) => sum + weights[k], 0);

  const result = { ...weights, [changed]: nextSteps * step } as Weights<K>;
  if (others.length === 0) return result;

  // Integer share and remainder for each of the other keys.
  const shares = others.map((k, index) => {
    const numerator = othersSum === 0 ? remainingSteps : remainingSteps * weights[k];
    const denominator = othersSum === 0 ? others.length : othersSum;
    return {
      key: k,
      index,
      steps: Math.floor(numerator / denominator),
      remainder: numerator % denominator,
    };
  });

  let leftover = remainingSteps - shares.reduce((sum, s) => sum + s.steps, 0);
  const byRemainder = [...shares].sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (const share of byRemainder) {
    if (leftover <= 0) break;
    share.steps += 1;
    leftover -= 1;
  }

  for (const share of shares) result[share.key] = share.steps * step;
  return result;
}
