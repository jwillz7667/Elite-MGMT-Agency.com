# =============================================================================
# Elite MGMT Agency · Make targets
#
# Thin wrappers around `npm run *`. Provided for engineers who prefer Make
# semantics and for CI environments where `make ci` is a common idiom.
#
# Owner: Viral Ventures LLC
# =============================================================================

SHELL := /bin/bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help

NODE_VERSION := $(shell cat .nvmrc 2>/dev/null || echo "20")

.PHONY: help install dev preview format format-check lint lint-html lint-css lint-js \
        validate audit a11y perf check clean ci doctor open

help: ## Show this help
	@awk 'BEGIN {FS = ":.*?## "; printf "Elite MGMT Agency — make targets\n\n"} \
		/^[a-zA-Z_-]+:.*?## / { printf "  \033[1m%-14s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Install dev dependencies
	npm install

dev: ## Run the local dev server (http://localhost:4173)
	npm run dev

preview: ## Run the dev server bound to 0.0.0.0 (LAN preview)
	npm run preview

format: ## Format all source files with Prettier
	npm run format

format-check: ## Verify formatting without writing
	npm run format:check

lint: lint-html lint-css lint-js ## Run all linters

lint-html: ## html-validate
	npm run lint:html

lint-css: ## stylelint
	npm run lint:css

lint-js: ## eslint
	npm run lint:js

validate: ## Structural / schema / asset validator
	npm run validate

a11y: ## Pa11y accessibility audit (requires server on :4173)
	npm run audit:a11y

perf: ## Lighthouse CI audit
	npm run audit:perf

audit: ## All audits (lint + validate + a11y + perf)
	npm run audit

check: ## Pre-commit gate (format-check + lint + validate)
	npm run check

clean: ## Remove cached artifacts
	npm run clean

ci: check audit ## Full CI pipeline locally

doctor: ## Print environment information
	@echo "node:    $$(node -v)"
	@echo "npm:     $$(npm -v)"
	@echo ".nvmrc:  $(NODE_VERSION)"
	@echo "git:     $$(git --version)"
	@echo "remote:  $$(git remote get-url origin 2>/dev/null || echo '(no remote)')"

open: ## Open the local dev URL in the default browser (macOS)
	@open http://localhost:4173 2>/dev/null || \
		xdg-open http://localhost:4173 2>/dev/null || \
		echo "Open http://localhost:4173 manually"
