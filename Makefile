# Copyright (c) 2011, Yahoo! Inc.  All rights reserved.
# Copyrights licensed under the BSD License. See the accompanying LICENSE.txt file for terms.

PLUGINS := plugins/rt.js plugins/bw.js
STANDALONE_PLUGINS := 
LOGNORMAL_PLUGINS := plugins/page-params.js plugins/rt.js plugins/bw.js plugins/navtiming.js plugins/mobile.js plugins/memory.js plugins/cache_reload.js plugins/md5.js plugins/logn_config.js

VERSION := $(shell sed -ne '/^BOOMR\.version/{s/^.*"\([^"]*\)".*/\1/;p;q;}' boomerang.js)
DATE := $(shell date +%s)

MINIFIER := cat
HOSTS := bacon1 bacon2 bacon3 bacon4 bacon10

SOASTA_SOURCE := ~/src/soasta/trunk/source
SOASTA_SERVER := http://localhost:8080
SOASTA_USER := SOASTA
SOASTA_PASSWORD := 
# Note that there MUST BE NO trailing slash in the following
SOASTA_REST_BASE := $(SOASTA_SERVER)/concerto/services/rest/RepositoryService/v1
SOASTA_REST_PREFIX := $(SOASTA_REST_BASE)/Objects
SOASTA_TOKEN_PREFIX := $(SOASTA_REST_BASE)/Tokens
INSECURE :=
SERVER ?= rum-dev.soasta.com/concerto

SLACK_CHANNELS := "boomerang_announce "

LOG_FILE := boomerang-build.$(DATE).log
LOGIT := tee -a $(LOG_FILE)

#ifeq ($(strip $(SOASTA_SERVER)),https://mpulse.soasta.com)
#SLACK_CHANNELS += "ops "
#else ifeq ($(strip $(SOASTA_SERVER)),https://mpulse.soasta.com/)
#SLACK_CHANNELS += "ops "
#else ifeq ($(strip $(SOASTA_SERVER)),https://mpulse-lt2.soasta.com)
#SLACK_CHANNELS += "mpulse-loadtest "
#else ifeq ($(strip $(SOASTA_SERVER)),https://mpulse-lt2.soasta.com/)
#SLACK_CHANNELS += "mpulse-loadtest "
#endif

SCHEMA_VERSION := $(shell cd $(SOASTA_SOURCE)/WebApplications/Concerto/src/com/soasta/repository/persistence/ && svn up SchemaVersion.java &>/dev/null && svn revert SchemaVersion.java &>/dev/null; cd - &>/dev/null && sed -ne '/private static final int c_iCurrent/ { s/.*= //;s/;//; p; }' $(SOASTA_SOURCE)/WebApplications/Concerto/src/com/soasta/repository/persistence/SchemaVersion.java)

NEW_VERSION := $(shell cat $(SOASTA_SOURCE)/WebApplications/Concerto/src/META-INF/RepositoryImports/boomerang/Default\ Boomerang.xml | grep 'Value' | sed -e 's/.*<Value>//;s/<\/Value>.*//;' )

JS_CALLS_REMOVE := 'BOOMR\.(debug|info|warn|error)\s*\(.*?\)\s*;'

tmpfile := boomerang.working

ifeq ($(strip $(SOASTA_PASSWORD)),)
soasta_user_password := $(SOASTA_USER)
else
soasta_user_password := $(SOASTA_USER):$(SOASTA_PASSWORD)
endif

all: boomerang-$(VERSION).$(DATE).js

which-version:
	echo "New version is $(NEW_VERSION)"



# This rule creates the xml file that contains base64 encoded versions of debug and minified boomerang
# This is the new format of storing boomerang in the repository
# The SCHEMA_VERSION used here is the new one only if we're pushing to soasta svn, else it's the old one though we could just omit it
Default_Boomerang.xml: lognormal lognormal-debug
	echo "Making minified base64..."
	base64 -i build/boomerang-$(VERSION).$(DATE).js --break 69 -o $(tmpfile).min.b64
	echo "Making debug base64..."
	base64 -i build/boomerang-$(VERSION).$(DATE)-debug.js --break 69 -o $(tmpfile).dbg.b64
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


