#!/bin/bash

#first change the directory to where the script is located
cd "$( dirname "${BASH_SOURCE[0]}" )/.."

echo -n  "Generating rank category mapping ... "
node_modules/phantomjs/lib/phantom/bin/phantomjs phantomjs/scrapeRankCategoryMappings.js 2> /dev/null
echo "done"
