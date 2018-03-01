#!/bin/bash

tokenTest() {
    truffle test ./tests/token/token.test.js
}

crowdSaleTest() {
    truffle test ./tests/crowdsale/crowdsale.test.js
}

clear
printf "What test(s) would you like to run? "
read TEST

echo "Running test..."

case $TEST in
    token|tc)
    tokenTest
    ;;
    crowdsale|cs)
    crowdSaleTest
    ;;
    *)
    tokenTest
    crowdSaleTest
    ;;
esac

