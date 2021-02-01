APP_NAME=able-esmtask
DOMAIN_SUFFIX=.service.d-velop.cloud
BUILD_VERSION=rev.$(shell git rev-parse --short HEAD).date.$(shell date '+%d-%m-%Y-%H.%M.%S')

all: build

clean:
	rm -rf ./dist
	rm -rf ./terraform/.terraform

init:
	mkdir -p ./dist/test-reports

test: init
	@echo no test execution support so far

build: clean build-lambda

build-lambda: test
	zip -X -r ./dist/lambda.zip *.js node_modules modules routes views

tf-bucket:
	$(eval BUCKET_NAME=$(APP_NAME)-terraform)
	@aws s3api get-bucket-location --bucket $(BUCKET_NAME) > /dev/null 2>&1; \
	if  [ "$$?" -ne "0" ]; \
	then \
		echo Create terraform state bucket \"$(BUCKET_NAME)\"...; \
		aws s3api create-bucket --bucket $(BUCKET_NAME) --acl private --region eu-central-1 --create-bucket-configuration LocationConstraint=eu-central-1 &&\
		aws s3api put-bucket-versioning --bucket $(BUCKET_NAME) --versioning-configuration Status=Enabled &&\
		aws s3api put-public-access-block --bucket $(BUCKET_NAME) --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true; \
	fi

tf-init: tf-bucket
	cd ./terraform && \
	terraform init -input=false -plugin-dir=/usr/local/lib/custom-terraform-plugins

plan: tf-init build-lambda asset_hash
	$(eval PLAN=$(shell mktemp))
	cd ./terraform && \
	terraform plan -input=false \
	-var 'signature_secret="$(SIGNATURE_SECRET)"' \
	-var 'build_version="$(BUILD_VERSION)"' \
	-var 'appname="$(APP_NAME)"' \
	-var 'domainsuffix="$(DOMAIN_SUFFIX)"' \
	-var 'asset_hash="$(ASSET_HASH)"' \
	-out=$(PLAN)

apply: plan
	cd ./terraform && \
	terraform apply -input=false -auto-approve=true $(PLAN)

deploy-assets: asset_hash apply
	# best practice for immutable content: cache 1 year (vgl https://jakearchibald.com/2016/caching-best-practices/)
	aws s3 sync ./web s3://$(APP_NAME)-assets/$(ASSET_HASH) --exclude "*.html" --cache-control max-age=31536000

asset_hash:
	$(eval ASSET_HASH=$(shell find web -type f ! -path "*.html" -exec md5sum {} \; | sort -k 2 | md5sum | tr -d " -"))

deploy: apply deploy-assets

show: tf-init
	cd ./terraform && \
	terraform show

rename:
	if [ -z $${NAME} ]; then echo "NAME is not set. Usage: rename NAME=NEW_APP_NAME"; exit 1; fi
	@echo Rename App to $(NAME) ...
	find . -path ./node_modules -prune -name "docker-build.*" -or -name "Makefile" -or -name "*.tf" -or -name "*.js" | while read f; do		\
		echo "Processing file '$$f'";															\
		sed -i 's/$(APP_NAME)/$(NAME)/g' $$f;														\
	done

destroy: tf-init
	echo "destroy is disabled. Uncomment in Makefile to enable destroy."
	#cd ./terraform && \
	#terraform destroy -var 'signature_secret="$SIGNATURE_SECRET"' -var 'build_version="$build_version"' -var 'appname="$(APP_NAME)"' -var 'domainsuffix="$(DOMAIN_SUFFIX)"' -input=false -force

dns:
	cd ./terraform && terraform output -json | jq "{Domain: .domain.value, Nameserver: .nameserver.value}" > ../dist/dns-entry.json

