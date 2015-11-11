package trading_game;

import game.DailyInput;
import game.DailyOutput;
import game.TradingManager;
import tradingstrategy.BaseTradingStrategy;
import exceptions.InsufficientFundsException;
import exceptions.InsufficientSharesException;

public class TradingStrategy extends BaseTradingStrategy {

	@Override
	public DailyOutput makeDailyTrade(DailyInput input) throws InsufficientFundsException, InsufficientSharesException {
		//use the trading manager to make trades based on input
		
		
		DailyOutput output;
		if (input.getDay() % 2 == 0) {
			output = tradingManager.buyMaxNumberOfShares(input);
		} else {
			output = tradingManager.sellAllShares(input);
		}
		
		return output;
	}

}
