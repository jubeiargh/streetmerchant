import {State} from '../state';
import {StateMachine, StateMachineContext} from '../state-machine';
import {NotebooksbilligerPage} from './notebooksbilliger.state';
import {ProductPage} from './product-page.state';

export class NvidiaDeStateMachine extends StateMachine {
  _states: {[key: string]: State} = {
    ProductPageState: new ProductPage({stateMachine: this}),
    NotebooksbilligerPage: new NotebooksbilligerPage({stateMachine: this}),
  };

  constructor(context: StateMachineContext) {
    super(context);
  }
}
