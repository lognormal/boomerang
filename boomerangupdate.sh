#!/bin/bash
#Usage: <Server> <Boomerang New Version> <Bucket File> <mPulse Username> <mPulse Password>

export WORKING_DIR=./BoomerangUpdate
export LOG=$WORKING_DIR/update-log.`date +%Y-%m-%d-%H%M%S`.log
export BUCKET=$3
export VERSION=$2

if [ $# -lt 5 ]; then
	echo "Usage: <Server> <New Boomerang Version> <Bucket File> <mPulse Username> <mPulse Password>"
	exit
fi

cf_collector=http://localhost:8080/concerto
og_collector=http://localhost:8080/concerto
cf_main=http://localhost:8080

if [ "$1" = "mpulse-production" ]; then
	cf_collector=http://c.go-mpulse.net
	og_collector=http://o.go-mpulse.net
	cf_main=https://mpulse.soasta.com
elif [ "$1" = "lt2" ]; then
	cf_collector=http://c-lt2.go-mpulse.net
	og_collector=http://o-lt2.go-mpulse.net
	cf_main=https://mpulse-lt2.soasta.com
elif [ "$1" = "rum-dev" ]; then
	cf_collector=http://rum-dev-collector.soasta.com
	og_collector=http://rum-dev-collector.soasta.com
	cf_main=https://rum-dev.soasta.com
elif [ "$1" != "localhost" -a "$1" != "default" -a "$1" != "local" ]; then
	echo ""
	echo "\`$1' is not a valid Server identifier"
	echo ""
	echo "<Server> should be one of:"
	echo "	default (localhost)"
	echo "	lt2"
	echo "	rum-dev"
	echo "	mpulse-production"
	echo ""
	exit
fi

export tmpfile1=$WORKING_DIR/boomerang-update-step1.tmp.$$
export tmpfile2=$WORKING_DIR/boomerang-update-step2.tmp.$$
export baddomains=$WORKING_DIR/ErrorDomains.tsv
rm -f $baddomains

if [ ! -d ${WORKING_DIR} ]
then
        mkdir ${WORKING_DIR}
fi

total=$( wc -l $BUCKET | awk '{print $1}' )
current=1

echo "$1 on $cf_collector      $VERSION" | tee $LOG
echo "5.1) Finding out the current version of boomerang..." | tee -a $LOG

for i in $(cat $BUCKET | awk -F "|" '{print $NF}'); do
	echo "Checking $i... ($current/$total)" | tee -a $LOG
	current=$(( $current+1 ))
	result=$( curl -A 'Mozilla/5.0' ${cf_collector}/boomerang/$i 2>/dev/null | \
		grep 'BOOMR.version=' | sed -e 's/.*BOOMR.version=/BOOMR.version=/;s/;.*//' )

	if [ -z "$result" ]; then
		echo "Not found" | tee -a $LOG
		grep " $i\$" $BUCKET >> $baddomains
	else
		echo $result | tee -a $LOG
		grep " $i\$" $BUCKET >> $tmpfile1
	fi
done

if [ ! -e $tmpfile1 ]; then
	echo "Nothing passed through" | tee -a $LOG
	exit
fi

total=$( wc -l $tmpfile1 | awk '{print $1}' )
current=1

echo "5.2) Making sure the new version exists..." | tee -a $LOG

echo "$1 on $og_collector     $VERSION" | tee -a $LOG
for i in $(cat $tmpfile1 | awk -F "|" '{print $NF}'); do
	echo "Checking $i... ($current/$total)" | tee -a $LOG
	current=$(( $current+1 ))
	result=$( curl -A 'Mozilla/5.0' -H "Cookie: boomerang_override=\"version=$VERSION\"" ${og_collector}/boomerang/$i 2>/dev/null | \
		grep 'BOOMR.version=' | sed -e 's/.*BOOMR.version=/BOOMR.version=/;s/;.*//' )

	if [ -z "$result" ]; then
		echo "Not found" | tee -a $LOG
		grep " $i\$" $tmpfile1 >> $baddomains
	else
		echo $result | tee -a $LOG
		grep " $i\$" $tmpfile1 >> $tmpfile2
	fi
done

rm -f $tmpfile1

if [ ! -e $tmpfile2 ]; then
	echo "Nothing passed through" | tee -a $LOG
	exit
fi

total=$( wc -l $tmpfile2 | awk '{print $1}' )
current=1


echo "5.3) Update the version for a specific domain..." | tee -a $LOG

echo "$1 on $cf_main    $VERSION" | tee -a $LOG
 
awk -F "|" '{print $1,$5}' "$tmpfile2" | \
	while read DomainId TenantName; do
		echo "Updating $TenantName/$DomainId... ($current/$total)" | tee -a $LOG
		current=$(( $current+1 ))
 		result=$( make SOASTA_SERVER=${cf_main} SOASTA_USER="$4" SOASTA_PASSWORD="$5" DEFAULT_VERSION="$2" DOMAIN_ID="$DomainId" TENANT="$TenantName" soasta-set-domain-boomerang 2>&1 | tee -a $LOG )
		if ! echo "$result" | grep -q "^< HTTP/1\.1 204" &>/dev/null; then
			echo -n "$DomainId | $TenantName | " >> $baddomains
			echo "$result" | grep "^< HTTP/1\.1 " | grep -v 204 | sed -e 's/.*< HTTP\/1\.1 //' | tee -a $LOG | tee -a $baddomains
		fi
			
	done

rm -f $tmpfile2

passed=$( grep -c 'HTTP/1.1 204' $LOG )
if [ $passed -eq $total ] ; then
	echo "Update was successful."
else
	echo "Update failed ($passed/$total complete). Check $LOG for errors."
	grep '^< HTTP/1.1 ' $LOG | grep -v 204 | sed -e 's/^< HTTP\/1\.1 //' | sort -n | uniq -c

	echo "Bad Domains:"
	cat $baddomains
fi

