#!/bin/bash
#Usage: <CF Token> <CF Email> <mPulse Host (c.go-mpulse.net or c-lt2.go-mpulse.net or rum-dev-collector.soasta.com)> <file of mPulse API KEYs to purge>

export cfTOKEN=$1
export cfEMAIL=$2
export mpHOST=$3
export mpAPIKEYS=$4

export WORKING_DIR=./BoomerangUpdate
export LOG=$WORKING_DIR/cf-cache-log.`date +%Y-%m-%d-%H%M%S`.log

if [ $# -lt 4 -o -z "$cfTOKEN" -o -z "$cfEMAIL" -o -z "$mpHOST" -o -z "$mpAPIKEYS" ]; then
	echo "Usage: <CF Token> <CF Email> <mPulse Host> <API KEY file>"
	echo ""
	echo "    <CF Token>       Token from CloudFlare account page <https://www.cloudflare.com/my-account.html>"
	echo "    <CF Email>       Email address to sign into CloudFlare"
	echo "    <mPulse Host>    Collector hostname, eg: c.go-mpulse.net or c-lt2.go-mpulse.net or rum-dev-collector.soasta.com"
	echo "    <API KEY file>   File containing mPulse API KEYs, one per line.  Comments start with #"
	exit
fi

if [ ! -s "$mpAPIKEYS" ]; then
	echo "$mpAPIKEYS does not exist or is empty"
	exit
fi

total=$( grep -E "^[A-Z0-9]+-" "$mpAPIKEYS" | sort -n | uniq | wc -l | sed -e 's/  *//' )

if [ $total -eq 0 ]; then
	echo "$mpAPIKEYS does not contain any usable API Keys"
	exit
fi

cfZONE=""

if echo $mpHOST | grep -q "\.go-mpulse.net$" &>/dev/null; then
	cfZONE="go-mpulse.net"
elif echo $mpHOST | grep -q "\.soasta.com$" &>/dev/null; then
	cfZONE="soasta.com"
else
	echo "Unsupported host $mpHOST, needs to be in go-mpulse.net or soasta.com zones"
	exit
fi

if [ ! -d ${WORKING_DIR} ]; then
        mkdir ${WORKING_DIR}
fi

result=$(curl -X GET "https://api.cloudflare.com/client/v4/zones?name=$cfZONE&status=active" \
	     -H "X-Auth-Email: $cfEMAIL" \
	     -H "X-Auth-Key: $cfTOKEN" \
	     -H "Content-Type: application/json"  \
	  | tee -a $LOG )

if echo $result | grep -q '"success":true' &>/dev/null; then
	zoneID=$( echo $result | sed -e "s/.*\"id\":\"\\([a-z0-9]*\\)\",\"name\":\"$cfZONE\",.*/\\1/" )
else
	echo "Error: "
	echo $result | sed -e 's/.*"errors":\[//; s/\].*//;'
	echo "See https://api.cloudflare.com/#zone-errors for details"
	exit
fi

current=1

echo "Starting to purge individual file cache for zone $cfZONE" | tee $LOG

for APIKEY in $( grep -E "^[A-Z0-9]+-" "$mpAPIKEYS" | sort -n | uniq ); do
	
	echo "Purging $APIKEY... ($current/$total)" | tee -a $LOG
	current=$(( $current+1 ))

	ok=0
	retries=3
	while [ $ok -eq 0 ]; do

		retries=$(( $retries-1 ))

		echo "curl -X DELETE \"https://api.cloudflare.com/client/v4/zones/$zoneID/purge_cache\" \
			  -H \"X-Auth-Email: $cfEMAIL\" \
			  -H \"X-Auth-Key: $cfTOKEN\" \
			  -H \"Content-Type: application/json\"  \
			  --data \"{\\\"files\\\":[\\\"http://$mpHOST/boomerang/$APIKEY\\\",\\\"https://$mpHOST/boomerang/$APIKEY\\\"]}\"" >> $LOG
		echo -n "    //$mpHOST/boomerang/$APIKEY - "

		result=$( curl -X DELETE "https://api.cloudflare.com/client/v4/zones/$zoneID/purge_cache" \
			  -H "X-Auth-Email: $cfEMAIL" \
			  -H "X-Auth-Key: $cfTOKEN" \
			  -H "Content-Type: application/json"  \
			  --data "{\"files\":[\"http://$mpHOST/boomerang/$APIKEY\",\"https://$mpHOST/boomerang/$APIKEY\"]}" 2>/dev/null \
			| tee -a $LOG )

		if echo $result | grep -q '"success":true' &>/dev/null; then
			echo -e "\033[0;32mdone\033[0m"
			echo "$PROTO - done" >> $LOG
			ok=1
		elif echo $result | grep '"errors":\[[^\]][^\]]*\]' &>/dev/null; then
			echo "Error: "
			echo $result | sed -e 's/.*"errors":\[//; s/\].*//;'
			echo "See https://api.cloudflare.com/#zone-errors for details"
			exit
		else
			echo "Something went wrong, check $LOG" | tee -a $LOG
			exit
		fi
	done
	if [ $total -gt 50 ]; then
		sleep 1;
	fi
done

echo "All done" | tee -a $LOG
