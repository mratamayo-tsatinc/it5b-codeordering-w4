/*
 * Product Discount Calculator (10% discount)
 * Sample Output:
 * Price: 100
 * Final Price: 90.00
 */

import java.util.Scanner;

public class ProductDiscountCalculator {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        double price, discount, total;

        System.out.print("Price: ");
        price = scanner.nextDouble();

        discount = price * 0.10;
        total = price - discount;

        System.out.print("Final Price: " + total);

        scanner.close();
    }
}
