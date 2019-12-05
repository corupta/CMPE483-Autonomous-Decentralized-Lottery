if ! [ -x "$(command -v truffle)" ]; then
  echo 'Error: zip is not installed.'
  exit 1
fi

cd src
truffle compile
ganache-cli &
truffle migrate --network development
truffle test