new-soasta-push create_migration update_schema: OLD_SCHEMA_VERSION := $(SCHEMA_VERSION)
new-soasta-push create_migration update_schema: SCHEMA_VERSION := $(shell echo "$(OLD_SCHEMA_VERSION)+1" | bc -l )


# This rule adds a migration to set the new version as default and updates the schema files with the new version of boomerang
# Do not run this on its own since it will add a migration but won't add boomerang to the repository
# This should be run via new-soasta-push or something else that puts boomerang into the repo
update_schema:
	echo "Updating schema version $(OLD_SCHEMA_VERSION) -> $(SCHEMA_VERSION)..."
	perl -pi -e '/private static final int c_iCurrent =/ && s/= \d+;/= $(SCHEMA_VERSION);/' $(SOASTA_SOURCE)/WebApplications/Concerto/src/com/soasta/repository/persistence/SchemaVersion.java


create_migration: update_schema
	echo "Creating migration..."
	perl -pe 'BEGIN {my@t=gmtime; %repl=(year=>$$t[5]+1900,from=>$(OLD_SCHEMA_VERSION),to=>$(SCHEMA_VERSION),version=>"$(NEW_VERSION)")} s/%(.+?)%/$$repl{$$1}/g;' MigrationXtoY.java > $(SOASTA_SOURCE)/WebApplications/Concerto/src/com/soasta/repository/persistence/migration/Migration$(OLD_SCHEMA_VERSION)to$(SCHEMA_VERSION).java
	cd $(SOASTA_SOURCE)/WebApplications/Concerto/src/com/soasta/repository/persistence/migration/ && svn add Migration$(OLD_SCHEMA_VERSION)to$(SCHEMA_VERSION).java && cd - >/dev/null
	perl -pi -e 's/oSiteConfiguration\.setBoomerangDefaultVersion\(.*/oSiteConfiguration.setBoomerangDefaultVersion("$(NEW_VERSION)");/' $(SOASTA_SOURCE)/WebApplications/Concerto/src/com/soasta/repository/persistence/hibernate/RepositoryBuilder.java


# Pushes new format and tags git
soasta-push: new-soasta-push
	git tag soasta.$(VERSION).$(DATE)
	for channel in $(SLACK_CHANNELS); do curl -X POST "https://soasta.slack.com/services/hooks/incoming-webhook?token=CI8oLOcEJ1xfLLWJZBYCr5DI" --data-binary "{\"channel\":\"#$$channel\", \"username\":\"$$USER\", \"text\":\"Pushed boomerang tag soasta.$(VERSION).$(DATE) to $(SOASTA_SOURCE) (uncommitted)\"}"; done



# Upload new version of boomerang to a running mpulse, but don't make it default yet
soasta-upload: 
	echo "Uploading version $(NEW_VERSION) to $(SOASTA_REST_PREFIX)..." | $(LOGIT)
	php generate-soasta-json.php $(SOASTA_SOURCE)/WebApplications/Concerto/src/META-INF/RepositoryImports/boomerang/Default\ Boomerang.xml | $(LOGIT) | curl -vsS -T - $(INSECURE) --user $(soasta_user_password) $(SOASTA_REST_PREFIX)
	echo "" | $(LOGIT)
	echo "Uploaded version $(NEW_VERSION) to $(SOASTA_SERVER)..." | $(LOGIT)
	for channel in $(SLACK_CHANNELS); do echo "Announcing to $$channel"; curl -X POST "https://soasta.slack.com/services/hooks/incoming-webhook?token=CI8oLOcEJ1xfLLWJZBYCr5DI" --data-binary "{\"channel\":\"#$$channel\", \"username\":\"$(SOASTA_USER)\", \"text\":\"Uploaded boomerang version $(NEW_VERSION) to $(SOASTA_SERVER)\",\"icon_emoji\":\":shipit:\"}"; echo ""; done


