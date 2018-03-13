build:
	browserify js/main.es6 -t babelify --outfile js/build/build.js

watch:
	watchify js/main.es6 -v -t babelify -o js/build/build.js

prod:
	browserify js/main.es6 -t babelify --outfile js/build/build.js
	uglifyjs js/build/build.js -o js/build/build.min.js
	uglifycss css/main.css > css/main.min.css

serve:
	serve -p 8555 ./
