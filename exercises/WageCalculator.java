/*
 * Wage Calculator
 * Sample Output:
 * Pay: $620.00
 */

public class WageCalculator {
    public static void main(String[] args) {
        int hours = 40;
        float rate = 15.50f;
        float total;

        total = hours * rate;
        System.out.print("Pay: $" + total); // 2 decimal places
    }
}