soasta-set-domain-boomerang:
ifeq ($(strip $(DEFAULT_VERSION)),)
	echo "Please specify a default version using \`make DEFAULT_VERSION=... $@'"
else
ifeq ($(strip $(DOMAIN_ID)),)
	echo "Please specify the domain ID using \`make DOMAIN_ID=... $@'"
else
ifeq ($(strip $(TENANT)),)
	echo "Please specify the tenant name using \`make TENANT=... $@'"
else
	echo "Setting default boomerang version for $(TENANT)/$(DOMAIN_ID) to $(DEFAULT_VERSION)..." | $(LOGIT)
	@if [ -z "$(SOASTA_PASSWORD)" ]; then read -p "Enter host password for user '$(SOASTA_USER)': " -s soasta_password; else soasta_password=$(SOASTA_PASSWORD); fi; \
	token=`curl $(INSECURE) --user $(SOASTA_USER):$$soasta_password -X PUT -H "Content-Type: application/json" --data-binary '{"userName":"$(SOASTA_USER)","password":"'$$soasta_password'","tenant":"$(TENANT)"}' $(SOASTA_TOKEN_PREFIX) 2>/dev/null | perl -pe 's/.*{"token":"(.*)"}.*/$$1/;' `; \
	set -e && curl -vsS --fail $(INSECURE) -H "X-Auth-Token: $$token" $(SOASTA_REST_PREFIX)/domain/$(DOMAIN_ID) 2>&1 | $(LOGIT) | grep -v '^[<>* ]\|\[data not shown\]' | php generate-domain-references.php php://stdin $(DEFAULT_VERSION) | $(LOGIT) | curl -vsS $(INSECURE) --data-binary @- -H "X-Auth-Token: $$token" $(SOASTA_REST_PREFIX)/domain/$(DOMAIN_ID) 2>&1 | $(LOGIT)
	for channel in $(SLACK_CHANNELS); do echo "Announcing to $$channel"; curl -X POST "https://soasta.slack.com/services/hooks/incoming-webhook?token=CI8oLOcEJ1xfLLWJZBYCr5DI" --data-binary "{\"channel\":\"#$$channel\", \"username\":\"$(SOASTA_USER)\", \"text\":\"Set default boomerang version for domain:$(DOMAIN_ID) tenant:$(TENANT) to $(DEFAULT_VERSION) on $(SOASTA_SERVER)\",\"icon_emoji\":\":thumbsup:\"}"; echo ""; done
endif
endif
endif


soasta-unset-domain-boomerang:
ifeq ($(strip $(DOMAIN_ID)),)
	echo "Please specify the domain ID using \`make DOMAIN_ID=... $@'"
else
ifeq ($(strip $(TENANT)),)
	echo "Please specify the tenant name using \`make TENANT=... $@'"
