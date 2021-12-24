import {createCursor, GhostCursor} from 'ghost-cursor';
import {Page} from 'puppeteer';
import {logger} from '../logger';
import {Link, Store} from '../store/model';
import {State} from './state';
import {asyncMaxPrioritized} from './util';

export interface PurchaseCallback {
  onPurchaseComplete: (link: Link) => Promise<void>;
}

export type StateMachineContext = {
  page: Page;
  store: Store;
  link: Link;
  cursor: GhostCursor;
  callback?: PurchaseCallback;
};

export abstract class StateMachine {
  abstract _states: {[key: string]: State};

  public get states(): State[] {
    return Object.values(this._states);
  }

  error?: string;
  success = false;

  page: Page;
  store: Store;
  link: Link;
  cursor: GhostCursor;
  callback?: PurchaseCallback;

  constructor(context: StateMachineContext) {
    this.page = context.page;
    this.store = context.store;
    this.link = context.link;
    this.cursor = context.cursor;
    this.callback = context.callback;
  }

  async initialize() {
    this.cursor = createCursor(this.page);
  }

  async doCheckout(): Promise<boolean> {
    let currentState: State | undefined = undefined;
    do {
      const previousState: State | undefined = currentState;

      currentState = await this.getCurrentState();

      if (!currentState) break;

      if (previousState?.name === currentState.name) {
        logger.info(`Trying to reenter: ${currentState?.name}, stopping`);
        break;
      }

      logger.info(`Transitioning from state: ${currentState.name}`);
      await currentState?.doTransition();
    } while (!currentState?.isFinaleState);

    if (currentState === undefined) {
      logger.info('Stopping since no current state matching');
      return false;
    }

    return this.success;
  }

  async onPurchaseComplete() {
    logger.info(
      `Purchase comple: ${this.link.brand} ${this.link.series} for ${this.link.price}`
    );
    await this.callback?.onPurchaseComplete(this.link);
  }

  private async getCurrentState() {
    const currentState = await asyncMaxPrioritized(
      this.states,
      async state => await state.isInCurrentState()
    );

    if (!currentState) {
      logger.info('No current state found');
      return undefined;
    }

    logger.info(`Current state: ${currentState.name}`);

    return currentState;
  }
}
