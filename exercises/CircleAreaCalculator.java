/*
 * Circle Area Calculator
 * Sample Output:
 * Enter radius: 5
 * The area is: 78.54
 * 
 */

import java.util.Scanner;

public class CircleAreaCalculator {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        final float PI = 3.14159f;
        float radius, area;

        System.out.print("Enter radius: ");
        radius = scanner.nextFloat();

        area = PI * radius * radius;
        System.out.println("The area is: " + area);

        scanner.close();
    }
}
