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
SOASTA_SERVER := http://localhost:8080
SOASTA_USER := SOASTA
SOASTA_PASSWORD := 
# Note that there MUST BE NO trailing slash in the following
SOASTA_REST_PREFIX := $(SOASTA_SERVER)/concerto/services/rest/RepositoryService/v1/Objects

SCHEMA_VERSION := $(shell cd $(SOASTA_SOURCE)/WebApplications/Concerto/src/com/soasta/repository/persistence/ && svn up SchemaVersion.java &>/dev/null && svn revert SchemaVersion.java &>/dev/null; cd - &>/dev/null && sed -ne '/private static final int c_iCurrent/ { s/.*= //;s/;//; p; }' $(SOASTA_SOURCE)/WebApplications/Concerto/src/com/soasta/repository/persistence/SchemaVersion.java)

tmpfile := boomerang.working

ifeq ($(strip $(SOASTA_PASSWORD)),)
soasta_user_password := $(SOASTA_USER)
else
soasta_user_password := $(SOASTA_USER):$(SOASTA_PASSWORD)
endif

all: boomerang-$(VERSION).$(DATE).js


# This is the old soasta format where boomerang.js and its plugins were stored in svn
# This rule puts the version number into boomerang.js and puts it in the build directory
old-soasta: boomerang.js $(LOGNORMAL_PLUGINS)
	echo
	echo "Making boomerang-$(VERSION).$(DATE).js ..."
	cat boomerang.js | sed -e 's/^\(BOOMR\.version = "\)$(VERSION)\("\)/\1$(VERSION).$(DATE)\2/' > build/boomerang-$(VERSION).$(DATE).js && echo "done"
	echo

# This is the old soasta format where boomerang.js and its plugins were stored in svn
# This rule takes the output of the previous rule and moves it to svn.  It also creates a git tag.
old-soasta-push: old-soasta
	cp $(LOGNORMAL_PLUGINS) plugins/zzz_last_plugin.js $(SOASTA_SOURCE)/WebApplications/Concerto/WebContent/WEB-INF/boomerang/plugins/
	cp build/boomerang-$(VERSION).$(DATE).js $(SOASTA_SOURCE)/WebApplications/Concerto/WebContent/WEB-INF/boomerang/boomerang.js
	cp boomerang-reload.html $(SOASTA_SOURCE)/WebApplications/Concerto/WebContent/boomerang/


# This rule creates the xml file that contains base64 encoded versions of debug and minified boomerang
# This is the new format of storing boomerang in the repository
# The SCHEMA_VERSION used here is the new one only if we're pushing to soasta svn, else it's the old one though we could just omit it
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
	perl -pi -e 's/%schema_version%/$(SCHEMA_VERSION)/;s/%name%/boomerang-$(VERSION).$(DATE)/;' Default_Boomerang.xml
	rm $(tmpfile).min.b64
	rm $(tmpfile).dbg.b64


soasta: Default_Boomerang.xml


update_schema: OLD_SCHEMA_VERSION := $(SCHEMA_VERSION)
update_schema: SCHEMA_VERSION := $(shell echo "$(OLD_SCHEMA_VERSION)+1" | bc -l )


# This rule adds a migration to set the new version as default and updates the schema files with the new version of boomerang
# Do not run this on its own since it will add a migration but won't add boomerang to the repository
# This should be run via new-soasta-push or something else that puts boomerang into the repo
update_schema: soasta
	echo "Updating schema version $(OLD_SCHEMA_VERSION) -> $(SCHEMA_VERSION)..."
	perl -pe 'BEGIN {my@t=gmtime; %repl=(year=>$$t[5]+1900,from=>$(OLD_SCHEMA_VERSION),to=>$(SCHEMA_VERSION),version=>"$(VERSION).$(DATE)")} s/%(.+?)%/$$repl{$$1}/g;' MigrationXtoY.java > $(SOASTA_SOURCE)/WebApplications/Concerto/src/com/soasta/repository/persistence/migration/Migration$(OLD_SCHEMA_VERSION)to$(SCHEMA_VERSION).java
	cd $(SOASTA_SOURCE)/WebApplications/Concerto/src/com/soasta/repository/persistence/migration/ && svn add Migration$(OLD_SCHEMA_VERSION)to$(SCHEMA_VERSION).java && cd - >/dev/null
	perl -pi -e '/private static final int c_iCurrent =/ && s/= \d+;/= $(SCHEMA_VERSION);/' $(SOASTA_SOURCE)/WebApplications/Concerto/src/com/soasta/repository/persistence/SchemaVersion.java
	echo "Updating lastModifiedVersion..."
	perl -pi -e '/<Import lastModifiedVersion="\d+" file="boomerang\/Default Boomerang.xml" / && s/lastModifiedVersion="\d+"/lastModifiedVersion="$(SCHEMA_VERSION)"/' $(SOASTA_SOURCE)/WebApplications/Concerto/src/META-INF/RepositoryImports/Index.xml



