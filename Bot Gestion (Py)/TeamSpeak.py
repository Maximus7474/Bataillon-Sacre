# import ts3

# def query_teamspeak_server(server_ip, server_query_port, server_port, server_password):
#     with ts3.query.TS3Connection(server_ip, server_query_port) as ts3conn:
#         try:
#             # Authenticate with the server using the provided password
#             ts3conn.login(client_login_name='bsstatbot', client_login_password=server_password)

#             # Use the server port to query information
#             ts3conn.use(sid=1, port=server_port)

#             # Get the number of connected clients
#             clients_response = ts3conn.clientlist()
#             connected_clients = len(clients_response.data)

#             # Get the ping to the server
#             ping_response = ts3conn.ping()
#             ping = ping_response.parsed[0]['connection_ping']

#             return connected_clients, ping
#         except ts3.query.TS3QueryError as err:
#             print("Error querying TeamSpeak server:", err)
#             return None, None

# # Example usage:
# server_ip = '213.239.218.16'
# server_query_port = 10011
# server_port = 30033  # default_voice_port
# server_password = 'dwAtih7N'

# connected_clients, ping = query_teamspeak_server(server_ip, server_query_port, server_port, server_password)
# if connected_clients is not None and ping is not None:
#     print("Number of connected clients:", connected_clients)
#     print("Ping to server:", ping)

import requests

key = 'BACzprQW_XYE7t6XCDJfC2EJwudNiU2T3D54HEK'
url = "http://localhost:10080/1/clientlist?api-key=" + key

print("On your server, the current clients are:")

data = requests.post(url)
clients = data.json()["body"]
print("\n".join([item["client_nickname"] for item in clients]))