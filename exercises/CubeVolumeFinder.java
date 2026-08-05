/*
 * Cube Volume Finder
 * Sample Output:
 * Side: 3
 * Volume: 27
 */

import java.util.Scanner;

public class CubeVolumeFinder {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        int side, vol;

        System.out.print("Side: ");
        side = scanner.nextInt();

        vol = side * side * side;
        System.out.print("Volume: " + vol);

        scanner.close();
    }
}