# Pushes both old and new formats
soasta-push: new-soasta-push old-soasta-push
	git tag soasta.$(VERSION).$(DATE)



# Upload new version of boomerang to a running mpulse, but don't make it default yet
soasta-upload: soasta
	echo "Uploading version $(VERSION).$(DATE) to $(SOASTA_REST_PREFIX)..."
	php generate-soasta-json.php $(SOASTA_SOURCE)/WebApplications/Concerto/src/META-INF/RepositoryImports/boomerang/Default\ Boomerang.xml | curl -v -T - --user $(soasta_user_password) $(SOASTA_REST_PREFIX)

soasta-set-default:
ifeq ($(strip $(DEFAULT_VERSION)),)
	echo "Please specify a default version using \`make DEFAULT_VERSION=... $@'"
else
	echo '{"attributes":[{"name":"boomerangDefaultVersion","value":"$(DEFAULT_VERSION)"}]}' | curl -v --data-binary @- --user $(soasta_user_password) $(SOASTA_REST_PREFIX)/siteconfiguration/1
endif

# Put new version of boomerang into repository on svn, and add all necessary migrations.  You still need to commit
new-soasta-push: update_schema
	mv Default_Boomerang.xml $(SOASTA_SOURCE)/WebApplications/Concerto/src/META-INF/RepositoryImports/boomerang/Default\ Boomerang.xml
	perl -pi -e 's/oSiteConfiguration\.setBoomerangDefaultVersion\(.*/oSiteConfiguration.setBoomerangDefaultVersion("$(VERSION).$(DATE)");/' $(SOASTA_SOURCE)/WebApplications/Concerto/src/com/soasta/repository/persistence/hibernate/RepositoryBuilder.java


lognormal-plugins : override PLUGINS := $(LOGNORMAL_PLUGINS)
lognormal : MINIFIER := java -jar /Users/philip/src/3rd-party/yui/yuicompressor/build/yuicompressor-2.4.8pre.jar --type js

lognormal-plugins: boomerang-$(VERSION).$(DATE)-debug.js


lognormal: lognormal-plugins boomerang-$(VERSION).$(DATE).js
	awk '/BOOMR\.plugins\.NavigationTiming/ { system("cat ln-copyright.txt"); } { print }' y-copyright.txt boomerang-$(VERSION).$(DATE).js > $(tmpfile)
	rm boomerang-$(VERSION).$(DATE).js
	chmod a+r $(tmpfile)
	mv $(tmpfile) build/boomerang-$(VERSION).$(DATE).js

lognormal-debug: lognormal-plugins
	cat boomerang-$(VERSION).$(DATE)-debug.js | sed -e 's/key=%client_apikey%/debug=\&key=%client_apikey%/;' > $(tmpfile)
	rm boomerang-$(VERSION).$(DATE)-debug.js
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
	echo ""
	echo "FOR SOASTA Users:"
	echo "Build the new xml file locally:"
	echo "  make soasta"
	echo ""
	echo "Build old and new versions and put into svn along with migrations:"
	echo "  make soasta-push"
	echo ""
	echo "Build new version and upload to a running mpulse instance"
	echo "  make soasta-upload"
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

.PHONY: all lognormal lognormal-plugins lognormal-debug Makefile
.SILENT:
