package trading_game;

import game.DailyInput;
import game.DailyOutput;
import game.TradingManager;
import game.BaseTradingStrategy;
import exceptions.InsufficientFundsException;
import exceptions.InsufficientSharesException;

public class TradingStrategy extends BaseTradingStrategy {
	int counter = 0;
	public TradingStrategy (){
		// Initialise any variables needed.
		
	}
	
	@Override
	public DailyOutput makeDailyTrade(DailyInput input) throws InsufficientFundsException, InsufficientSharesException {
		
		// Use the trading manager to make trades based on input.
		
		DailyOutput output;
		if (input.getDay() % 2 == 0) {
			output = tradingManager.buyMaxNumberOfShares(input);
			counter++;
			
		} else {
			output = tradingManager.sellAllShares(input);
			counter++;
		}
		System.out.println(counter);
		
		return output;
	}
}
