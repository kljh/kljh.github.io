from threading import Thread
import socket
import os
import json

TRACKER_SERVER = ("localhost", 8420)
TRACKER_SERVER = ("35.180.20.122", 8420)

TRACKER_HTTP_SERVER = ("localhost", 8086)
TRACKER_HTTP_SERVER = ("kljh.herokuapp.com", 80)
TRACKER_HTTP_SERVER = ("kljh-peer-tracker.azurewebsites.net", 80) #  443
TRACKER_HTTP_URL = "/" #public/peers"

my_id = "xkcd"+str(os.getpid())
print("my_id", my_id, "\n")

def register_with_tracker_tcp():
	print("register_with_tracker_tcp...")
	# register with the main server and get list of peers
	s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
	s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
	s.connect(TRACKER_SERVER)
	s.send(("\x00"+my_id).encode())
	print(s.recv(1024))
	s.send(b"\x01")
	peers = json.loads(s.recv(1024))
	return s, peers

def register_with_tracker_http():
	print("register_with_tracker_http...")
	# register with the main server and get list of peers
	s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
	s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
	s.connect(TRACKER_HTTP_SERVER)

	host = TRACKER_HTTP_SERVER[0]
	if TRACKER_HTTP_SERVER[1]!=80: host = host +":"+str(TRACKER_HTTP_SERVER[1])
	print("host", host)

	http_frame = "GET "+TRACKER_HTTP_URL+"?id="+my_id+" HTTP/1.1\r\n" + \
		"Host: "+host+"\r\n" + \
		"Connection: Keep-Alive\r\n" + \
		"\r\n\r\n"
	#http_frame = "GET /static/?static=kljh HTTP/1.1\r\nHost: localhost:8086\r\n\r\n"
	#print("request:", http_frame)
	#print("request frame:", http_frame.encode("utf-8"))

	s.send(http_frame.encode("utf-8"))

	reply = b''
	while True:
		http_frame = s.recv(1024)
		print("reply frame:", http_frame)
		if not http_frame: break
		reply += http_frame
		if b'0\r\n\r\n' in http_frame : break
	reply = reply.decode("utf-8").replace("\r", "")
	print("\nreply\n:" + reply + "\n")

	tmp = reply.strip().split('\n')
	tmp.pop()
	body = tmp.pop()
	print("reply body:", body)

	peers = json.loads(body)
	return s, peers

# binding on the socket we opened
def listen_on_nat_pinhole_handler(socket_to_tracker) :

	ip_port_socket_to_tracker = socket_to_tracker.getsockname()
	print("ip_port_socket_to_tracker", ip_port_socket_to_tracker)

	ss = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
	ss.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
	ss.bind(ip_port_socket_to_tracker)
	ss.listen(1)
	conn, addr = ss.accept()
	print("received from peer", conn.recv(1024))

listener_thread = None
def listen_on_nat_pinhole(s) :
	global listener_thread

	listener_thread = Thread(target=listen_on_nat_pinhole_handler, args=(s))
	listener_thread.daemon = True
	listener_thread.start()


def request_to_peers(peers):
	print("#peers", len(peers))
	print("peers[myid]", peers[my_id])
	print("peers", peers)
	for id in peers :
		peer = peers[id]

		#host = tuple(peer)
		tmp = peer["c"].split(':')
		host = (tmp[0], int(tmp[1]))

		print("id", id, "host", host)
		try :
			msg = b"hello "+id.encode("utf-8")+b" from "+my_id.encode("utf-8")
			s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
			s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
			s.connect(host)
			s.send(msg)
			rep = s.recv(1024)
			print("reply from peer", id, ":", rep)
		except Exception as e:
			print("NO reply from peer", id, e)


if __name__ == "__main__":
	tracker_socket, peers = register_with_tracker_http()
	listen_on_nat_pinhole(tracker_socket)
	request_to_peers(peers)