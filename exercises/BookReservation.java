/*
 * Book Reservation
 * Sample Output:
 * You have successfully reserved the book 'The Great Gatsby' by F. Scott Fitzgerald.
 * Year of Publication: 1925
 * Genre: Fiction
 * Library: Central Library
 * Member ID: 12345
 * Return Date: June 30, 2023
 * 
 */

public class BookReservation {
    public static void main(String[] args) {
        String title = "The Great Gatsby";
        String author = "F. Scott Fitzgerald";
        int year = 1925;
        String genre = "Fiction";
        String library = "Central Library";
        String memberID = "12345";
        String returnDate = "June 30, 2023";

        System.out.println("You have successfully reserved the book '" + title + "' by " + author + ".");
        System.out.println("Year of Publication: " + year);
        System.out.println("Genre: " + genre);
        System.out.println("Library: " + library);
        System.out.println("Member ID: " + memberID);
        System.out.println("Return Date: " + returnDate);
    }
}
