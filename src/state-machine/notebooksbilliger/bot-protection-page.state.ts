import {pageIncludesLabels} from '../../store/includes-labels';
import {State, Priorities} from '../state';

export class BotProtectionPage extends State {
  name = 'BotProtectionPage';
  isFinaleState = true;
  priority = Priorities.MaxPriority;

  async isInCurrentState(): Promise<boolean> {
    return await pageIncludesLabels(
      this.page(),
      {text: ['client has been blocked by bot protection']},
      {
        requireVisible: true,
        selector: 'body',
        type: 'textContent',
      }
    );
  }

  async doTransition(): Promise<boolean> {
    this.stateMachine.success = false;
    this.stateMachine.error = 'blocked by bot protection';
    return true;
  }
}
