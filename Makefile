# Copyright (c) 2011, Yahoo! Inc.  All rights reserved.
# Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms.

PLUGINS := plugins/rt.js plugins/bw.js
STANDALONE_PLUGINS := 
LOGNORMAL_PLUGINS := plugins/rt.js plugins/bw.js plugins/ipv6.js plugins/dns.js plugins/navtiming.js plugins/mobile.js plugins/memory.js plugins/cache_reload.js plugins/logn_config.js

VERSION := $(shell sed -ne '/^BOOMR\.version/{s/^.*"\([^"]*\)".*/\1/;p;q;}' boomerang.js)
DATE := $(shell date +%s)

MINIFIER := cat
HOSTS := bacon1 bacon2 bacon3 bacon4 bacon5 bacon6 bacon7 bacon8 bacon9 bacon10 bacon13
SOASTA_SOURCE := ~/src/soasta/trunk/source

tmpfile := boomerang.working

all: boomerang-$(VERSION).$(DATE).js

lognormal-plugins : override PLUGINS := $(LOGNORMAL_PLUGINS)
lognormal : MINIFIER := java -jar /Users/philip/src/3rd-party/yui/yuicompressor/build/yuicompressor-2.4.8pre.jar --type js

lognormal-plugins: boomerang-$(VERSION).$(DATE)-debug.js

old-soasta: boomerang.js $(LOGNORMAL_PLUGINS)
	echo
	echo "Making boomerang-$(VERSION).$(DATE).js ..."
	cat boomerang.js | sed -e 's/^\(BOOMR\.version = "\)$(VERSION)\("\)/\1$(VERSION).$(DATE)\2/' > build/boomerang-$(VERSION).$(DATE).js && echo "done"
	echo

old-soasta-push: old-soasta
	git tag soasta.$(VERSION).$(DATE)
	cp $(LOGNORMAL_PLUGINS) plugins/zzz_last_plugin.js $(SOASTA_SOURCE)/WebApplications/Concerto/WebContent/WEB-INF/boomerang/plugins/
	cp build/boomerang-$(VERSION).$(DATE).js $(SOASTA_SOURCE)/WebApplications/Concerto/WebContent/WEB-INF/boomerang/boomerang.js
	cp boomerang-reload.html $(SOASTA_SOURCE)/WebApplications/Concerto/WebContent/boomerang/

Default_Boomerang.xml: lognormal lognormal-debug
	cat build/boomerang-$(VERSION).$(DATE).js | base64 --break 80 > $(tmpfile).min.b64
	cat build/boomerang-$(VERSION).$(DATE)-debug.js | base64 --break 80 > $(tmpfile).dbg.b64
	awk    '/<Minified><\/Minified>/ { \
			printf("        <Minified>\n"); \
			system("cat $(tmpfile).min.b64"); \
			printf("        </Minified>\n"); \
			next; \
		} \
		/<Debug><\/Debug>/ { \
			printf("        <Debug>\n"); \
			system("cat $(tmpfile).dbg.b64"); \
			printf("        </Debug>\n"); \
			next; \
		} \
		/<Value><\/Value>/ { \
			printf("        <Value>$(VERSION).$(DATE)</Value>\n"); \
			next; \
		} \
		{ print }' RepositoryImports.tmpl > Default_Boomerang.xml
	rm $(tmpfile).min.b64
	rm $(tmpfile).dbg.b64

soasta: Default_Boomerang.xml


update_schema: SCHEMA_VERSION := $(shell cd $(SOASTA_SOURCE)/WebApplications/Concerto/src/com/soasta/repository/persistence/ && svn up SchemaVersion.java &>/dev/null && svn revert SchemaVersion.java &>/dev/null && cd - &>/dev/null && sed -ne '/private static final int c_iCurrent/ { s/.*= //;s/;/+1/; p; }' $(SOASTA_SOURCE)/WebApplications/Concerto/src/com/soasta/repository/persistence/SchemaVersion.java | bc -l )


update_schema: soasta
	echo "Updating schema version $(SCHEMA_VERSION)..."
	perl -pi -e '/private static final int c_iCurrent =/ && s/= \d+;/= $(SCHEMA_VERSION);/' $(SOASTA_SOURCE)/WebApplications/Concerto/src/com/soasta/repository/persistence/SchemaVersion.java
	echo "Updating lastModifiedVersion..."
	perl -pi -e '/<Import lastModifiedVersion="\d+" file="boomerang\/Default Boomerang.xml" / && s/lastModifiedVersion="\d+"/lastModifiedVersion="$(SCHEMA_VERSION)"/' $(SOASTA_SOURCE)/WebApplications/Concerto/src/META-INF/RepositoryImports/Index.xml
	perl -pi -e 's/%schema_version%/$(SCHEMA_VERSION)/' Default_Boomerang.xml



soasta-push: new-soasta-push old-soasta-push



new-soasta-push: update_schema
	mv Default_Boomerang.xml $(SOASTA_SOURCE)/WebApplications/Concerto/src/META-INF/RepositoryImports/boomerang/Default\ Boomerang.xml



lognormal: lognormal-plugins boomerang-$(VERSION).$(DATE).js
	awk '/BOOMR\.plugins\.NavigationTiming/ { system("cat ln-copyright.txt"); } { print }' y-copyright.txt boomerang-$(VERSION).$(DATE).js > $(tmpfile)
	chmod a+r $(tmpfile)
	mv $(tmpfile) build/boomerang-$(VERSION).$(DATE).js

lognormal-debug: lognormal-plugins
	set +x
	cat boomerang-$(VERSION).$(DATE)-debug.js | sed -e 's/key=%client_apikey%/debug=\&key=%client_apikey%/;s/BOOMR.init({log:null,/BOOMR.init({/;' > $(tmpfile)
	chmod a+r $(tmpfile)
	mv $(tmpfile) build/boomerang-$(VERSION).$(DATE)-debug.js

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
