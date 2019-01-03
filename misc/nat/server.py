from threading import Thread
import json
import socket

clients = {}

def start_server():

	ss = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
	#ss.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
	ss.bind(('127.0.0.1', 8420))
	ss.listen(5)
	while True:
		conn, addr = ss.accept()
		thread = Thread(target=handler, args=(conn, addr))
		thread.daemon = True
		thread.start()
	ss.close()

def handler(conn, addr):
	user = None
	while True:
		data  = conn.recv(1024)

		if not data:
			break

		r = data[0]
		msg = data[1:].decode()

		if  r==0: # register

			user = msg
			clients[user] = addr
			conn.sendall(b"registered merci")

		elif r==1: # get registers

			conn.sendall(json.dumps(clients).encode())

	# clean-up
	del clients[user]
	conn.close()

start_server()
