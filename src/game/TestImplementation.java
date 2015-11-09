package game;

import exceptions.GameFailureException;
import trading.TradingStrategy;


public class TestImplementation {
	private static final int INITIAL_CAPITAL = 10000;

	public static void main(String[] args) throws GameFailureException {

		// TODO Refactor. Reverse this such that TradingManager takes TradStrat interface
		// That way we don't have to set initial_capital
		Game game = new Game(new TradingStrategy(new TradingManager(INITIAL_CAPITAL, 0)));
		game.run();

	}
}
