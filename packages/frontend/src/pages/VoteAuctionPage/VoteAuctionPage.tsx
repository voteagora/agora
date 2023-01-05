import { css } from "@emotion/css";
import * as theme from "../../theme";
import { useParams } from "../../components/HammockRouter/HammockRouter";
import { Navigate } from "../../components/HammockRouter/Navigate";
import { HStack, VStack } from "../../components/VStack";

const currentPrice = 0.2;
const auctionTimeRemaining = "1d 2h 3m 4s";
const allBids = [
    {
        bidder: "test1.eth",
        amount: 0.2,
        link: "etherscan.io"
    },
    {
        bidder: "test2.eth",
        amount: 0.2,
        link: "etherscan.io"
    },
    {
        bidder: "test3.eth",
        amount: 0.2,
        link: "etherscan.io"
    }
];
const bidItems = allBids.map((bid) => bidItem(bid.bidder, bid.amount, bid.link));

export function VoteAuctionPage() {
  return (
    <HStack>
      <VStack>
        <img
          className={css`
            width: 320px;
          `}
          src="https://i.imgur.com/wjJxTeO.png"
          alt=""
        />
        <HStack>
          <VStack>
            <div>Noun Owner</div>
            <div>jacob.eth</div>
          </VStack>
          <VStack>
            <div>Current delegate</div>
            <div>jacob.eth</div>
          </VStack>
        </HStack>
      </VStack>
      <VStack>
        <VStack>
          <div>Auction for 3 months as</div>
          <div>Delegate for Noun 325</div>
          <div>
            The winner of this NFT will be delegated Noun 325&apos; vote for three
            months, starting from 02/01/23 and ending on 05/01/23.
          </div>
        </VStack>
        <HStack>
          <VStack>
            <div>Current bid</div>
            <div>{currentPrice + " ETH"}</div>
          </VStack>
          <VStack>
            <div>Auction ends in</div>
            <div>{auctionTimeRemaining}</div>
          </VStack>
        </HStack>
        <HStack>
            <input type="text" placeholder={(currentPrice*1.1).toFixed(2) + " ETH"}/>
            <button>Place Bid</button>
        </HStack>
        <VStack>
            {bidItems}
        </VStack>
      </VStack>
    </HStack>
  );
}

function bidItem(bidder: string, amount: number, link: string) {
  return (
    <a href={link}>
      <HStack justifyContent="space-between" className={css``}>
        <div>{bidder}</div>
        <div>{amount + " ETH"}</div>
      </HStack>
    </a>
  );
}
