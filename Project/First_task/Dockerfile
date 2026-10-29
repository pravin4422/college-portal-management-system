FROM tomcat:11.0-jre17

RUN apt-get update && apt-get install -y openjdk-17-jdk

# Remove default webapps but keep ROOT so DefaultServlet is active
RUN rm -rf /usr/local/tomcat/webapps/examples \
           /usr/local/tomcat/webapps/docs \
           /usr/local/tomcat/webapps/host-manager \
           /usr/local/tomcat/webapps/manager

COPY ./src /app/src
COPY ./web /usr/local/tomcat/webapps/ROOT

# Create upload directory inside the container
RUN mkdir -p /usr/local/tomcat/webapps/ROOT/student_uploads

RUN curl -L -o /usr/local/tomcat/webapps/ROOT/WEB-INF/lib/jakarta.mail-2.0.1.jar \
    https://repo1.maven.org/maven2/com/sun/mail/jakarta.mail/2.0.1/jakarta.mail-2.0.1.jar

# Show what JARs are present (visible in Railway build logs)
RUN echo "=== JARs in WEB-INF/lib ===" && ls /usr/local/tomcat/webapps/ROOT/WEB-INF/lib/

# Compile only the jun_26 servlet package; fail loudly on any error
RUN mkdir -p /usr/local/tomcat/webapps/ROOT/WEB-INF/classes && \
    find /app/src/jun_26 -name "*.java" > /tmp/sources.txt && \
    cat /tmp/sources.txt && \
    javac -d /usr/local/tomcat/webapps/ROOT/WEB-INF/classes \
    -cp "/usr/local/tomcat/lib/*:/usr/local/tomcat/webapps/ROOT/WEB-INF/lib/*" \
    @/tmp/sources.txt && \
    echo "=== Compiled classes ===" && find /usr/local/tomcat/webapps/ROOT/WEB-INF/classes -name "*.class"

EXPOSE 8080
CMD ["catalina.sh", "run"]
