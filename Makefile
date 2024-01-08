test:
	npm test
publish:
	npm publish --dry-run
	npm link
test-coverage:
	npm test -- --coverage --coverageProvider=v8
install:
	npm ci
lint:
	npx eslint .