import { NextValue } from '../arbitrary/definition/NextValue';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import { VerbosityLevel } from './configuration/VerbosityLevel';
import { RunExecution } from './reporter/RunExecution';
import { SourceValuesIterator } from './SourceValuesIterator';

/**
 * Responsible for the iteration logic
 *
 * Workflow:
 * 1- Call to `next` gives back the value to test
 * 2- Call to `handleResult` takes into account the execution status
 * 3- Back to 1
 *
 * @internal
 */
export class RunnerIterator<Ts> implements IterableIterator<Ts> {
  runExecution: RunExecution<Ts>;
  private currentIdx: number;
  private currentValue: NextValue<Ts> | undefined;
  private nextValues: IterableIterator<NextValue<Ts>>;
  constructor(
    readonly sourceValues: SourceValuesIterator<NextValue<Ts>>,
    readonly shrink: (value: NextValue<Ts>) => IterableIterator<NextValue<Ts>>,
    verbose: VerbosityLevel,
    interruptedAsFailure: boolean
  ) {
    this.runExecution = new RunExecution<Ts>(verbose, interruptedAsFailure);
    this.currentIdx = -1;
    this.nextValues = sourceValues;
  }
  [Symbol.iterator](): IterableIterator<Ts> {
    return this;
  }
  next(): IteratorResult<Ts> {
    const nextValue = this.nextValues.next();
    if (nextValue.done || this.runExecution.interrupted) {
      return { done: true, value: undefined };
    }
    this.currentValue = nextValue.value;
    ++this.currentIdx;
    return { done: false, value: nextValue.value.value_ };
  }
  handleResult(result: PreconditionFailure | string | null): void {
    // WARNING: This function has to be called after a call to next
    //          Otherwise it will not be able to execute with the right currentShrinkable (or crash)
    // As a consequence: currentShrinkable is always defined in the code below
    if (result != null && typeof result === 'string') {
      // failed run
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.runExecution.fail(this.currentValue!.value_, this.currentIdx, result);
      this.currentIdx = -1;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.nextValues = this.shrink(this.currentValue!);
    } else if (result != null) {
      if (!result.interruptExecution) {
        // skipped run
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.runExecution.skip(this.currentValue!.value_);
        this.sourceValues.skippedOne();
      } else {
        // interrupt signal
        this.runExecution.interrupt();
      }
    } else {
      // successful run
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.runExecution.success(this.currentValue!.value_);
    }
  }
}
