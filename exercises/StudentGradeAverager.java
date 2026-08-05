/*
 * Student Grade Averager
 * Sample Output:
 * Enter three marks: 85 90 95
 * Average is: 90.000000
 */

import java.util.Scanner;

public class StudentGradeAverager {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        float m1, m2, m3, avg;

        System.out.print("Enter three marks: ");
        m1 = scanner.nextFloat();
        m2 = scanner.nextFloat();
        m3 = scanner.nextFloat();

        avg = (m1 + m2 + m3) / 3.0f;
        System.out.print("Average is: " + avg);

        scanner.close();
    }
}
