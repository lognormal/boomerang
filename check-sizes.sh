#!/bin/bash

for i in boomerang.js plugins/*.js; do
	before=$(cat $i | wc -c)
	int=$(cat $i | java -jar ~/src/3rd-party/yui/yuicompressor/build/yuicompressor-2.4.8pre.jar --type js | wc -c)
	after=$(cat $i | java -jar ~/src/3rd-party/yui/yuicompressor/build/yuicompressor-2.4.8pre.jar --type js | gzip -c | wc -c)
	echo "$after <= $int <= $before : $i"
done | sort -n

#      51 <=       33 <=      228 : plugins/zzz_last_plugin.js
#     167 <=      266 <=      461 : plugins/mobile.js
#     179 <=      246 <=     1500 : plugins/plugin.js
#     242 <=      353 <=      828 : plugins/cache_reload.js
#     447 <=      880 <=     1839 : plugins/memory.js
#     468 <=      806 <=     1312 : plugins/cache-test-plugin.js
#     470 <=      806 <=      806 : plugins/cache-test-plugin-min.js
#     536 <=     1234 <=     2325 : plugins/dns.js
#     639 <=     1492 <=     2790 : plugins/navtiming.js
#     729 <=     1390 <=     3086 : plugins/logn_config.js
#     806 <=     2023 <=     4704 : plugins/ipv6.js
#    1583 <=     3891 <=     9602 : plugins/md5.js
#    2545 <=     6546 <=    15177 : plugins/bw.js
#    3078 <=     9104 <=    15191 : plugins/page-params.js
#    3720 <=    11965 <=    32232 : plugins/rt.js
#    3888 <=    10966 <=    22545 : boomerang.js
#
