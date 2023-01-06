import { css } from "@emotion/css";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { useNFT } from "@zoralabs/nft-hooks";
import { formatDistanceToNow, parseISO} from "date-fns";

export function VoteAuctionPage() {
  const { data } = useNFT("0xd8e6b954f7d3F42570D3B0adB516f2868729eC4D", "1598");

  if (!data || !data.markets || !data.markets.length) {
    return null;
  }

  const market = data.markets[0] as any;

  const name = data?.metadata?.name;
  const ipfsLink = data?.metadata?.imageUri;
  const imgLink = (ipfsLink as any).replace("ipfs://", "https://ipfs.io/ipfs/");

  const currentBid = market?.currentBid?.amount?.eth?.value; 
  const auctionEnds = parseISO(market?.endsAt?.timestamp);
  const timeRemaining = formatDistanceToNow(auctionEnds);
  
  console.log(data);
  console.log(imgLink); 
  console.log(timeRemaining);
  const allBids = [
    {
      bidder: "test1.eth",
      amount: 0.2,
      link: "etherscan.io",
    },
    {
      bidder: "test2.eth",
      amount: 0.2,
      link: "etherscan.io",
    },
    {
      bidder: "test3.eth",
      amount: 0.2,
      link: "etherscan.io",
    },
  ];
  const bidItems = allBids.map((bid) =>
    bidItem(bid.bidder, bid.amount, bid.link)
  );

  return (
    <HStack
      gap="16"
      alignItems="center"
      className={css`
        margin-top: ${theme.spacing[16]};
      `}
    >
      <VStack
        className={css`
          background-color: ${theme.colors.white};
          border-radius: ${theme.spacing["3"]};
          padding: ${theme.spacing["4"]};
          border: 1px solid ${theme.colors.gray["300"]};
          box-shadow: ${theme.boxShadow.newDefault};
        `}
      >
        <img
          className={css`
            width: 320px;
            border-radius: ${theme.spacing["2"]};
            border: 1px solid ${theme.colors.gray["300"]};
            box-shadow: ${theme.boxShadow.newDefault};
          `}
          src={imgLink}
          alt=""
        />
        <HStack
          justifyContent="space-between"
          className={css`
            margin-top: ${theme.spacing["2"]};
          `}
        >
          <VStack>
            <div
              className={css`
                font-size: ${theme.fontSize["xs"]};
                color: ${theme.colors.gray["700"]};
                font-weight: ${theme.fontWeight.medium};
              `}
            >
              Noun Owner
            </div>
            <div>jacob.eth</div>
          </VStack>
          <VStack alignItems="flex-end">
            <div
              className={css`
                font-size: ${theme.fontSize["xs"]};
                color: ${theme.colors.gray["700"]};
                font-weight: ${theme.fontWeight.medium};
              `}
            >
              Current delegate
            </div>
            <div>jacob.eth</div>
          </VStack>
        </HStack>
      </VStack>
      <VStack
        gap="6"
        className={css`
          max-width: ${theme.maxWidth["sm"]};
        `}
      >
        <VStack gap="1">
          <div
            className={css`
              font-size: ${theme.fontSize["xs"]};
              color: ${theme.colors.gray["700"]};
              font-weight: ${theme.fontWeight.medium};
            `}
          >
            Auction for 3 months as
          </div>
          <div
            className={css`
              font-size: ${theme.fontSize["2xl"]};
              font-weight: ${theme.fontWeight.extrabold};
            `}
          >
            {name}
          </div>
          <div
            className={css`
              color: ${theme.colors.gray["700"]};
            `}
          >
            The winner of this NFT will be delegated Noun 325&apos; vote for
            three months, starting from 02/01/23 and ending on 05/01/23.
          </div>
        </VStack>
        <HStack justifyContent="space-between">
          <VStack>
            <div
              className={css`
                font-size: ${theme.fontSize["xs"]};
                color: ${theme.colors.gray["700"]};
                font-weight: ${theme.fontWeight.medium};
              `}
            >
              Current bid
            </div>
            <div
              className={css`
                font-weight: ${theme.fontWeight.semibold};
              `}
            >
              {currentBid + " ETH"}
            </div>
          </VStack>
          <div
            className={css`
              height: 100%;
              border-left: 1px solid ${theme.colors.gray["300"]};
            `}
          ></div>
          <VStack>
            <div
              className={css`
                font-size: ${theme.fontSize["xs"]};
                color: ${theme.colors.gray["700"]};
                font-weight: ${theme.fontWeight.medium};
              `}
            >
              Auction ends on
            </div>
            <div
              className={css`
                font-weight: ${theme.fontWeight.semibold};
              `}
            >
              {timeRemaining}
            </div>
          </VStack>
        </HStack>
        <HStack justifyContent="space-between">
          <input
            className={css`
              padding: ${theme.spacing["2"]} ${theme.spacing["4"]};
              border-radius: ${theme.spacing["2"]};
              border: 1px solid ${theme.colors.gray["300"]};
              flex-grow: 2;
              margin-right: ${theme.spacing["4"]};
              &:focus {
                outline: none;
              }
            `}
            type="text"
            placeholder={(currentBid * 1.1).toFixed(2) + " ETH"}
          />
          <button
            className={css`
              padding: ${theme.spacing["2"]} ${theme.spacing["4"]};
              color: ${theme.colors.white};
              background-color: ${theme.colors.black};
              border-radius: ${theme.spacing["2"]};
              flex-grow: 1;
            `}
          >
            Place Bid
          </button>
        </HStack>
        <VStack gap="2">{bidItems}</VStack>
      </VStack>
    </HStack>
  );
}

function bidItem(bidder: string, amount: number, link: string) {
  return (
    <a href={link}>
      <HStack
        justifyContent="space-between"
        className={css`
          color: ${theme.colors.gray[700]};
        `}
      >
        <div>{bidder}</div>
        <div>{amount + " ETH"}</div>
      </HStack>
    </a>
  );
}
