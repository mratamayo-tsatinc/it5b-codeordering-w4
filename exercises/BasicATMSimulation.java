/*
 * Basic ATM Simulation
 * Sample Output:
 * Current Balance: 1000
 * Enter amount to withdraw: 200
 * New balance: 800
 * 
 */

import java.util.Scanner;

public class BasicATMSimulation {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int balance = 1000;
        int withdraw;

        System.out.println("Current Balance: " + balance);
        System.out.print("Enter amount to withdraw: ");
        withdraw = scanner.nextInt();

        balance = balance - withdraw;
        System.out.println("New balance: " + balance);

        scanner.close();
    }
}
