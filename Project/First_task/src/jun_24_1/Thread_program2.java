package jun_24_1;
class Logger {
    public synchronized void log(String msg) {
        System.out.println("[LOG]: " + msg);
    }
}
public class Thread_program2 {


    public static class Thread_Program extends Thread {
        private Logger logger;

        public Thread_Program(Logger logger) {
            this.logger = logger;
        }

        public static void main(String[] args) throws InterruptedException {
            Logger kitchenLogger = new Logger();

            Thread_Program kettle = new Thread_Program(kitchenLogger);
            kettle.start();

            for (int i = 1; i <= 3; i++) {
                kitchenLogger.log("Chef: Chopping batch " + i);
                Thread.sleep(500);
            }

            kettle.join();
            System.out.println("Dinner complete!");
        }

        @Override
        public void run() {
            try {
                logger.log("Kettle: Heating up...");
                Thread.sleep(1200);
                logger.log("Kettle: Water boiled!");
            } catch (InterruptedException e) {
                System.out.println("Kettle stopped!");
            }
        }
    }
}
