import { css } from "@emotion/css";
import * as theme from "../../theme";
import { HStack, VStack } from "../../components/VStack";
import { useNFT } from "@zoralabs/nft-hooks";
import { formatDistanceToNow, parseISO } from "date-fns";
import { shortAddress } from "../../utils/address";
import React, { useEffect, useState } from "react";
import { useContractWrite } from "../../hooks/useContractWrite";
import { ZoraAuctionHouse } from "../../contracts/generated";
import { zoraAuctionHouse } from "../../contracts/contracts";
import { ethers } from "ethers";
// import { constSelector } from "recoil";

// To do:
// - Store auction IDs and dates in an array
// - Choose which auction to display based on date
// - Hitting items in the list changes main auction
// - New auctions still need a deploy

export function VoteAuctionPage() {
  const auctionListRaw = [
    {
      collection: "0x1CFb7e79f406C2a58Cc62A0956238f980F9098Ee",
      tokenId: "1",
    },
    {
      collection: "0xed620248618e2952952826d062A5E2798B472219",
      tokenId: "1",
    },
    {
      collection: "0x5f939767e6948F09B5703e358F3dc2a623687f02",
      tokenId: "1",
    },
    {
      collection: "0xed620248618e2952952826d062A5E2798B472219",
      tokenId: "3",
    },
  ];
  
  const auctionList = [
    useNFT(auctionListRaw[0].collection, auctionListRaw[0].tokenId) || null,
    useNFT(auctionListRaw[1].collection, auctionListRaw[1].tokenId) || null,
    useNFT(auctionListRaw[2].collection, auctionListRaw[2].tokenId) || null,
    useNFT(auctionListRaw[3].collection, auctionListRaw[3].tokenId) || null,
  ];

  // @ts-ignore
  const currentAuction = auctionList.findLast((auction: any) => {
    if (
      !auction.data ||
      !auction.data.markets ||
      !auction.data.markets.length
    ) {
      return null;
    }
    let marketStatus = auction.data.markets[0];
    return marketStatus!;
  })?.data;

  if (
    !currentAuction ||
    !currentAuction.markets ||
    !currentAuction.markets.length ||
    !currentAuction.nft
  ) {
    return null;
  }

  const zoraLink = `https://market.zora.co/collections/${currentAuction.nft.contract.address}/${currentAuction.nft.tokenId}`;

  const market = currentAuction.markets[0];
  if (market.type !== "Auction") {
    return null;
  }
  const auctionEnded = Date.parse(market?.endsAt?.timestamp || "1000000000") < Date.now();
  const name = currentAuction.metadata?.name;
  const imgLink = currentAuction.metadata?.imageUri?.replace(
    "ipfs://",
    "https://ipfs.io/ipfs/"
  );
  const bidEvents =
    currentAuction.events?.filter((item: any) => item.event === "AuctionBid") ??
    [];

  const currentBid =
    market.currentBid?.amount?.eth?.value === undefined
      ? 0
      : market.currentBid?.amount?.eth?.value!;
  const auctionEnds =
    market.endsAt?.timestamp === undefined
      ? 0
      : parseISO(market.endsAt?.timestamp!);
  const timeRemaining =
    auctionEnds === 0 ? "Not started" : formatDistanceToNow(auctionEnds);

  return (
    <VStack
      alignItems="center"
      gap="12"
      className={css`
        width: 100%;
        max-width: ${theme.maxWidth["6xl"]};
        padding: 0 ${theme.spacing["4"]};
      `}
    >
      <HStack
        alignItems="center"
        justifyContent="space-between"
        className={css`
          margin-top: ${theme.spacing[4]};
          width: 100%;
          background-color: ${theme.colors.white};
          border-radius: ${theme.spacing["3"]};
          border: 1px solid ${theme.colors.gray["300"]};
          box-shadow: ${theme.boxShadow.newDefault};
          @media (max-width: ${theme.maxWidth["2xl"]}) {
            margin-top: ${theme.spacing[0]};
            flex-direction: column;
            width: 100%;
            padding: 0 ${theme.spacing[4]};
          }
        `}
      >
        <VStack
          className={css`
            width: 50%;
            padding: ${theme.spacing["16"]};
            border-right: 1px solid ${theme.colors.gray["300"]};
            position: relative;
            left: 1px;
            @media (max-width: ${theme.maxWidth["2xl"]}) {
              margin-bottom: ${theme.spacing["8"]};
              padding: ${theme.spacing["4"]} 0px 0px 0px;
              border-right: 0px;
              width: 100%;
            }
          `}
        >
          <img
            className={css`
              width: 100%;
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
              <div>
                {shortAddress(currentAuction?.nft?.owner?.address as string)}
              </div>
            </VStack>
            <VStack alignItems="flex-end">
              <div
                className={css`
                  font-size: ${theme.fontSize["xs"]};
                  color: ${theme.colors.gray["700"]};
                  font-weight: ${theme.fontWeight.medium};
                `}
              >
                View on
              </div>
              <a href={zoraLink} target="_BLANK" rel="noreferrer">
                <div>Zora</div>
              </a>
            </VStack>
          </HStack>
        </VStack>
        <VStack
          className={css`
            width: 50%;
            border-left: 1px solid ${theme.colors.gray["300"]};
            @media (max-width: ${theme.maxWidth["2xl"]}) {
              width: 100%;
              border-left: 0px;
            }
          `}
        >
          <VStack
            gap="1"
            className={css`
              border-bottom: 1px solid ${theme.colors.gray["300"]};
              padding: ${theme.spacing["12"]} ${theme.spacing["16"]}
                ${theme.spacing["6"]} ${theme.spacing["16"]};
              @media (max-width: ${theme.maxWidth["2xl"]}) {
                padding: ${theme.spacing["6"]} 0px;
              }
            `}
          >
            <div
              className={css`
                font-size: ${theme.fontSize["xs"]};
                color: ${theme.colors.gray["700"]};
                font-weight: ${theme.fontWeight.medium};
              `}
            >
              Vote auction
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
              {currentAuction?.metadata?.description}
            </div>
          </VStack>
          <HStack
            justifyContent="space-between"
            className={css`
              padding: 0 ${theme.spacing["16"]};
              border-bottom: 1px solid ${theme.colors.gray["300"]};
              @media (max-width: ${theme.maxWidth["2xl"]}) {
                padding: 0px;
              }
            `}
          >
            <VStack
              className={css`
                width: 50%;
                border-right: 1px solid ${theme.colors.gray["300"]};
                padding: ${theme.spacing["6"]} 0;
              `}
            >
              <div
                className={css`
                  font-size: ${theme.fontSize["xs"]};
                  color: ${theme.colors.gray["700"]};
                  font-weight: ${theme.fontWeight.medium};
                `}
              >
                {auctionEnded ? (
                  <span>Winning bid</span>
                ) : (
                  <span>Current bid</span>
                )}
              </div>
              <div
                className={css`
                  font-weight: ${theme.fontWeight.semibold};
                `}
              >
                <a href="https://etherscan.io/tx/0xfaff0fe89a48573e9a10d436794bb713f87a5737ab61807b5d86ca624b268f13">
                  {currentBid + " ETH"}
                </a>
              </div>
            </VStack>
            <div
              className={css`
                height: 100%;
                border-left: 1px solid ${theme.colors.gray["300"]};
              `}
            ></div>
            <VStack
              alignItems="flex-end"
              className={css`
                width: 50%;
                padding: ${theme.spacing["6"]} 0;
              `}
            >
              <div
                className={css`
                  font-size: ${theme.fontSize["xs"]};
                  color: ${theme.colors.gray["700"]};
                  font-weight: ${theme.fontWeight.medium};
                `}
              >
                {auctionEnded ? (
                  <span>Auction ended</span>
                ) : (
                  <span>Auction ends in</span>
                )}
              </div>
              <div
                className={css`
                  font-weight: ${theme.fontWeight.semibold};
                `}
              >
                {timeRemaining} {auctionEnded && <span>ago</span>}
              </div>
            </VStack>
          </HStack>
          <PlaceBid market={market} />
          <VStack
            gap="2"
            className={css`
              padding: ${theme.spacing["6"]} ${theme.spacing["16"]}
                ${theme.spacing["12"]} ${theme.spacing["16"]};
              @media (max-width: ${theme.maxWidth["2xl"]}) {
                padding: ${theme.spacing["6"]} 0px;
              }
            `}
          >
            {bidEvents.map((bid: any) =>
              BidItem(bid.sender, bid.price.amount, bid.at.transactionHash)
            )}
          </VStack>
        </VStack>
      </HStack>
      <HStack
        gap="4"
        justifyContent="space-between"
        className={css`
          width: 100%;
          @media (max-width: ${theme.maxWidth["2xl"]}) {
            flex-direction: column-reverse;
          }
        `}
      >
        <VStack
          gap="2"
          className={css`
            max-width: ${theme.maxWidth["3xl"]};
            @media (max-width: ${theme.maxWidth["lg"]}) {
              padding: 0;
            }
          `}
        >
          <div
            className={css`
              font-size: ${theme.fontSize["2xl"]};
              font-weight: ${theme.fontWeight.extrabold};
            `}
          >
            WTF is a vote auction?
          </div>
          <div>
            Agora is auctioning off Noun 174&apos;s vote. On its face, this
            might seem like it's opening the door to minorities buying control
            of the DAO. However, given the level of capital at stake and the
            permissionless nature of Nouns governance, the incentives and means
            already exist for this to play out.
          </div>
          <div>
            On the flip side, this exact same mechanism, properly managed, can
            create a transparent, accessible, and permissionless market to form
            around delegated votes.
          </div>
          <div>
            By creating a market for these votes, we might see an increase in
            vote utilization—given that passive holders could sell their votes
            for a period of time, and potentially even a positive impact on the
            value of a Noun, given the creation of a separate and direct
            mechanism to capture the value of the vote at any given period of
            time without having to sell the Noun.
          </div>
          <div>
            This is why we're excited to pioneer a first vote Auction in
            collaboration with Jacob from Zora. Wanna learn more? Read the full{" "}
            <a
              href="https://jacob.energy/delegation-markets.html"
              className={css`
                border-bottom: 1px solid ${theme.colors.gray["300"]};
                :hover {
                  border-bottom: 1px solid ${theme.colors.gray["700"]};
                }
              `}
            >
              full blog post here.
            </a>
          </div>
          <HStack
            alignItems="center"
            justifyContent="space-between"
            className={css`
              padding: ${theme.spacing["4"]};
              background-color: ${theme.colors.gray["fa"]};
              border-radius: ${theme.spacing["3"]};
              border: 1px solid ${theme.colors.gray["300"]};
              width: 100%;
              margin-bottom: ${theme.spacing["16"]};
              margin-top: ${theme.spacing["4"]};
              @media (max-width: ${theme.maxWidth["2xl"]}) {
                flex-direction: column;
              }
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
                Hey Nouner!
              </div>
              <div>Interested in auctioning your vote? Send us a DM!</div>
            </VStack>
            <a
              href="https://twitter.com/nounsagora"
              target="_blank"
              rel="noreferrer"
              className={css`
                @media (max-width: ${theme.maxWidth["2xl"]}) {
                  width: 100%;
                  margin-top: ${theme.spacing["3"]};
                }
              `}
            >
              <button
                className={css`
                  padding: ${theme.spacing["2"]} ${theme.spacing["4"]};
                  color: ${theme.colors.black};
                  background-color: ${theme.colors.white};
                  border-radius: ${theme.spacing["2"]};
                  border: 1px solid ${theme.colors.gray["300"]};
                  box-shadow: ${theme.boxShadow.newDefault};
                  font-weight: ${theme.fontWeight.medium};
                  :hover {
                    box-shadow: ${theme.boxShadow.none};
                  }
                  @media (max-width: ${theme.maxWidth["2xl"]}) {
                    width: 100%;
                  }
                `}
              >
                Auction&nbsp;my&nbsp;vote
              </button>
            </a>
          </HStack>
        </VStack>
        <AuctionListBox auctionList={auctionList} />
      </HStack>
    </VStack>
  );
}

function BidItem(bidder: string, amount: number, link: string) {
  return (
    <a
      href={`https://etherscan.io/tx/` + link}
      target="_BLANK"
      rel="noreferrer"
    >
      <HStack
        justifyContent="space-between"
        className={css`
          color: ${theme.colors.gray[700]};
        `}
      >
        <>{shortAddress(bidder)}</>
        <div>{amount + " ETH"}</div>
      </HStack>
    </a>
  );
}

function PlaceBid({ market }: { market: any }) {
  const currentBid = market.currentBid?.amount?.eth?.value!;
  const auctionEnded =  Date.parse(market?.endsAt?.timestamp || "1000000000") < Date.now();
  const auctionId = market.auctionId;
  const [bidAmount, setBidAmount] = React.useState("");
  const debouncedbidAmount = useDebounce(bidAmount, 1500);

  const value = (() => {
    try {
      return ethers.utils.parseEther(debouncedbidAmount);
    } catch {
      return ethers.BigNumber.from("0");
    }
  })();

  const write = useContractWrite<ZoraAuctionHouse, "createBid">(
    zoraAuctionHouse,
    "createBid",
    [auctionId, value],
    () => {},
    {
      value,
    }
  );

  return (
    <div
      className={css`
        padding: ${theme.spacing["0"]} ${theme.spacing["16"]}
          ${theme.spacing["0"]} ${theme.spacing["16"]};
        @media (max-width: ${theme.maxWidth["2xl"]}) {
          padding: 0;
        }
      `}
    >
      {auctionEnded ? (
        <div />
      ) : (
        <HStack
          justifyContent="space-between"
          className={css`
            padding-top: ${theme.spacing["6"]};
          `}
        >
          <div
            className={css`
              position: relative;
            `}
          >
            <input
              className={css`
                padding: ${theme.spacing["2"]} ${theme.spacing["4"]};
                border-radius: ${theme.spacing["2"]};
                border: 1px solid ${theme.colors.gray["300"]};
                flex-grow: 4;
                margin-right: ${theme.spacing["4"]};
                &:focus {
                  outline: none;
                }
              `}
              type="text"
              placeholder={
                currentBid === undefined ? "0.1" : (currentBid * 1.2).toFixed(4)
              }
              onChange={(e) => setBidAmount(e.target.value)}
            />
            <div
              className={css`
                position: absolute;
                right: 28px;
                top: 8px;
                z-index: 10;
              `}
            >
              ETH
            </div>
          </div>
          <button
            disabled={!write || +bidAmount < currentBid}
            onClick={() => write?.()}
            className={css`
              padding: ${theme.spacing["2"]} ${theme.spacing["4"]};
              color: ${theme.colors.white};
              background-color: ${theme.colors.black};
              border-radius: ${theme.spacing["2"]};
              font-weight: ${theme.fontWeight.medium};
              flex-grow: 1;
              transition: background-color 0.1s ease-in-out;
              :disabled {
                background-color: ${theme.colors.gray["af"]};
              }
            `}
          >
            Place Bid
          </button>
        </HStack>
      )}
    </div>
  );
}

function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

function AuctionListBox({ auctionList }: any) {
  return (
    <VStack gap="2">
      <h2
        className={css`
          font-size: ${theme.fontSize["2xl"]};
          font-weight: ${theme.fontWeight.extrabold};
        `}
      >
        Auction schedule
      </h2>
      <VStack
        className={css`
          background-color: ${theme.colors.white};
          border-radius: ${theme.spacing["2"]};
          border: 1px solid ${theme.colors.gray["300"]};
          margin-bottom: ${theme.spacing["16"]};
        `}
      >
        {auctionList.map((auction: any) =>
          AuctionItem(
            auction.data.metadata?.name,
            auction.data.metadata?.imageUri?.replace(
              "ipfs://",
              "https://ipfs.io/ipfs/"
            ),
            auction.data.markets.length === 0
              ? "Not started"
              : (auction.data.markets[0].status as string)
          )
        )}
      </VStack>
    </VStack>
  );
}

function AuctionItem(name: string, imageURL: string, status: string) {
  return (
    <HStack
      gap="4"
      className={css`
        padding: ${theme.spacing["5"]} ${theme.spacing["5"]};
        border-bottom: 1px solid ${theme.colors.gray["300"]};
        :last-child {
          border-bottom: 0px;
        }
      `}
    >
      <img
        src={imageURL}
        alt="auctionImg"
        className={css`
          width: ${theme.spacing["12"]};
          border: 1px solid ${theme.colors.gray["300"]};
          border-radius: ${theme.borderRadius["md"]};
        `}
      />
      <VStack
        justifyContent="center"
        className={css`
          height: 100%;
        `}
      >
        <div>{name}</div>
        <div
          className={css`
            color: ${theme.colors.gray["700"]};
            font-size: ${theme.fontSize["sm"]};
            font-weight: ${theme.fontWeight.medium};
            text-transform: capitalize;
          `}
        >
          {status}
        </div>
      </VStack>
    </HStack>
  );
}