else
	echo "Unsetting default boomerang version for $(TENANT)/$(DOMAIN_ID)..." | $(LOGIT)
	@if [ -z "$(SOASTA_PASSWORD)" ]; then read -p "Enter host password for user '$(SOASTA_USER)': " -s soasta_password; else soasta_password=$(SOASTA_PASSWORD); fi; \
	token=`curl -sS $(INSECURE) --user $(SOASTA_USER):$$soasta_password -X PUT -H "Content-Type: application/json" --data-binary '{"userName":"$(SOASTA_USER)","password":"'$$soasta_password'","tenant":"$(TENANT)"}' $(SOASTA_TOKEN_PREFIX) 2>/dev/null | perl -pe 's/.*{"token":"(.*)"}.*/$$1/;' `; \
	set -e && curl -vsS $(INSECURE) --fail -H "X-Auth-Token: $$token" $(SOASTA_REST_PREFIX)/domain/$(DOMAIN_ID) 2>&1 | $(LOGIT) | grep -v '^[<>* ]\|\[data not shown\]' | php generate-domain-references.php php://stdin remove | $(LOGIT) | curl -vsS $(INSECURE) --data-binary @- -H "X-Auth-Token: $$token" $(SOASTA_REST_PREFIX)/domain/$(DOMAIN_ID) 2>&1 | $(LOGIT)
	for channel in $(SLACK_CHANNELS); do echo "Announcing to $$channel"; curl -X POST "https://soasta.slack.com/services/hooks/incoming-webhook?token=CI8oLOcEJ1xfLLWJZBYCr5DI" --data-binary "{\"channel\":\"#$$channel\", \"username\":\"$(SOASTA_USER)\", \"text\":\"Unset default boomerang version for domain:$(DOMAIN_ID) tenant:$(TENANT) on $(SOASTA_SERVER)\",\"icon_emoji\":\":thumbsup:\"}"; echo ""; done
endif
endif


soasta-set-default:
ifeq ($(strip $(DEFAULT_VERSION)),)
	echo "Please specify a default version using \`make DEFAULT_VERSION=... $@'"
else
	echo "Setting default boomerang version to $(DEFAULT_VERSION)..." | $(LOGIT)
	echo '{"attributes":[{"name":"boomerangDefaultVersion","value":"$(DEFAULT_VERSION)"}]}' | $(LOGIT) | curl -vsS $(INSECURE) --data-binary @- --user $(soasta_user_password) $(SOASTA_REST_PREFIX)/siteconfiguration/1 2>&1 | $(LOGIT)
	for channel in $(SLACK_CHANNELS); do echo "Announcing to $$channel"; curl -X POST "https://soasta.slack.com/services/hooks/incoming-webhook?token=CI8oLOcEJ1xfLLWJZBYCr5DI" --data-binary "{\"channel\":\"#$$channel\", \"username\":\"$(SOASTA_USER)\", \"text\":\"Set default boomerang version for all domains to $(DEFAULT_VERSION) on $(SOASTA_SERVER)\",\"icon_emoji\":\":pray:\"}"; echo ""; done
endif

soasta-set-minimum:
ifeq ($(strip $(MINIMUM_VERSION)),)
	echo "Please specify a minimum version using \`make MINIMUM_VERSION=... $@'"
else
	echo "Setting minimum boomerang version to $(MINIMUM_VERSION)..." | $(LOGIT)
	echo '{"attributes":[{"name":"boomerangMinimumVersion","value":"$(MINIMUM_VERSION)"}]}' | $(LOGIT) | curl -vsS $(INSECURE) --data-binary @- --user $(soasta_user_password) $(SOASTA_REST_PREFIX)/siteconfiguration/1 | $(LOGIT)
	for channel in $(SLACK_CHANNELS); do echo "Announcing to $$channel"; curl -X POST "https://soasta.slack.com/services/hooks/incoming-webhook?token=CI8oLOcEJ1xfLLWJZBYCr5DI" --data-binary "{\"channel\":\"#$$channel\", \"username\":\"$(SOASTA_USER)\", \"text\":\"Set minimum boomerang version for all domains to $(MINIMUM_VERSION) on $(SOASTA_SERVER)\",\"icon_emoji\":\":thumbsup:\"}"; echo ""; done
endif

# Put new version of boomerang into repository on svn, and add all necessary migrations.  You still need to commit
new-soasta-push: soasta
	echo "Updating lastModifiedVersion..."
	perl -pi -e '/<Import lastModifiedVersion="\d+" file="boomerang\/Default Boomerang.xml" / && s/lastModifiedVersion="\d+"/lastModifiedVersion="$(SCHEMA_VERSION)"/' $(SOASTA_SOURCE)/WebApplications/Concerto/src/META-INF/RepositoryImports/Index.xml
	mv Default_Boomerang.xml $(SOASTA_SOURCE)/WebApplications/Concerto/src/META-INF/RepositoryImports/boomerang/Default\ Boomerang.xml


