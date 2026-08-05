/*
 * Celsius to Fahrenheit Converter
 * Sample Output:
 * Enter Celsius: 25
 * Fahrenheit: 77.0
 * 
 */

import java.util.Scanner;

public class CtoF {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        float celsius, fahr;

        System.out.print("Enter Celsius: ");
        celsius = scanner.nextFloat();

        fahr = (celsius * 9 / 5) + 32.0f;
        System.out.println("Fahrenheit: " + fahr);

        scanner.close();
    }
}
