# import ts3

# def query_teamspeak_server(server_ip, server_query_port, server_port, server_password):
#     with ts3.query.TS3Connection(server_ip, server_query_port) as ts3conn:
#         try:
#             # Authenticate with the server using the provided password
#             ts3conn.login(client_login_name='TS_tracker_bot', client_login_password=server_password)

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
# server_query_port = 10080
# server_port = 25577  # default_voice_port
# server_password = 'UExR5P5F'

# connected_clients, ping = query_teamspeak_server(server_ip, server_query_port, server_port, server_password)
# if connected_clients is not None and ping is not None:
#     print("Number of connected clients:", connected_clients)
#     print("Ping to server:", ping)

#!/usr/bin/python3

import requests

server_ip = '213.239.218.16'
http_port = 10080

response = requests.get(f'http://{server_ip}:{http_port}/serverinfo')
if response.status_code == 200:
    server_info = response.json()
    print("Server Info:", server_info)
else:
    print("Failed to retrieve server info. Status code:", response.status_code)

breakpoint

import ts3

with ts3.query.TS3Connection("213.239.218.16", 30033) as ts3conn:
    # Note, that the client will wait for the response and raise a
    # **TS3QueryError** if the error id of the response is not 0.
    try:
        ts3conn.login(
            client_login_name="BS_BOT",
            client_login_password="UExR5P5F"
        )
    except ts3.query.TS3QueryError as err:
        print("Login failed:", err.resp.error["msg"])
        exit(1)

    ts3conn.use(sid=1)

    # Each query method will return a **TS3QueryResponse** instance,
    # with the response.
    resp = ts3conn.clientlist()
    print("Clients on the server:", resp.parsed)
    print("Error:", resp.error["id"], resp.error["msg"])

    # Note, the TS3Response class and therefore the TS3QueryResponse
    # class too, can work as a rudimentary container. So, these two
    # commands are equal:
    for client in resp.parsed:
        print(client)
    for client in resp:
        print(client)