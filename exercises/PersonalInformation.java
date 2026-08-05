/*
 * Personal Information Input
 * Sample Output:
 * Enter your name: John
 * Enter your age: 25
 * Enter your city: Manila
 * Name: John
 * Age: 25
 * City: Manila
 * 
 */

import java.util.Scanner;

public class PersonalInformation {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        String name;
        int age;
        String city;

        System.out.print("Enter your name: ");
        name = scanner.nextLine();

        System.out.print("Enter your age: ");
        age = scanner.nextInt();
        scanner.nextLine(); // consume leftover newline before reading city

        System.out.print("Enter your city: ");
        city = scanner.nextLine();

        System.out.println("Name: " + name + " \nAge: " + age + " \nCity: " + city);

        scanner.close();
    }
}
