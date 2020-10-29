echo "IDENTITY_ENDPOINT $IDENTITY_ENDPOINT"
echo "IDENTITY_HEADER $IDENTITY_HEADER"

curl --insecure $IDENTITY_ENDPOINT'?api-version=2019-08-01&resource=https://vault.azure.net/' -H "Secret: $IDENTITY_HEADER"

echo "MSI_ENDPOINT $MSI_ENDPOINT"
echo "MSI_SECRET $MSI_SECRET"

curl --insecure $MSI_ENDPOINT'?api-version=2017-09-01&resource=https://vault.azure.net/' -H "Secret: $MSI_SECRET"