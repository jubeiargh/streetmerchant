import {State, Priorities, StateContext} from '../state';

export class ProductPageState extends State {
  name = 'ProductDetailPage';
  isFinaleState = false;
  priority = Priorities.DefaultPriority;

  constructor(context: StateContext) {
    super(context);
  }

  async isInCurrentState(): Promise<boolean> {
    return await this.pageHasElement('#product_page_detail');
  }

  async doTransition(): Promise<boolean> {
    const addToCartButtonSelector = ".shopping_cart_btn button[type='submit']";
    await this.page().waitForSelector(addToCartButtonSelector);
    await this.clickNavigate(addToCartButtonSelector);
    return true;
  }
}

export class ProductPageOverlayState extends State {
  name = 'ProductDetailOverlayPage';
  isFinaleState = false;
  priority = Priorities.LowPriority;

  async isInCurrentState(): Promise<boolean> {
    return this.page().url().includes('action/productpopup/location/product');
  }

  async doTransition(): Promise<boolean> {
    const toCartButtonSelector = 'a#cartlayer_link_checkout';
    await this.page().waitForSelector(toCartButtonSelector);
    await this.clickNavigate(toCartButtonSelector);
    return true;
  }
}
