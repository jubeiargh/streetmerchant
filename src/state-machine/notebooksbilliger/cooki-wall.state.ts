import {State, Priorities} from '../state';

export class CookieWallState extends State {
  name = 'CookieWall';
  isFinaleState = false;
  priority = Priorities.HighPriority;

  async isInCurrentState(): Promise<boolean> {
    // bannerDiv is existing
    const bannerDivId = '#uc-main-banner';
    return await this.pageHasElement(bannerDivId);
  }

  async doTransition(): Promise<boolean> {
    const cookieAcceptButtonSelector = '#uc-btn-deny-banner';
    await this.page().waitForSelector(cookieAcceptButtonSelector);
    await this.cursor().click(cookieAcceptButtonSelector);

    const result = await this.pageWillHaveElement('#uc-main-banner');

    return result !== undefined;
  }
}
