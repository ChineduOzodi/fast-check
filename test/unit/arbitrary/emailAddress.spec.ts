import fc from '../../../lib/fast-check';
import { emailAddress } from '../../../src/arbitrary/emailAddress';
import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { NextValue } from '../../../src/check/arbitrary/definition/NextValue';

import {
  assertProduceSameValueGivenSameSeed,
  assertProduceCorrectValues,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/NextArbitraryAssertions';
import { buildNextShrinkTree, renderTree } from './__test-helpers__/ShrinkTree';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('emailAddress (integration)', () => {
  const expectValidEmailRfc1123 = (t: string) => {
    // Taken from https://www.w3.org/TR/html5/forms.html#valid-e-mail-address
    const rfc1123 =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    expect(t).toMatch(rfc1123);
  };

  const expectValidEmailRfc2821 = (t: string) => {
    const [localPart, domain] = t.split('@');
    // The maximum total length of a user name or other local-part is 64 characters.
    expect(localPart.length).toBeLessThanOrEqual(64);
    // The maximum total length of a domain name or number is 255 characters.
    expect(domain.length).toBeLessThanOrEqual(255);
  };

  const expectValidEmailRfc5322 = (t: string) => {
    // Taken from https://stackoverflow.com/questions/201323/how-to-validate-an-email-address-using-a-regular-expression
    const rfc5322 =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    expect(t).toMatch(rfc5322);
  };

  const isCorrect = (t: string) => {
    expectValidEmailRfc1123(t);
    expectValidEmailRfc2821(t);
    expectValidEmailRfc5322(t);
  };

  const emailAddressBuilder = () => convertToNext(emailAddress());

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(emailAddressBuilder);
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(emailAddressBuilder, isCorrect);
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(emailAddressBuilder);
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(emailAddressBuilder);
  });

  it.each`
    rawValue
    ${'me@domain.com'}
  `('should be able to shrink $rawValue', ({ rawValue }) => {
    // Arrange
    const arb = convertToNext(emailAddress());
    const value = new NextValue(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildNextShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});
