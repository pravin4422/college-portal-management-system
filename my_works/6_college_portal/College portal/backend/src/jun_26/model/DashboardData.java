package jun_26.model;

public class DashboardData {
    private int id;
    private String studentId;
    private String dataType;
    private String content;
    private String updatedAt;

    public DashboardData() {}

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getDataType() { return dataType; }
    public void setDataType(String dataType) { this.dataType = dataType; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
