import {sendCustomTelegramMessage} from '../../messaging/telegram';
import {State} from '../state';

export class ThreeDSPage extends State {
  name = 'ThreeDSPage';
  isFinaleState = false;

  async isInCurrentState(): Promise<boolean> {
    return this.page().url().startsWith('https://threedssvc.pay1.de/3ds/');
  }

  async doTransition(): Promise<boolean> {
    sendCustomTelegramMessage(
      `ASHALAMALA ALA NOREY!\nPurchase almost complete, confirmation might be missing.\n${
        this.link().brand
      }, ${this.link().series}, ${this.link().price}, ${this.link().url}`
    );
    await this.page().waitForNavigation({timeout: 300000});

    return true;
  }
}
