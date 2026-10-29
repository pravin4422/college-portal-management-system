<%@ page import="java.util.*" %>
<html>
<body>
<h2>Simple Student Management</h2>

<!-- Form to Add Student -->
<form action="students?action=add" method="post">
    <input type="text" name="name" placeholder="Enter Name" required />
    <input type="email" name="email" placeholder="Enter Email" required />
    <button type="submit">Add Student</button>
</form>

<hr/>

<!-- Table to View & Delete Students -->
<table border="1" cellpadding="5">
    <tr>
        <th>ID</th><th>Name</th><th>Email</th><th>Action</th>
    </tr>
    <%
        List<Map<String, String>> list = (List<Map<String, String>>) request.getAttribute("students");
        if (list != null) {
            for (Map<String, String> s : list) {
    %>
    <tr>
        <td><%= s.get("id") %></td>
        <td><%= s.get("name") %></td>
        <td><%= s.get("email") %></td>
        <td>
            <!-- Delete Button sends ID back to servlet -->
            <form action="students?action=delete" method="post" style="display:inline;">
                <input type="hidden" name="id" value="<%= s.get("id") %>" />
                <button type="submit">Delete</button>
            </form>
        </td>
    </tr>
    <%
            }
        }
    %>
</table>
</body>
</html>
