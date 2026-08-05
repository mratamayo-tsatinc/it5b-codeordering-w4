/*
 * Rectangle Perimeter Calculator
 * Sample Output:
 * Length: 5
 * Width: 3
 * Perimeter is 16
 */

import java.util.Scanner;

public class RectanglePerimeter {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int length, width, peri;

        System.out.print("Length: ");
        length = scanner.nextInt();

        System.out.print("Width: ");
        width = scanner.nextInt();

        peri = 2 * (length + width);
        System.out.print("Perimeter is " + peri);

        scanner.close();
    }
}
