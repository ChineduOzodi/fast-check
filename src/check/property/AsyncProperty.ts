import { Arbitrary } from '../arbitrary/definition/Arbitrary';
import { tuple } from '../../arbitrary/tuple';
import {
  AsyncProperty,
  IAsyncProperty,
  IAsyncPropertyWithHooks,
  AsyncPropertyHookFunction,
} from './AsyncProperty.generic';

/**
 * Instantiate a new {@link fast-check#IAsyncProperty}
 * @param predicate - Assess the success of the property. Would be considered falsy if it throws or if its output evaluates to false
 * @remarks Since 0.0.7
 * @public
 */
function asyncProperty<Ts extends [unknown, ...unknown[]]>(
  ...args: [...arbitraries: { [K in keyof Ts]: Arbitrary<Ts[K]> }, predicate: (...args: Ts) => Promise<boolean | void>]
): IAsyncPropertyWithHooks<Ts> {
  if (args.length < 2) {
    throw new Error('asyncProperty expects at least two parameters');
  }
  const arbs = args.slice(0, args.length - 1) as { [K in keyof Ts]: Arbitrary<Ts[K]> };
  const p = args[args.length - 1] as (...args: Ts) => Promise<boolean | void>;
  return new AsyncProperty(tuple<Ts>(...arbs), (t) => p(...t));
}

export { asyncProperty, IAsyncProperty, IAsyncPropertyWithHooks, AsyncPropertyHookFunction };
