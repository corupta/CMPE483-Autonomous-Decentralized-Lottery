#!/usr/bin/env bash

if ! [ -x "$(command -v truffle)" ]; then
  echo 'Error: truffle is not installed.'
  echo 'Install it via npm i -g truffle'
  exit 1
fi
if ! [ -x "$(command -v ganache-cli)" ]; then
  echo 'Error: ganache-cli is not installed.'
  echo 'Install it via npm i -g ganache-cli'
  exit 1
fi
if ! [ -x "$(command -v concurrently)" ]; then
  echo 'Error: concurrently is not installed.'
  echo 'Install it via npm i -g concurrently'
  exit 1
fi

cd src
concurrently "ganache-cli --quiet" "truffle test" --kill-others --raw