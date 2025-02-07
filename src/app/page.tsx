"use client";
import Link from "next/link";
import { useState, useEffect, JSX } from "react";
import {
  Abstraxion,
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useAbstraxionClient,
  useModal,
} from "@burnt-labs/abstraxion";
import { Button } from "@burnt-labs/ui";
import "@burnt-labs/ui/dist/index.css";
import type { ExecuteResult } from "@cosmjs/cosmwasm-stargate";

const contractAddress =
  "xion1fpv5yfe0rsq5w44tcs7puzpq4v5hql9e3tnnr72krferprsc3vdswsede4";

const treasuryConfig = {
  treasury: "xion1ymwvwwgn546ecxw7k94ll3dnd7gg5rhda07zuckcgkja7m2rqcpsqlu52s",
};

type ExecuteResultOrUndefined = ExecuteResult | undefined;

export default function Page(): JSX.Element {
  // Abstraxion hooks
  const { data: account } = useAbstraxionAccount();
  const { client, signArb, logout } = useAbstraxionSigningClient();
  const { client: queryClient } = useAbstraxionClient();

  // State variables
  const [count, setCount] = useState<string | null>(null);
  const [myTokenCount, setMyTokenCount] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [executeResult, setExecuteResult] =
    useState<ExecuteResultOrUndefined>(undefined);
  const [, setShowModal]: [
    boolean,
    React.Dispatch<React.SetStateAction<boolean>>
  ] = useModal();

  const blockExplorerUrl = `https://explorer.burnt.com/xion-testnet-1/tx/${executeResult?.transactionHash}`;

  // Fetch the count from the smart contract
  async function getCount() {
    setLoading(true);
    try {
      if (!queryClient) {
        throw new Error("Query client is not available");
      }

      const response = await queryClient.queryContractSmart(contractAddress, {
        num_tokens: {},
      });
      setCount(response.count);
      console.log("Get Count:", response);

      // To test who is the right minter
      // const minter = await queryClient.queryContractSmart(contractAddress, { minter: {} });
      // console.log(minter);
    } catch (error) {
      console.error("Error querying contract:", error);
    } finally {
      setLoading(false);
    }
  }

  async function getMyTokenCount() {
    setLoading(true);
    try {
      if (!queryClient) {
        throw new Error("Query client is not available");
      }

      const response = await queryClient.queryContractSmart(contractAddress, {
        tokens: {
          owner: account.bech32Address,
          limit: 100,
        },
      });

      setMyTokenCount(response.tokens.length.toString());
    } catch (error) {
      console.error("Error querying contract:", error);
    } finally {
      setLoading(false);
    }
  }

  async function mint() {
    setLoading(true);

    const tokenId = parseInt(count || "0") + 1;

    const msg = {
      mint: {
        token_id: String(tokenId),
        owner: account.bech32Address,
        token_uri: `https://example.com/metadata/${tokenId}`,
        extension: {},
      },
    };

    console.log(msg);

    console.log(account.bech32Address);

    try {
      // const res = await client?.execute(account.bech32Address, contractAddress, msg, "auto");
      const res = await client?.execute(
        account.bech32Address,
        contractAddress,
        msg,
        {
          amount: [{ amount: "1", denom: "uxion" }],
          gas: "500000",
          granter: treasuryConfig.treasury,
        },
        "",
        []
      );
      setExecuteResult(res);
      console.log("Transaction successful:", res);
      await getCount(); // Refresh count after successful increment
    } catch (error) {
      console.error("Error executing transaction:", error);
    } finally {
      setLoading(false);
    }
  }

  async function transfer() {
    setLoading(true);
    try {
      if (!client) {
        throw new Error("Signing client is not available");
      }

      const msg = {
        transfer_nft: {
          recipient,
          token_id: tokenId,
        },
      };

      const res = await client.execute(
        account.bech32Address,
        contractAddress,
        msg,
        {
          amount: [{ amount: "1", denom: "uxion" }],
          gas: "500000",
          granter: treasuryConfig.treasury,
        },
        "",
        []
      );

      setExecuteResult(res);
      console.log("Transfer successful:", res);
      await getMyTokenCount(); // Refresh token count after successful transfer
    } catch (error) {
      console.error("Error executing transfer:", error);
    } finally {
      setLoading(false);
    }
  }

  // Fetch count on page load
  useEffect(() => {
    if (queryClient) {
      getCount();
    }
  }, [queryClient]);

  const [tokenId, setTokenId] = useState<string>("");

  const [recipient, setRecipient] = useState<string>("");

  return (
    <main className="m-auto flex min-h-screen max-w-xs flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold tracking-tighter text-white">
        ABSTRAXION
      </h1>

      <Button fullWidth onClick={() => setShowModal(true)} structure="base">
        {account?.bech32Address ? (
          <div className="flex items-center justify-center">VIEW ACCOUNT</div>
        ) : (
          "CONNECT"
        )}
      </Button>

      {client && (
        <>
          <Button
            disabled={loading}
            fullWidth
            onClick={getCount}
            structure="base"
          >
            {loading ? "LOADING..." : "Get Count"}
          </Button>
          <Button disabled={loading} fullWidth onClick={mint} structure="base">
            {loading ? "LOADING..." : "MINT"}
          </Button>
          <Button
            disabled={loading}
            fullWidth
            onClick={getMyTokenCount}
            structure="base"
          >
            {loading ? "LOADING..." : "MY TOKEN COUNT"}
          </Button>
          {logout && (
            <Button
              disabled={loading}
              fullWidth
              onClick={logout}
              structure="base"
            >
              LOGOUT
            </Button>
          )}
        </>
      )}

      <Abstraxion onClose={() => setShowModal(false)} />

      {count !== null && (
        <div className="border-2 border-primary rounded-md p-4 flex flex-row gap-4">
          <div className="flex flex-row gap-6">
            <div>Count:</div>
            <div>{count}</div>
          </div>
        </div>
      )}

      {myTokenCount !== null && (
        <div className="border-2 border-primary rounded-md p-4 flex flex-row gap-4">
          <div className="flex flex-row gap-6">
            <div>My token count:</div>
            <div>{myTokenCount}</div>
          </div>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Token ID"
              className="border-2 border-primary rounded-md p-2"
              onChange={(e) => setTokenId(e.target.value)}
            />
            <input
              type="text"
              placeholder="Recipient Address"
              className="border-2 border-primary rounded-md p-2"
              onChange={(e) => setRecipient(e.target.value)}
            />
            <Button
              disabled={loading}
              fullWidth
              onClick={transfer}
              structure="base"
            >
              {loading ? "LOADING..." : "TRANSFER"}
            </Button>
          </div>
        </div>
      )}

      {executeResult && (
        <div className="flex flex-col rounded border-2 border-black p-2 dark:border-white">
          <div className="mt-2">
            <p className="text-zinc-500">
              <span className="font-bold">Transaction Hash</span>
            </p>
            <p className="text-sm">{executeResult.transactionHash}</p>
          </div>
          <div className="mt-2">
            <p className=" text-zinc-500">
              <span className="font-bold">Block Height:</span>
            </p>
            <p className="text-sm">{executeResult.height}</p>
          </div>
          <div className="mt-2">
            <Link
              className="text-black underline visited:text-purple-600 dark:text-white"
              href={blockExplorerUrl}
              target="_blank"
            >
              View in Block Explorer
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
