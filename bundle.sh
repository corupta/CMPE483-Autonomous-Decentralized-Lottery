#!/bin/bash

if ! [ -x "$(command -v markdown-pdf)" ]; then
  echo 'Error: markdown-pdf is not installed.'
  echo 'Please install it with npm i -g markdown-pdf';
  echo 'If npm fails, try again using node version 8';
  exit 1
fi

#if ! [ -x "$(command -v ots-cli.js)" ]; then
#  echo 'Error: ots-cli.js (opentimestamps-client) is not installed.'
#  exit 1
#fi

if ! [ -x "$(command -v zip)" ]; then
  echo 'Error: zip is not installed.'
  exit 1
fi

rm ozsoy.zip
rm ozsoy.zip.ots
rm Report.pdf
# markdown-pdf Readme.md -o Report.pdf
rm -rf src/build/*

zip ozsoy.zip -r src #Report.pdf
ots-cli.js stamp ozsoy.zip
ots-cli.js upgrade ozsoy.zip.ots
rm Makefile
rm project2.c
rm -r ozsoy
unzip ozsoy.zip -d ozsoy

echo "Zip ozsoy.zip is created, don't forget to check its contents"
echo "Also, don't forget to push the .zip and .ots to github"
echo "1. Put all your files in a directory (directory name should be last names of members of your group)"
echo "2. Zip the directory"
echo "3. E-mail the zipped file to  ozturan@gmail.com . Put the following in the subject: CMPE 483 HW1  <lastname1 <lastname2>  etc."