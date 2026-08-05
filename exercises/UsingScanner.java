/*
 * Using scanf - Demonstrates input reading
 * Sample Output:
 * Enter a number: 42
 * You entered: 42
 * 
 */

import java.util.Scanner;

public class UsingScanner {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int number;

        System.out.print("Enter a number: ");
        number = scanner.nextInt();
        System.out.println("You entered: " + number);

        scanner.close();
    }
}
