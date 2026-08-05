/*
 * Invoice Generation
 * Sample Output:
 * Invoice for Customer: John Doe
 * Order ID: 12345
 * Total Amount: $99.99
 */

public class InvoiceGeneration {
    public static void main(String[] args) {
        String name = "John Doe";
        int id = 12345;
        float amount = 99.99f;

        System.out.print("Invoice for Customer: " + name + "\nOrder ID: " + id + "\nTotal Amount: $" + amount);
    }
}
