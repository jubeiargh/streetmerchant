import {State} from '../state';

export class ProductPage extends State {
  name = 'ProductPage';
  isFinaleState = false;

  async isInCurrentState(): Promise<boolean> {
    return this.page()
      .url()
      .startsWith('https://store.nvidia.com/de-de/geforce/store/gpu');
  }

  async doTransition(): Promise<boolean> {
    const buySelector = 'div.buy .buy-link';
    await this.page().waitForSelector(buySelector);
    await this.clickNavigate(buySelector);
    return true;
  }
}
