import {NotebooksbilligerStateMachine} from '../notebooksbilliger/notebooksbillger.state-machine';
import {State} from '../state';

export class NotebooksbilligerPage extends State {
  name = 'NotebooksbilligerProductPage';
  isFinaleState = false;

  async isInCurrentState(): Promise<boolean> {
    return this.page().url().startsWith('https://www.notebooksbilliger.de');
  }

  async doTransition(): Promise<boolean> {
    const nextStateMachine = new NotebooksbilligerStateMachine({
      page: this.page(),
      cursor: this.cursor(),
      store: this.store(),
      link: this.link(),
      callback: this.stateMachine.callback,
    });

    await nextStateMachine.doCheckout();
    return true;
  }
}
