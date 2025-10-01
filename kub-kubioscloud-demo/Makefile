VENV_DIR ?= venv
SOURCES := $(shell find ./kubioscloud_demos -name "*.py" -print)

PYTHON_PATH := $(shell which python3)
PYTHON ?= $(shell basename $(PYTHON_PATH))

all: help


.PHONY: help
# Minor modifications on work from:
# https://gist.github.com/rcmachado/af3db315e31383502660
# Which is based on https://gist.github.com/prwhite/8168133#comment-1313022
## This help screen
help:
	@printf "Available targets\n\n"
		@awk '/^[%a-zA-Z\-\_0-9]+:/ { \
			helpMessage = match(lastLine, /^## (.*)/); \
			if (helpMessage) { \
			helpCommand = substr($$1, 0, index($$1, ":")-1); \
			helpMessage = substr(lastLine, RSTART + 3, RLENGTH); \
			printf "%-25s %s\n", helpCommand, helpMessage; \
			} \
			} \
			{ lastLine = $$0 }' $(MAKEFILE_LIST)


## Build local virtualenv
venv: $(VENV_DIR)/bin/activate
$(VENV_DIR)/bin/activate: setup.py git_version.py
	test -d $(VENV_DIR) || $(PYTHON) -m venv --system-site-packages $(VENV_DIR)
	. ./$(VENV_DIR)/bin/activate && $(PYTHON) -m pip install --upgrade pip
	. ./$(VENV_DIR)/bin/activate && $(PYTHON) -m pip install ".[dev]"
	touch $(VENV_DIR)/bin/activate


git_version.py: .git/*/*
	$(PYTHON) -c 'import subprocess; print("version = \"{}\"".format(subprocess.check_output("git describe --always".split()).strip().decode("ascii").replace("-", "+", 1).replace("-", ".")))' >$@


## Run black on all the .py files
black-it: venv
	. ./venv/bin/activate && black setup.py kubioscloud_demos

## Test it.
test: venv
	rm -rf .coverage
	. ./venv/bin/activate && pytest -v kubioscloud_demos

## Clean local artifacts
clean:
	rm -rf ./venv
	find . -name "*.pyc" -delete
	rm -f git_version.py
