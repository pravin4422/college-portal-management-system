FROM tomcat:11.0-jre17

RUN apt-get update && apt-get install -y openjdk-17-jdk

RUN rm -rf /usr/local/tomcat/webapps/examples \
           /usr/local/tomcat/webapps/docs \
           /usr/local/tomcat/webapps/host-manager \
           /usr/local/tomcat/webapps/manager

COPY ./src /app/src
COPY ./web /usr/local/tomcat/webapps/ROOT

RUN mkdir -p /usr/local/tomcat/webapps/ROOT/student_uploads

RUN curl -L -o /usr/local/tomcat/webapps/ROOT/WEB-INF/lib/jakarta.mail-2.0.1.jar \
    https://repo1.maven.org/maven2/com/sun/mail/jakarta.mail/2.0.1/jakarta.mail-2.0.1.jar

RUN echo "=== JARs in WEB-INF/lib ===" && ls /usr/local/tomcat/webapps/ROOT/WEB-INF/lib/

RUN mkdir -p /usr/local/tomcat/webapps/ROOT/WEB-INF/classes && \
    find /app/src/jun_26 -name "*.java" > /tmp/sources.txt && \
    cat /tmp/sources.txt && \
    javac -d /usr/local/tomcat/webapps/ROOT/WEB-INF/classes \
    -cp "/usr/local/tomcat/lib/*:/usr/local/tomcat/webapps/ROOT/WEB-INF/lib/*" \
    @/tmp/sources.txt && \
    echo "=== Compiled classes ===" && find /usr/local/tomcat/webapps/ROOT/WEB-INF/classes -name "*.class"

EXPOSE 8080
CMD ["catalina.sh", "run"]
