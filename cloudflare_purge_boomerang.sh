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

current=1

echo "Starting to purge individual file cache for zone $cfZONE" | tee $LOG

for APIKEY in $( grep -E "^[A-Z0-9]+-" "$mpAPIKEYS" | sort -n | uniq ); do
	
	echo "Purging $APIKEY... ($current/$total)" | tee -a $LOG
	current=$(( $current+1 ))

	for PROTO in http https; do
		ok=0
		retries=3
		while [ $ok -eq 0 ]; do

			retries=$(( $retries-1 ))

			echo "curl https://www.cloudflare.com/api_json.html -d \"a=zone_file_purge\" -d \"tkn=XXXXX\" -d \"email=$cfEMAIL\" -d \"z=$cfZONE\" -d \"url=$PROTO://$mpHOST/boomerang/$APIKEY\"" >> $LOG
			echo -n "    $PROTO://$mpHOST/boomerang/$APIKEY - "
			result=$( curl https://www.cloudflare.com/api_json.html \
				  -d "a=zone_file_purge" \
				  -d "tkn=$cfTOKEN" \
				  -d "email=$cfEMAIL" \
				  -d "z=$cfZONE" \
				  -d "url=$PROTO://$mpHOST/boomerang/$APIKEY" 2>/dev/null \
				| sed -e 's/"tkn":"[^"]*"/"tkn":"XXXXX"/' \
				| tee -a $LOG )

			if echo $result | grep -q '"result":"success"' &>/dev/null; then
				echo -e "\033[0;32mdone\033[0m"
				echo "$PROTO - done" >> $LOG
				ok=1
			elif echo $result | grep -q '"err_code":"E_UNAUTH"' &>/dev/null; then
				echo "Auth credentials are incorrect, please check and retry" | tee -a $LOG
				exit
			elif echo $result | grep -q '"err_code":"E_INVLDINPUT"' &>/dev/null; then
				echo "Something went wrong, check log, and proceed manually" | tee -a $LOG
				exit
			elif echo $result | grep -q '"err_code":"E_MAXAPI"' &>/dev/null; then
				if [ $retries -lt 0 ]; then
					echo "Rate limited 3 times, aborting..." | tee -a $LOG
					exit
				else
					echo "Max allowed API calls exceeded, sleeping for a 20 seconds" | tee -a $LOG
					sleep 20
				fi
			elif echo $result | grep -q '"result":"error","msg":"' &>/dev/null; then
				echo $result | sed -e 's/.*"result":"error","msg":"//;s/".*//' | tee -a $LOG
				exit
			else
				echo "Something went wrong, check $LOG" | tee -a $LOG
				exit
			fi
		done
	done
done

echo "All done" | tee -a $LOG
