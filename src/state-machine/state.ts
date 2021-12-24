import {logger} from '../logger';
import {StateMachine} from './state-machine';

export type StatePriority = number;
export class Priorities {
  static readonly DefaultPriority: StatePriority = 0;
  static readonly MaxPriority: StatePriority = Number.MAX_SAFE_INTEGER;
  static readonly LowPriority: StatePriority = 10;
  static readonly MediumPriority: StatePriority = 20;
  static readonly HighPriority: StatePriority = 30;
}

export type StateContext = {stateMachine: StateMachine};

export abstract class State {
  stateMachine: StateMachine;
  priority: StatePriority = Priorities.DefaultPriority;
  constructor(context: StateContext) {
    this.stateMachine = context.stateMachine;
  }
  abstract name: string;
  abstract isFinaleState: boolean;
  abstract isInCurrentState(): Promise<boolean>;
  abstract doTransition(): Promise<boolean>;

  page = () => this.stateMachine.page;
  link = () => this.stateMachine.link;
  store = () => this.stateMachine.store;
  cursor = () => this.stateMachine.cursor;

  clickNavigate = async (selector: string) => {
    await Promise.all([
      this.page().waitForNavigation(),
      this.cursor().click(selector),
    ]);
  };

  clickWaitForCondition = async (selector: string, condition: Function) => {
    await Promise.all([condition, this.cursor().click(selector)]);
  };

  async pageHasElement(selector: string) {
    try {
      await this.page().$eval(selector, element => {
        return element !== null;
      });

      return true;
    } catch (err) {
      logger.debug(`Element ${selector} not found`);
    }
    return false;
  }

  async pageWillHaveElement(selector: string, timeout = 1000) {
    try {
      await this.page().waitForFunction(
        () => {
          return document.querySelector(selector) === null;
        },
        {
          timeout,
        }
      );
      return true;
    } catch (err) {
      logger.debug(`Element ${selector} not found`);
    }
    return false;
  }
}
