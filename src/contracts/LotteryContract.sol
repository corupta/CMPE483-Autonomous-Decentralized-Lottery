pragma solidity ^0.4.21;

contract LotteryContract {
    uint256 systemBeginTime;
    address eip20ContractAddress;
    struct Ticket {
        address owner;
        bytes32 hash;
        uint32 revealIndex;
        bool revealed;
        bool redeemed;
    }

    struct Lottery {
        Ticket[] tickets;
        uint32 currentRandom;
        uint32 lastRevealIndex;
    }

    Lottery[] lotteries;


    modifier purchaseStageOnly() {
        require(
            ((now - systemBeginTime) / (1 weeks)) % 2 == 0,
            "Current lottery is in reveal stage, you can't purchase tickets this week."
        );
        _;
    }
    modifier revealStageOnly() {
        require(
            ((now - systemBeginTime) / (1 weeks)) % 2 == 1,
            "Current lottery is in submission stage, you can't reveal numbers this week."
        );
        _;
    }
    modifier currentLotteryOnly(uint32 lotteryNumber) {
        require(
            lotteryNumber == (now - systemBeginTime) / (2 weeks),
            "You can make the current action only in the current lottery."
        );
        _;
    }
    modifier pastLotteryOnly(uint32 lotteryNumber) {
        require(
            lotteryNumber < (now - systemBeginTime) / (2 weeks),
            "You can make the current action only in the past lotteries."
        );
        _;
    }
    modifier ticketExists(uint32 lotteryNumber, uint32 ticketNumber) {
        require(
            (lotteries[lotteryNumber].tickets.length > ticketNumber),
            "Ticket doesn't exists"
        );
        _;
    }
    modifier ticketOwnerOnly(uint32 lotteryNumber, uint32 ticketNumber) {
        require(
            (lotteries[lotteryNumber].tickets[ticketNumber].owner == msg.sender),
            "Ticket doesn't belong to you"
        );
        _;
    }
    modifier notRevealedTicketOnly(uint32 lotteryNumber, uint32 ticketNumber) {
        require(
            (lotteries[lotteryNumber].tickets[ticketNumber].revealed == false),
            "The number submitted in this ticket is already revealed before"
        );
        _;
    }
    modifier revealedTicketOnly(uint32 lotteryNumber, uint32 ticketNumber) {
        require(
            (lotteries[lotteryNumber].tickets[ticketNumber].revealed == true),
            "The number submitted in this ticket is already revealed before"
        );
        _;
    }
    //    modifier notRedeemedTicketOnly(uint32 lotteryNumber, uint32 ticketNumber) {
    //        require(
    //            (lotteries[lotteryNumber].tickets[ticketNumber].redeemed == false),
    //            "The number submitted in this ticket is already revealed before"
    //        );
    //        _;
    //    }

    function LotteryContract(
        address _eip20ContractAddress
    ) public {
        eip20ContractAddress = _eip20ContractAddress;
        systemBeginTime = now;
    }

    // Purchases a ticket with a secret number submitted to reveal in next stage.
    function purchaseTicket(uint32 number)
    purchaseStageOnly
    public returns (uint32 lotteryNumber, uint32 ticketNumber){
        require(
            eip20ContractAddress.call(abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                msg.sender, this, 10
            )),
            "Please make sure to approve 10 TL tokens for this contract in EIP20 TL Token contract"
        );
        lotteryNumber = uint32((now - systemBeginTime) / (2 weeks));
        if (lotteries.length <= lotteryNumber) {
            lotteries.length = lotteryNumber + 1;
        }
        // assume no more than 2**32 tickets submitted per lottery.
        ticketNumber = uint32(lotteries[lotteryNumber].tickets.push(Ticket({
            owner: msg.sender,
            hash: keccak256(abi.encodePacked(number, msg.sender)),
            revealIndex: 0,
            revealed: false,
            redeemed: false
            }))) - 1;
    }

    // Reveals submitted number in a ticket in the current lottery
    // lotteryNumber is only requested to make sure
    // the sender knows which lottery he/she is revealing his number
    // (it is only taken to better inform the sender on error)
    // ie: let's say that sender purchased a ticket in lottery 1 (week 3)
    // then, forgot to reveal that number in week 4.
    // then, tried to reveal that number in week5 (reveal period of lottery 2)
    // if the function did not take a lotteryNumber it would only tell the sender
    // that either the ticket doesn't exist in the current lottery, it doesn't belong to him/her
    // or would try to reveal the number if he submitted a ticker in lotter 2 also
    // and for some reason it had the same ticketNumber. In such case,
    // the sender my accidentally reveal another ticket of hers/his if he/she submitted the same number
    // or would receive error, the sent number is wrong which would be very confusing for him/her.
    // now, instead we take lotteryNumber and better inform the sender in such situation
    // with saying that he/she can't reveal number because that lottery has already finished.
    function revealNumber(uint32 number, uint32 lotteryNumber, uint32 ticketNumber)
    revealStageOnly currentLotteryOnly(lotteryNumber)
    ticketExists(lotteryNumber, ticketNumber)
    ticketOwnerOnly(lotteryNumber, ticketNumber)
    notRevealedTicketOnly(lotteryNumber, ticketNumber)
    public {
        require(
            (lotteries[lotteryNumber].tickets[ticketNumber].hash == keccak256(abi.encodePacked(number, msg.sender))),
            "You revealed a wrong number, make sure to reveal the number you submitted"
        );
        lotteries[lotteryNumber].tickets[ticketNumber].revealed = true;
        lotteries[lotteryNumber].tickets[ticketNumber].revealIndex =
        lotteries[lotteryNumber].lastRevealIndex;
        lotteries[lotteryNumber].lastRevealIndex += 1;
        lotteries[lotteryNumber].currentRandom ^= number;
    }

    // Redeem ticket prizes from a finished lottery
    function redeemTicket(uint32 lotteryNumber, uint32 ticketNumber)
    pastLotteryOnly(lotteryNumber)
    ticketExists(lotteryNumber, ticketNumber)
    ticketOwnerOnly(lotteryNumber, ticketNumber)
    revealedTicketOnly(lotteryNumber, ticketNumber)
        //    notRedeemedTicketOnly(lotteryNumber, ticketNumber)
    public returns (uint32 wonAmount) {
        // using some modifiers inline due to stack too deep error !!!
        require(
            (lotteries[lotteryNumber].tickets[ticketNumber].redeemed == false),
            "The requested ticket is already redeemed before"
        );
        uint32 ticketIndex = lotteries[lotteryNumber].tickets[ticketNumber].revealIndex;
        uint32 validTicketCount = lotteries[lotteryNumber].lastRevealIndex;
        uint64 seed = lotteries[lotteryNumber].currentRandom;
        wonAmount = 0;
        uint32 totalMoney = validTicketCount * 10;
        while (totalMoney > 0) {
            if (seed % validTicketCount == ticketIndex) {
                // ticket won the next prize
                wonAmount += (totalMoney / 2) + (totalMoney % 2);
            }
            totalMoney = totalMoney / 2;
            seed = (seed * 16807) % 2147483647; // Park and Miller in the Oct 88 issue of CACM
        }
        require(
            eip20ContractAddress.call(abi.encodeWithSignature(
                "transfer(address,uint256)",
                msg.sender, wonAmount
            )),
            "Failed to transfer tokens to your account on EIP20 TL Token contract, please try again later"
        );
        lotteries[lotteryNumber].tickets[ticketNumber].redeemed = true;
    }
}
