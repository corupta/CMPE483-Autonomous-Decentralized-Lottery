#!/usr/bin/env bash

if ! [ -x "$(command -v markdown-pdf)" ]; then
  echo 'Error: markdown-pdf is not installed.'
  echo 'Please install it with npm i -g markdown-pdf';
  echo 'If npm fails, try again using node version 8';
  exit 1
fi

if ! [ -x "$(command -v ots-cli.js)" ]; then
  echo 'Error: ots-cli.js (opentimestamps-client) is not installed.'
  exit 1
fi

if ! [ -x "$(command -v zip)" ]; then
  echo 'Error: zip is not installed.'
  exit 1
fi

rm ozsoy.zip
rm ozsoy.zip.ots
rm Report.pdf
cat README.md > Report.md
cat src/web/README.md >> Report.md
markdown-pdf Report.md -o Report.pdf -r "portrait" -m "{\"html\":true,\"breaks\":false}"
rm Report.md
rm -rf src/build/*

zip ozsoy.zip -r src Report.pdf test.sh LICENSE -x src/web/node_modules/\* src/web/*.lock src/web/*-lock.json src/web/.env
ots-cli.js stamp ozsoy.zip
ots-cli.js upgrade ozsoy.zip.ots

rm -r ozsoy
unzip ozsoy.zip -d ozsoy

echo "Zip ozsoy.zip is created, don't forget to check its contents"
echo "Also, don't forget to push the .zip and .ots to github"
echo "1. Put all your files in a directory (directory name should be last names of members of your group)"
echo "2. Zip the directory"
echo "3. E-mail the zipped file to  ozturan@gmail.com . Put the following in the subject: CMPE 483 HW2  <lastname1> <lastname2>  etc."