#!/bin/bash
# See FB case 83374 for information about this script.
# This script looks through the server.log file on collectors and emails us a summary of any ERROR lines - PJ 11/19/14

# Add this to /etc/crontab
#32 1 * * * root /home/support/check_boomerang_error.sh

WORKING_DIR=./BoomerangErrorLog
LOG=boomerang_error.log
sender=noreply@soasta.com
recipient="pjogi@soasta.com ptellis@soasta.com"
pj_email=pjogi@soasta.com
p_email=ptellis@soasta.com

mkdir -p ${WORKING_DIR}

FILE=$(cd /mnt/jboss/log && ls -t server.log.* | head -1)
CAT=/bin/cat
if echo ${FILE} | grep "\.gz$" &>/dev/null; then
	CAT=/bin/zcat
fi

$CAT /mnt/jboss/log/${FILE} | perl /home/support/check_boomerang_error.pl > $WORKING_DIR/$LOG

pub_ip=`/usr/bin/curl -s http://169.254.169.254/latest/meta-data/public-ipv4`
if [ -s $WORKING_DIR/$LOG ]; then
	echo "Subject: Boomerang ERRORS on ${pub_ip}" > $WORKING_DIR/Results.txt
	echo "Log File: $FILE" >> $WORKING_DIR/Results.txt
	echo "ERRORS:    " >> $WORKING_DIR/Results.txt
	cat $WORKING_DIR/${LOG} >> $WORKING_DIR/Results.txt
	text=$(cat $WORKING_DIR/Results.txt | perl -pe 's/"/\\"/g; s/$/\\/;')
#	curl -f -X POST "https://soasta.slack.com/services/hooks/incoming-webhook?token=GEqm2TBFitjtOIQvTmdOLqF4" --data-binary "{\"channel\":\"#boomerang_errors\",\"username\":\"cron\",\"text\":\"$text\"}" &>/dev/null || /usr/sbin/sendmail -f $sender $recipient < $WORKING_DIR/Results.txt
	/usr/sbin/sendmail -f $sender $recipient < $WORKING_DIR/Results.txt
else
	echo "Subject: Boomerang ERROR LOG is empty on ${pub_ip}" > $WORKING_DIR/Results.txt
	/usr/sbin/sendmail -f $sender $pj_email < $WORKING_DIR/Results.txt
fi
