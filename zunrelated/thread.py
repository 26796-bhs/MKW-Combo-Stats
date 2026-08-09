import threading
import time

def print_numbers():
    for i in range(1, 6):
        time.sleep(1)
        print(i)

threading.Thread(target=print_numbers).start()

print("Main thread end")
