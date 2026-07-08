package jun_24;
import java.util.*;
public class Main {
    public static void main (String [] args){
        Scanner sc = new Scanner(System.in);
        ArrayList ids = new ArrayList();
        ArrayList names = new ArrayList();
        ArrayList aga = new ArrayList();
        ArrayList mark = new ArrayList();
        boolean flag = true;
        while(flag){
            System.out.println("CRUD Operation");
            System.out.println("1.Create the new object or enter the new person details");
            System.out.println("2.Read the excisting file data");
            System.out.println("3.Update the data");
            System.out.println("4.Delete the data");
            System.out.println("5.Exit");
            int choice = sc.nextInt();
            switch (choice){
                case 1:
                    System.out.print("Enter ID: ");
                    int id = sc.nextInt();
                    sc.nextLine();
                    System.out.print("Enter Name: ");
                    String name = sc.nextLine();
                    System.out.print("Enter Age: ");
                    int age = sc.nextInt();
                    System.out.print("Enter Mark: ");
                    double m = sc.nextDouble();
                    Create(id, name, age, m, ids, names, aga, mark);
                    break;
                case 2:
                    Read(ids, names, aga, mark);
                    break;
                case 3:
                    System.out.print("Enter the ID of the record you want to update: ");
                    int searchId = sc.nextInt();
                    int index = ids.indexOf(searchId);

                    if (index == -1) {
                        System.out.println("ID not found. Cannot update.");
                    } else {
                        Update(index, ids, names, aga, mark, sc);
                    }
                    break;
                case 4:
                    System.out.print("Enter the ID of the record you want to delete: ");
                    int deleteId = sc.nextInt();
                    int deleteIndex = ids.indexOf(deleteId);

                    if (deleteIndex == -1) {
                        System.out.println("ID not found. Cannot delete.");
                    } else {
                        Delete(deleteIndex, ids, names, aga, mark);
                    }
                    break;
                case 5:
                    System.out.println("Exiting.........");
                    flag = false;
                    break;
                default:System.out.println("Enter the valid number");
            }
        }
    }

    private static void Read(ArrayList ids, ArrayList names, ArrayList aga, ArrayList mark) {
        if (ids.isEmpty()) {
            System.out.println("No data found Please create a record first.");
            return;
        }

        System.out.println("\nExisting Records");
        for (int i = 0; i < ids.size(); i++) {
            System.out.println("Student record [" + i + "] -> ID: " + ids.get(i) +
                    ", Name: " + names.get(i) +
                    ", Age: " + aga.get(i) +
                    ", Mark: " + mark.get(i));
            System.out.println();
        }
    }

    public static void Create(int id, String name,int age, double mark,ArrayList ids,ArrayList names,ArrayList ages, ArrayList marks){
            ids.add(id);
            names.add(name);
            ages.add(age);
            marks.add(mark);
    }
    public static void Update(int index, ArrayList ids, ArrayList names, ArrayList ages, ArrayList marks, Scanner sc) {
        System.out.println("\nWhat would you like to update?");
        System.out.println("1. Update Name");
        System.out.println("2. Update Age");
        System.out.println("3. Update Mark");
        System.out.println("4. Update All Fields");
        System.out.print("Enter your choice: ");
        int choice = sc.nextInt();
        sc.nextLine();

        switch (choice) {
            case 1:
                System.out.print("Enter new Name: ");
                names.set(index, sc.nextLine());
                System.out.println("Name updated successfully");
                break;
            case 2:
                System.out.print("Enter new Age: ");
                ages.set(index, sc.nextInt());
                System.out.println("Age updated successfully");
                break;
            case 3:
                System.out.print("Enter new Mark: ");
                marks.set(index, sc.nextDouble());
                System.out.println("Mark updated successfully");
                break;
            case 4:
                System.out.print("Enter new Name: ");
                names.set(index, sc.nextLine());
                System.out.print("Enter new Age: ");
                ages.set(index, sc.nextInt());
                System.out.print("Enter new Mark: ");
                marks.set(index, sc.nextDouble());
                System.out.println("All fields updated successfully");
                break;
            default:
                System.out.println("Invalid choice. Returning to main menu.");
        }
    }
    public static void Delete(int index, ArrayList ids, ArrayList names, ArrayList ages, ArrayList marks) {
        ids.remove(index);
        names.remove(index);
        ages.remove(index);
        marks.remove(index);

        System.out.println("Record deleted successfully");
    }

}