lognormal-plugins : override PLUGINS := $(LOGNORMAL_PLUGINS)
lognormal : MINIFIER := java -jar /Users/philip/src/3rd-party/yui/yuicompressor/build/yuicompressor-2.4.8pre.jar --type js

lognormal-plugins: boomerang-$(VERSION).$(DATE)-debug.js


lognormal: lognormal-plugins boomerang-$(VERSION).$(DATE).js
	awk '/BOOMR\.plugins\.NavigationTiming/ { system("cat ln-copyright.txt"); } /BOOMR\.utils\.MD5=[a-zA-Z]/ { system("cat md5-copyright.txt"); } { print }' y-copyright.txt boomerang-$(VERSION).$(DATE).js > $(tmpfile)
	rm boomerang-$(VERSION).$(DATE).js
	chmod a+r $(tmpfile)
	mv $(tmpfile) build/boomerang-$(VERSION).$(DATE).js

lognormal-debug: lognormal-plugins
	cat boomerang-$(VERSION).$(DATE)-debug.js | sed -e 's/key=%client_apikey%/debug=\&key=%client_apikey%/;' > $(tmpfile)
	rm boomerang-$(VERSION).$(DATE)-debug.js
	chmod a+r $(tmpfile)
	mv $(tmpfile) build/boomerang-$(VERSION).$(DATE)-debug.js



###
# Builds a test version of boomerang for a specific API KEY running on rum-dev.
# MUST pass API_KEY as an environment variable
###
mpulse-test: lognormal-debug
	echo "building $(API_KEY).js"
	cat build/boomerang-$(VERSION).$(DATE)-debug.js | sed -e "s,%beacon_dest_host%%beacon_dest_path%,$(SERVER)/,; s,%config_host%%config_path%,$(SERVER)/boomerang/config.js,; s,%client_apikey%,$(API_KEY),; s,%config_url_suffix%,,; s,/\*BEGIN DEBUG TOKEN\*/log:null\,/\*END DEBUG TOKEN\*/,,;" > $(API_KEY).js
	chmod a+r $(API_KEY).js
	scp -C $(API_KEY).js $(STANDALONE_PLUGINS) bacon10:boomerang/ 2>/dev/null;



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
	echo "See https://dev2.soasta.com/twiki/bin/view/Development/ReleasingNewBoomerang"
	echo "for more details"
	echo ""

boomerang-$(VERSION).$(DATE).js: boomerang-$(VERSION).$(DATE)-debug.js
	echo "Making $@ ..."
	cat boomerang-$(VERSION).$(DATE)-debug.js | perl -pe 's/$(JS_CALLS_REMOVE)//' | $(MINIFIER) | perl -pe "s/\(window\)\);/\(window\)\);\n/g; s/\(\)\);\(function\(/\(\)\);\n\(function\(/g;" > $@ && echo "done"
	boomerang_size=$$( cat $@ | gzip -c | wc -c | sed -e 's/^ *//' ); if [ $$boomerang_size -gt 14200 ]; then echo "\n***** WARNING: gzipped boomerang is now $$boomerang_size bytes, which is > 14200 bytes *****"; else echo "gzipped boomerang is $$boomerang_size bytes"; fi
	echo

boomerang-$(VERSION).$(DATE)-debug.js: boomerang.js $(PLUGINS)
	echo
	echo "Making $@ ..."
	echo "using plugins: $(PLUGINS)..."
	cat boomerang.js $(PLUGINS) plugins/zzz_last_plugin.js | sed -e 's/^\(BOOMR\.version = "\)$(VERSION)\("\)/\1$(VERSION).$(DATE)\2/' > $@ && echo "done"
	echo

.PHONY: all lognormal lognormal-plugins lognormal-debug Makefile
.SILENT:
