package game;

import exceptions.GameFailureException;
import trading.TradingStrategy;


public class TestImplementation {
	private static final int INITIAL_CAPITAL = 10000;

	public static void main(String[] args) throws GameFailureException {

		Game game = new Game("My Team", new TradingStrategy(new TradingManager(INITIAL_CAPITAL, 0)));
		game.run();

	}
}
