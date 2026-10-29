package jun_26.model;

public class Student {
    private int id;
    private String firstName;
    private String dob;
    private String gender;
    private String classStudying;
    private String bloodType;
    private String address;
    private String guardianName;
    private String guardianPhone;
    private String guardianEmail;
    private String studentIdDocPath;
    private String recentPhotoPath;
    private String userEmail;
    private String rollNumber;

    public Student() {}

    public Student(String firstName, String dob, String gender, String classStudying,
                   String bloodType, String address, String guardianName,
                   String guardianPhone, String guardianEmail,
                   String studentIdDocPath, String recentPhotoPath) {
        this.firstName = firstName;
        this.dob = dob;
        this.gender = gender;
        this.classStudying = classStudying;
        this.bloodType = bloodType;
        this.address = address;
        this.guardianName = guardianName;
        this.guardianPhone = guardianPhone;
        this.guardianEmail = guardianEmail;
        this.studentIdDocPath = studentIdDocPath;
        this.recentPhotoPath = recentPhotoPath;
    }

    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getClassStudying() { return classStudying; }
    public void setClassStudying(String classStudying) { this.classStudying = classStudying; }
    public String getBloodType() { return bloodType; }
    public void setBloodType(String bloodType) { this.bloodType = bloodType; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getGuardianName() { return guardianName; }
    public void setGuardianName(String guardianName) { this.guardianName = guardianName; }
    public String getGuardianPhone() { return guardianPhone; }
    public void setGuardianPhone(String guardianPhone) { this.guardianPhone = guardianPhone; }
    public String getGuardianEmail() { return guardianEmail; }
    public void setGuardianEmail(String guardianEmail) { this.guardianEmail = guardianEmail; }
    public String getStudentIdDocPath() { return studentIdDocPath; }
    public void setStudentIdDocPath(String studentIdDocPath) { this.studentIdDocPath = studentIdDocPath; }
    public String getRecentPhotoPath() { return recentPhotoPath; }
    public void setRecentPhotoPath(String recentPhotoPath) { this.recentPhotoPath = recentPhotoPath; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getRollNumber() { return rollNumber; }
    public void setRollNumber(String rollNumber) { this.rollNumber = rollNumber; }
}
