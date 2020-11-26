
require("fs").writeFileSync("./.env", `# Environment
ENABLE_HTTP=true
HTTP_PORT=8000

ENABLE_HTTPS=false
HTTPS_PORT=443
HTTPS_KEY=keys/private.key
HTTPS_CERT=keys/certificate.crt

VOTE_THRESHOLD_EQUATION=(4-0.1*voters)+(100^(-hours+1.5)+1.03^(-hours+48))
VOTE_SCORES_EQUATION=-2^(-hours*1.8)+1

IP_DUPLICATION_KEY=
IP_FORWARDING=false
DEV_VOTE_NO_CHECK=false
DATALOG_SHEET_ID=

SERVER_NAME=Elemental 4 Server
SERVER_DESCRIPTION=An Elemental 4 Server
SERVER_ICON=https://elemental4.net/custom-server.png
`);
