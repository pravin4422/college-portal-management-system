public class threads_operations {
    public static void main(String[] args) {
        System.out.println("testing");
    }

    public static class Thread_Program extends Thread{


        public static void main(String[] args){
            Thread_Program threads = new Thread_Program();

            threads.start();
            System.out.println("Chef: Chopping vegetables simultaneously...");
        }
        public void run(){
            System.out.println("Kettle: Boiling water in the background...");
        }
    }
}