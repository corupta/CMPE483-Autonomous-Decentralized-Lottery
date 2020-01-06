window.addEventListener('load', async () => {
    // Modern dapp browsers...
    if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        try {
            // Request account access if needed
            await ethereum.enable();
        } catch (error) {
            alert("Cannot access user ethereum account") ;
        }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
        window.web3 = new Web3(window.web3.currentProvider);
    }
    // Non-dapp browsers...
    else {
        alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
} ) ;

/* get lottery contract address from node server passed as a cookie */
function _initializeLotteryContractAddress() {
    if (window.lotteryContractAddress) {
        return;
    }
    const cookies = document.cookie.split(';');
    cookies.forEach((cookie) => {
        if (cookie.match('lottery_contract_address')) {
            window.lotteryContractAddress = cookie.split('=')[1];
        }
    });
}
_initializeLotteryContractAddress();

function _getLotteryContract() {
    return window.web3.eth.contract(window.bulotabi).at(window.lotteryContractAddress);
}
// decode revert message if any
function _msgDecode(rawMessage) {
    rawMessage = rawMessage.slice(2);
    // Get the length of the revert reason
    const strLen = parseInt(rawMessage.slice(8 + 64, 8 + 128), 16)
    // Using the length and known offset, extract and convert the revert reason
    const reasonCodeHex = rawMessage.slice(8 + 128, 8 + 128 + (strLen * 2))
    // Convert reason from hex to string
    return web3.toAscii('0x' + reasonCodeHex);
}

function _getFromAddress () {
    return web3.eth.defaultAccount;
}

function _callContractMethod(methodName, onSuccessCallback, ...args) {
    let data = _getLotteryContract()[methodName].getData(...args);
    window.web3.eth.call({ to: window.lotteryContractAddress, data, from: _getFromAddress() }, (error, rawMessage) => {
        if (error) {
            alert(error.toString());
        } else if (_msgDecode(rawMessage)) {
            alert(_msgDecode(rawMessage));
        } else {
            _getLotteryContract()[methodName].call(...args, { from: _getFromAddress() }, (err, response) => {
                if (err) {
                    alert(err.toString());
                } else {
                    _getLotteryContract()[methodName](...args, { from: _getFromAddress() }, (e, txhash) => {
                        if (e) {
                            alert(e.message);
                        } else {
                            onSuccessCallback(response);
                            console.log('success on', methodName, 'with args', ...args, 'txhash:', txhash);
                        }
                    });
                }
            });
        }
    });
}
/*
function softCall() {
    let data = _getLotteryContract().queryTicket.getData(1,2);
    window.web3.eth.call({
        to: window.lotteryContractAddress,
        data
    }, (error, rawMessage) => {
        console.log('raw mesg', error, rawMessage);
    });
}

function checkTransactionStatus(txHash, onSuccessCallback) {
    window.web3.eth.getTransactionReceipt(txHash, (error, receipt) => {
        if (error) {
            alert(error.toString());
        } else {
            console.log('receipt', receipt);
            window.web3.eth.getTransaction(txHash, (err, tx) => {
                console.log('tx', tx);
               if (err) {
                   alert(err.toString());
               } else if (tx.gas === receipt.gasUsed) {
                   alert("Error: Transaction failed as it ran out of gas.");
               } else {
                   window.web3.eth.call({
                       to: tx.to,
                       data: tx.input,
                       from: tx.from,
                       value: tx.value,
                       gas: tx.gas,
                       gasPrice: tx.gasPrice,
                   }, tx.blockNumber, (e, rawMessage) => {
                       if (e) {
                           alert(e.toString());
                       } else if (receipt.status === "0x0") {
                           console.log("rawraw", rawMessage);
                           // reverted, parse revert message
                           rawMessage = rawMessage.slice(2);
                           // Get the length of the revert reason
                           const strLen = parseInt(rawMessage.slice(8 + 64, 8 + 128), 16)
                           // Using the length and known offset, extract and convert the revert reason
                           const reasonCodeHex = rawMessage.slice(8 + 128, 8 + 128 + (strLen * 2))
                           // Convert reason from hex to string
                           const reason = web3.toAscii('0x' + reasonCodeHex);
                           alert(reason);
                       } else {
                           // success for real
                           console.log('raw success message', rawMessage);
                       }
                   })
               }
            });
            console.log('success on check t')
        }
    })
}*/

/* functions for lottery contract */
function purchaseTicket(secretNumber, onSuccessCallback) {
    const start = new Date();
    _callContractMethod('purchaseTicket', function (response) {
        const end = new Date();
        const [lotteryNumber, ticketNumber] = response.map((x) => x.toString());
        return onSuccessCallback({ secretNumber, start, end, lotteryNumber, ticketNumber, from: _getFromAddress() });
    }, secretNumber);
}

function revealNumber(secretNumber, lotteryNumber, ticketNumber, onSuccessCallback) {
    const start = new Date();
    _callContractMethod('revealNumber', function (response) {
        const end = new Date();
        return onSuccessCallback({ secretNumber, lotteryNumber, ticketNumber, start, end, from: _getFromAddress() });
    }, secretNumber, lotteryNumber, ticketNumber);
}

function queryTicket(lotteryNumber, ticketNumber, onSuccessCallback) {
    const start = new Date();
    _callContractMethod('queryTicket', function (response) {
        const end = new Date();
        const wonAmount = response.toString();
        return onSuccessCallback({ lotteryNumber, ticketNumber, start, end, wonAmount, from: _getFromAddress() });
    }, lotteryNumber, ticketNumber);
}

function redeemTicket(lotteryNumber, ticketNumber, onSuccessCallback) {
    const start = new Date();
    _callContractMethod('redeemTicket', function (response) {
        const end = new Date();
        const wonAmount = response.toString();
        return onSuccessCallback({ lotteryNumber, ticketNumber, start, end, wonAmount, from: _getFromAddress() });
    }, lotteryNumber, ticketNumber);
}
/* functions for lottery contract ends */
function updateResultStore(nextResult) {
    localStorage.setItem('bulot-result', nextResult);
}
function getResultStore() {
    return localStorage.getItem('bulot-result') || '';
}