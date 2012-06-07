# Copyright (c) 2011, Yahoo! Inc.  All rights reserved.
# Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms.

PLUGINS :=

VERSION := $(shell sed -ne '/^BOOMR\.version/{s/^.*"\([^"]*\)".*/\1/;p;q;}' boomerang.js)
DATE := $(shell date +%s)

MINIFIER := cat

all: boomerang-$(VERSION).$(DATE).js

lognormal-plugins : override PLUGINS := ipv6.js navtiming.js mobile.js logn_config.js
lognormal : MINIFIER := java -jar /Users/philip/Projects/yui/builder/componentbuild/lib/yuicompressor/yuicompressor-2.4.4.jar --type js

lognormal-plugins: all

lognormal: lognormal-plugins
	ln=`awk '/BOOMR\.plugins\.NavigationTiming/ { system("cat ln-copyright.txt"); } { print }' y-copyright.txt boomerang-$(VERSION).$(DATE).js`; \
		echo "$$ln" > boomerang-$(VERSION).$(DATE).js
	gzip -7 -c boomerang-$(VERSION).$(DATE).js > boomerang-$(VERSION).$(DATE).js.gz

lognormal-debug: lognormal-plugins
	cat boomerang-$(VERSION).$(DATE).js | sed -e 's/%client_apikey%/0dd7f79b667025afb483661b9200a30dc372d866296d4e032c3bc927/' > boomerang-debug-latest.js
	rm boomerang-$(VERSION).$(DATE).js
	scp boomerang-debug-latest.js linode2:boomerang/
	ssh linode2 "sudo nginx -s reload"
	scp boomerang-debug-latest.js linode3:boomerang/
	ssh linode3 "sudo nginx -s reload"

lognormal-push: lognormal
	git tag v$(VERSION).$(DATE)
	scp boomerang-$(VERSION).$(DATE).js boomerang-$(VERSION).$(DATE).js.gz linode:boomerang/
	ssh linode "ln -f boomerang/boomerang-$(VERSION).$(DATE).js boomerang/boomerang-wizard-min.js; sudo nginx -s reload"
	scp boomerang-$(VERSION).$(DATE).js boomerang-$(VERSION).$(DATE).js.gz linode2:boomerang/
	ssh linode2 "ln -f boomerang/boomerang-$(VERSION).$(DATE).js boomerang/boomerang-wizard-min.js; sudo nginx -s reload"
	scp boomerang-$(VERSION).$(DATE).js boomerang-$(VERSION).$(DATE).js.gz linode3:boomerang/
	ssh linode3 "ln -f boomerang/boomerang-$(VERSION).$(DATE).js boomerang/boomerang-wizard-min.js; sudo nginx -s reload"

usage:
	echo "Create a release version of boomerang:"
	echo "	make"
	echo ""
	echo "Create a release version of boomerang with the dns plugin:"
	echo "	make PLUGINS=dns.js"
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
	cat boomerang.js $(PLUGINS) zzz_last_plugin.js | sed -e 's/^\(BOOMR\.version = "\)$(VERSION)\("\)/\1$(VERSION).$(DATE)\2/' | $(MINIFIER) | perl -pe "s/\(window\)\);/\(window\)\);\n/g" > $@ && echo "done"
	echo

.PHONY: all
.SILENT:
