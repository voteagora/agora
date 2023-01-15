import { css } from "@emotion/css";
import * as theme from "../../theme";
import React, { useEffect, useState } from "react";
import { HStack, VStack } from "../../components/VStack";
import { useNFT } from "@zoralabs/nft-hooks";
import { formatDistanceToNow, parseISO } from "date-fns";
import { shortAddress } from "../../utils/address";
import { useContractWrite } from "../../hooks/useContractWrite";
import { ZoraAuctionHouse } from "../../contracts/generated";
import { zoraAuctionHouse } from "../../contracts/contracts";
import { ethers } from "ethers";

export function VoteAuctionPage() {
  const collection = "0x1CFb7e79f406C2a58Cc62A0956238f980F9098Ee";
  const tokenId = "1";
  const zoraLink = `https://market.zora.co/collections/${collection}/${tokenId}`;
  const { data } = useNFT(collection, tokenId);

  if (!data || !data.markets || !data.markets.length) {
    return null;
  }

  const market = data.markets[0];
  if (market.type !== "Auction") {
    return null;
  }

  const name = data.metadata?.name;
  const ipfsLink = data.metadata?.imageUri;
  const imgLink = ipfsLink?.replace("ipfs://", "https://ipfs.io/ipfs/");
  const bidEvents =
    data.events?.filter((item: any) => item.event === "AuctionBid") ?? [];

  const currentBid = market.currentBid?.amount?.eth?.value!;
  const auctionEnds = parseISO(market.endsAt?.timestamp!);
  const timeRemaining = formatDistanceToNow(auctionEnds);

  return (
    <VStack alignItems="center" gap="12">
      <HStack
        alignItems="center"
        justifyContent="space-between"
        className={css`
          margin-top: ${theme.spacing[4]};
          width: ${theme.maxWidth["3xl"]};
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
            background-color: ${theme.colors.white};
            border-radius: ${theme.spacing["3"]};
            padding: ${theme.spacing["4"]};
            border: 1px solid ${theme.colors.gray["300"]};
            box-shadow: ${theme.boxShadow.newDefault};
            @media (max-width: ${theme.maxWidth["2xl"]}) {
              margin-bottom: ${theme.spacing["8"]};
            }
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
                View on
              </div>
              <a href={zoraLink} target="_BLANK" rel="noreferrer">
                <div>Zora</div>
              </a>
            </VStack>
          </HStack>
        </VStack>
        <VStack
          gap="4"
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
              Vote auction for
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
              The winner of this NFT will be delegated Noun 174&apos;s vote for
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
                Winning bid
              </div>
              <div
                className={css`
                  font-weight: ${theme.fontWeight.semibold};
                `}
              >
                <a href="https://etherscan.io/tx/0xfaff0fe89a48573e9a10d436794bb713f87a5737ab61807b5d86ca624b268f13">
                  {currentBid + " ETH"} by necfas.eth
                </a>
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
                Auction ended
              </div>
              <div
                className={css`
                  font-weight: ${theme.fontWeight.semibold};
                `}
              >
                {timeRemaining} ago
              </div>
            </VStack>
          </HStack>
          <PlaceBid market={market} />
          <VStack gap="2">
            {bidEvents.map((bid: any) =>
              BidItem(bid.sender, bid.price.amount, bid.at.transactionHash)
            )}
          </VStack>
        </VStack>
      </HStack>

      <VStack
        gap="2"
        className={css`
          max-width: ${theme.maxWidth["3xl"]};
          @media (max-width: ${theme.maxWidth["2xl"]}) {
            padding: 0 ${theme.spacing[4]};
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
          Agora is auctioning off Noun 174&apos;s vote. On its face, this might
          seem like it's opening the door to minorities buying control of the
          DAO. However, given the level of capital at stake and the
          permissionless nature of Nouns governance, the incentives and means
          already exist for this to play out.
        </div>
        <div>
          On the flip side, this exact same mechanism, properly managed, can
          create a transparent, accessible, and permissionless market to form
          around delegated votes.
        </div>
        <div>
          By creating a market for these votes, we might see an increase in vote
          utilization—given that passive holders could sell their votes for a
          period of time, and potentially even a positive impact on the value of
          a Noun, given the creation of a separate and direct mechanism to
          capture the value of the vote at any given period of time without
          having to sell the Noun.
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
      </VStack>

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
          @media (max-width: ${theme.maxWidth["2xl"]}) {
            width: calc(100% - ${theme.spacing["8"]});
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
            `}
          >
            Auction&nbsp;my&nbsp;vote
          </button>
        </a>
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
  const marketStatus = market.status.toString() as string;
  const [bidAmount, setBidAmount] = React.useState("");
  const debouncedbidAmount = useDebounce(bidAmount, 1500);
  console.log(marketStatus);

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
    [7647, value],
    () => {},
    {
      value,
    }
  );

  return (
    <HStack justifyContent="space-between">
      {/* <div
        className={css`
          position: relative;
        `}
      >
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
          placeholder={(currentBid * 1.2).toFixed(4)}
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
      </button> */}
    </HStack>
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
