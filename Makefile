# Copyright (c) 2011, Yahoo! Inc.  All rights reserved.
# Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms.

PLUGINS := plugins/rt.js plugins/bw.js
STANDALONE_PLUGINS := 

VERSION := $(shell sed -ne '/^BOOMR\.version/{s/^.*"\([^"]*\)".*/\1/;p;q;}' boomerang.js)
DATE := $(shell date +%s)

MINIFIER := cat
HOSTS := bacon1 bacon2 bacon3 bacon4 bacon5 bacon6 bacon7 bacon8 bacon9 bacon10 bacon13

all: boomerang-$(VERSION).$(DATE).js

lognormal-plugins : override PLUGINS := plugins/rt.js plugins/bw.js plugins/ipv6.js plugins/dns.js plugins/navtiming.js plugins/mobile.js plugins/memory.js plugins/logn_config.js
lognormal : MINIFIER := java -jar /Users/philip/src/3rd-party/yui/yuicompressor/build/yuicompressor-2.4.8pre.jar --type js
lognormal : tmpfile := boomerang.working

lognormal-plugins: boomerang-$(VERSION).$(DATE)-debug.js

lognormal: lognormal-plugins boomerang-$(VERSION).$(DATE).js
	awk '/BOOMR\.plugins\.NavigationTiming/ { system("cat ln-copyright.txt"); } { print }' y-copyright.txt boomerang-$(VERSION).$(DATE).js > $(tmpfile)
	chmod a+r $(tmpfile)
	mv $(tmpfile) boomerang-$(VERSION).$(DATE).js
	mv boomerang-$(VERSION).$(DATE)* build/

lognormal-debug: lognormal-plugins
	cat boomerang-$(VERSION).$(DATE)-debug.js | sed -e 's/key=%client_apikey%/debug=\&key=0dd7f79b667025afb483661b9200a30dc372d866296d4e032c3bc927/;s/BOOMR.init({log:null,/BOOMR.init({/;' > boomerang-debug-latest.js
	rm boomerang-$(VERSION).$(DATE)*
	for host in $(HOSTS); do \
		scp -C boomerang-debug-latest.js $(STANDALONE_PLUGINS) $$host:boomerang/ 2>/dev/null; \
		ssh $$host "sudo nginx -s reload" 2>/dev/null; \
	done

lognormal-push: lognormal
	git tag v$(VERSION).$(DATE)
	for host in $(HOSTS); do \
		scp -C build/boomerang-$(VERSION).$(DATE)* $(STANDALONE_PLUGINS) $$host:boomerang/ 2>/dev/null; \
		ssh $$host "ln -f boomerang/boomerang-$(VERSION).$(DATE).js boomerang/boomerang-wizard-min.js; ln -f boomerang/boomerang-$(VERSION).$(DATE)-debug.js boomerang/boomerang-wizard-debug.js; sudo nginx -s reload" 2>/dev/null; \
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

boomerang-$(VERSION).$(DATE).js: boomerang-$(VERSION).$(DATE)-debug.js
	echo "Making $@ ..."
	cat boomerang-$(VERSION).$(DATE)-debug.js | $(MINIFIER) | perl -pe "s/\(window\)\);/\(window\)\);\n/g;s/\(\)\);\(function\(/\(\)\);\n\(function\(/g;" > $@ && echo "done"
	echo

boomerang-$(VERSION).$(DATE)-debug.js: boomerang.js $(PLUGINS)
	echo
	echo "Making $@ ..."
	echo "using plugins: $(PLUGINS)..."
	cat boomerang.js $(PLUGINS) plugins/zzz_last_plugin.js | sed -e 's/^\(BOOMR\.version = "\)$(VERSION)\("\)/\1$(VERSION).$(DATE)\2/' > $@ && echo "done"
	echo

.PHONY: all
.SILENT:
