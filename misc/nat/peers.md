# Peer to peer communication

When a computer is connected to internet trough an Internet box, a mobile device Hot Spot or a public Wifi, it does not have a public IP address on the internet.
Instead, it belongs to a [private network](https://en.wikipedia.org/wiki/Private_network) (typically with private IP address in the 172.16.0.0/12 OR 192.168.0.0/16 subdomain range).
- Outgoing request *to* the web are forwarded by a [NAT](https://fr.wikipedia.org/wiki/Network_address_translation) router built in the Internet box.
- Incoming request *from* the web are blocked by default. To be able to accept incoming request the NAT must be informed which machine on the local private network shall receive message from outside.

Workaround used:
- Users manually set port forwarding NAT settings.
- Peer to peer program [programmatically](http://miniupnp.free.fr/) set port forwarding through UPnP or NAT-PMP for remote NAT configuration.
- NAT [hole punching](https://en.wikipedia.org/wiki/Hole_punching_(networking))
- connect to a VPN that provides a public IP and incoming connections
- create a tunnel (with [ssh](https://www.ssh.com/ssh/tunneling/example)) to a remote device with public IP

Peer to peer programs often use a combination of those.

# NAT hole punching

Tracker: <http://kljh-peer-tracker.azurewebsites.net?id=SomeoneReadingTheDoc>
