/*
 * Name Input
 * Sample Output:
 * Enter your name: Alice
 * Welcome, Alice!
 * 
 */

import java.util.Scanner;

public class NameInput {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String name;

        System.out.print("Enter your name: ");
        name = scanner.nextLine();

        System.out.println("Welcome, " + name + "!");

        scanner.close();
    }
}
