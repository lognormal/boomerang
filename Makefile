# Copyright (c) 2011, Yahoo! Inc.  All rights reserved.
# Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms.

PLUGINS := plugins/rt.js plugins/bw.js
STANDALONE_PLUGINS := plugins/cache-test-plugin.js

VERSION := $(shell sed -ne '/^BOOMR\.version/{s/^.*"\([^"]*\)".*/\1/;p;q;}' boomerang.js)
DATE := $(shell date +%s)

MINIFIER := cat
HOSTS := bacon1 bacon2 bacon3 bacon4 bacon5 bacon6 bacon7 bacon8 bacon9

all: boomerang-$(VERSION).$(DATE).js

lognormal-plugins : override PLUGINS := plugins/rt.js plugins/bw.js plugins/ipv6.js plugins/dns.js plugins/navtiming.js plugins/mobile.js plugins/memory.js plugins/logn_config.js
#lognormal : MINIFIER := java -jar /Users/philip/Projects/yui/builder/componentbuild/lib/yuicompressor/yuicompressor-2.4.4.jar --type js

lognormal-plugins: all

soasta: lognormal-plugins
	mv boomerang-$(VERSION).$(DATE).js* build/

soasta-push: soasta
	cp build/boomerang-$(VERSION).$(DATE).js ~/src/soasta/trunk/source/WebApplications/Concerto/src/com/soasta/rum/collector/boomerang/boomerang-wizard-min.js

lognormal: lognormal-plugins
	ln=`awk '/BOOMR\.plugins\.NavigationTiming/ { system("cat ln-copyright.txt"); } { print }' y-copyright.txt boomerang-$(VERSION).$(DATE).js`; \
		echo "$$ln" > boomerang-$(VERSION).$(DATE).js
	gzip -7 -c boomerang-$(VERSION).$(DATE).js > boomerang-$(VERSION).$(DATE).js.gz
	mv boomerang-$(VERSION).$(DATE).js* build/

lognormal-debug: lognormal-plugins
	cat boomerang-$(VERSION).$(DATE).js | sed -e 's/%client_apikey%/0dd7f79b667025afb483661b9200a30dc372d866296d4e032c3bc927/' > boomerang-debug-latest.js
	rm boomerang-$(VERSION).$(DATE).js
	for host in $(HOSTS); do \
		scp boomerang-debug-latest.js $(STANDALONE_PLUGINS) $$host:boomerang/ 2>/dev/null; \
		ssh $$host "sudo nginx -s reload" 2>/dev/null; \
	done

lognormal-push: lognormal
	git tag v$(VERSION).$(DATE)
	for host in $(HOSTS); do \
		scp build/boomerang-$(VERSION).$(DATE).js build/boomerang-$(VERSION).$(DATE).js.gz $(STANDALONE_PLUGINS) $$host:boomerang/ 2>/dev/null; \
		ssh $$host "ln -f boomerang/boomerang-$(VERSION).$(DATE).js boomerang/boomerang-wizard-min.js; sudo nginx -s reload" 2>/dev/null; \
	done

usage:
	echo "Create a release version of boomerang:"
	echo "	make"
	echo ""
	echo "Create a release version of boomerang with the rt, bw & dns plugins:"
	echo "	make PLUGINS=\"plugins/rt.js plugins/bw.js plugins/dns.js\""
	echo ""
	echo "Create a yuicompressor minified release version of boomerang:"
	echo "	make MINIFIER=\"java -jar /path/to/yuicompressor-2.4.2.jar --type js\""
	echo ""
	echo "Create a jsmin minified release version of boomerang:"
	echo "	make MINIFIER=\"/path/to/jsmin\""
	echo ""

boomerang-$(VERSION).$(DATE).js: boomerang.js $(PLUGINS)
	echo
	echo "Making $@ ..."
	echo "using plugins: $(PLUGINS)..."
	cat boomerang.js $(PLUGINS) plugins/zzz_last_plugin.js | sed -e 's/^\(BOOMR\.version = "\)$(VERSION)\("\)/\1$(VERSION).$(DATE)\2/' | $(MINIFIER) | perl -pe "s/\(window\)\);/\(window\)\);\n/g" > $@ && echo "done"
	echo

.PHONY: all
.SILENT:
