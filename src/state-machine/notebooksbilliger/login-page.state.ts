import {config} from '../../config';
import {State} from '../state';

export class LoginPage extends State {
  name = 'LoginPage';
  isFinaleState = false;

  async isInCurrentState(): Promise<boolean> {
    return this.page()
      .url()
      .includes('www.notebooksbilliger.de/kasse/anmelden/cartlayer/1');
  }

  async doTransition(): Promise<boolean> {
    const emailSelector = 'form input[type="email"]#f_email_address';
    await this.page().waitForSelector(emailSelector);

    const passwordSelector = 'form input[type="password"]#f_password';
    await this.page().waitForSelector(passwordSelector);

    const loginButtonSelector = 'form button[name="login"]';
    await this.page().waitForSelector(loginButtonSelector);

    await this.page().type(emailSelector, config.purchase.email, {
      delay: 20,
    });

    await this.page().type(passwordSelector, config.purchase.password, {
      delay: 20,
    });

    await this.clickNavigate(loginButtonSelector);
    return true;
  }
}
