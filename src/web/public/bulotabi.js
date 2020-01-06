window.bulotabi = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "number",
                "type": "uint32"
            }
        ],
        "name": "purchaseTicket",
        "outputs": [
            {
                "name": "lotteryNumber",
                "type": "uint32"
            },
            {
                "name": "ticketNumber",
                "type": "uint32"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "lotteryNumber",
                "type": "uint32"
            },
            {
                "name": "ticketNumber",
                "type": "uint32"
            }
        ],
        "name": "redeemTicket",
        "outputs": [
            {
                "name": "wonAmount",
                "type": "uint64"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "number",
                "type": "uint32"
            },
            {
                "name": "lotteryNumber",
                "type": "uint32"
            },
            {
                "name": "ticketNumber",
                "type": "uint32"
            }
        ],
        "name": "revealNumber",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "name": "_eip20ContractAddress",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "lotteryNumber",
                "type": "uint32"
            },
            {
                "name": "ticketNumber",
                "type": "uint32"
            }
        ],
        "name": "queryTicket",
        "outputs": [
            {
                "name": "wonAmount",
                "type": "uint64"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];