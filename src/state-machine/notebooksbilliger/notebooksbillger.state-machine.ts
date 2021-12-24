/**
 * Ausführer Klasse allgemein gültig
 * StateMachine Klasse pro Shop
 * n States pro StateMachine
 */
import {ThreeDSPage} from '../generic/3ds.state';
import {State} from '../state';
import {StateMachineContext, StateMachine} from '../state-machine';
import {BotProtectionPage} from './bot-protection-page.state';
import {
  CheckoutPage,
  LastConfirmationPage,
  SuccessPage,
} from './checkout-page.state';
import {CookieWallState} from './cooki-wall.state';
import {LoginPage} from './login-page.state';
import {ProductPageOverlayState, ProductPageState} from './product-page.state';

export class NotebooksbilligerStateMachine extends StateMachine {
  _states: {[key: string]: State} = {
    CookieWallState: new CookieWallState({stateMachine: this}),
    ProductPageState: new ProductPageState({stateMachine: this}),
    ProductPageOverlayState: new ProductPageOverlayState({stateMachine: this}),
    LoginPage: new LoginPage({stateMachine: this}),
    BotProtectionPage: new BotProtectionPage({stateMachine: this}),
    CheckoutPage: new CheckoutPage({stateMachine: this}),
    LastConfirmationPage: new LastConfirmationPage({stateMachine: this}),
    ThreeDSPage: new ThreeDSPage({stateMachine: this}),
    SuccessPage: new SuccessPage({stateMachine: this}),
  };

  constructor(context: StateMachineContext) {
    super(context);
  }
}
