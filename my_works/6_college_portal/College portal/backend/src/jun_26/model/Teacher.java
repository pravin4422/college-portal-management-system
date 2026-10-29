package jun_26.model;

public class Teacher {
    private int id;
    private String userEmail;
    private String name;
    private String employeeId;
    private String dob;
    private String gender;
    private String phone;
    private String address;
    private String qualification;
    private String experience;
    private String department;
    private String designation;
    private String joinDate;
    private String classTeacherOf;
    private String subjectClasses; // comma-separated e.g. "10A,10B,9A"

    public Teacher() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }
    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }
    public String getJoinDate() { return joinDate; }
    public void setJoinDate(String joinDate) { this.joinDate = joinDate; }
    public String getClassTeacherOf() { return classTeacherOf; }
    public void setClassTeacherOf(String classTeacherOf) { this.classTeacherOf = classTeacherOf; }
    public String getSubjectClasses() { return subjectClasses; }
    public void setSubjectClasses(String subjectClasses) { this.subjectClasses = subjectClasses; }
}
