/* 
TODO:
- [] transaction card name colour change
- [] main transactions array dynamic
- [] graph updated on click
- [] graph dynamic data
*/

import React, { useState, useEffect, Fragment } from "react";
import { NextPage } from "next";
import { Card, Content, Navigation, Button } from "../components";
import { Doughnut } from "react-chartjs-2";
import { useRouter } from "next/router";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { checkUser } from "../utils";
import { AccountsService } from "../services/accounts";
import { TransactionsService } from "../services/transactions";

const colourValues = ["#9B51E0", "#2F80ED", "#21D2BF", "#FF8A65"];

const months: Array<string> = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

// -- Typings ----------------------------------
// FIXME: Import types from backend?
type Props = {
  accountData: AccountData;
  totalBalance: number;
  token: string;
};

type UserInfo = {
  id: number;
  username?: string;
  password?: string;
  defaultAccountId?: string;
};

type TransactionInfo = {
  // FIXME: bigInt for amount
  id: number;
  accountId: number;
  amount: number;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type AccountInfo = {
  id: number;
  userId?: number;
  name: string;
  assetCode?: string;
  assetScale?: number;
  //FIXME: change balance numbers to string
  balance: number;
  limit?: string;
};

type AccountData = {
  user: {
    client_id: string;
    username: string;
    defaultAccountId: number;
  };
  accounts?: AccountInfo[];
  transactions: TransactionInfo[];
};

// -- Mocking ----------------------------------
//dummy for main account info in getInitialProps
const dummyAccountInfo: AccountData = {
  user: {
    client_id: "1",
    username: "Testname",
    defaultAccountId: null
  },
  accounts: [
    {
      id: 1,
      name: "Cheque",
      balance: 100
    },
    {
      id: 2,
      name: "Savings",
      balance: 300
    },
    {
      id: 3,
      name: "Credit Card",
      balance: 100
    },
    {
      id: 4,
      name: "Vacation",
      balance: 1000
    },
    {
      id: 5,
      name: "Swiss Bank Account",
      balance: 100000
    }
  ],
  transactions: [
    {
      id: 1,
      accountId: 2,
      amount: 50,
      description: "Test",
      createdAt: "1 Feb 2020",
      updatedAt: "1 Feb 2020"
    },
    {
      id: 2,
      accountId: 2,
      amount: 100,
      description: "Test",
      createdAt: "1 Feb 2020",
      updatedAt: "1 Feb 2020"
    },
    {
      id: 3,
      accountId: 2,
      amount: 84,
      description: "Test",
      createdAt: "1 Feb 2020",
      updatedAt: "1 Feb 2020"
    },
    {
      id: 4,
      accountId: 2,
      amount: -16,
      description: "Test",
      createdAt: "2 Feb 2020",
      updatedAt: "2 Feb 2020"
    },
    {
      id: 5,
      accountId: 2,
      amount: 200,
      description: "Test",
      createdAt: "2 Feb 2020",
      updatedAt: "2 Feb 2020"
    },
    {
      id: 6,
      accountId: 3,
      amount: -160,
      description: "Test",
      createdAt: "2 Feb 2020",
      updatedAt: "2 Feb 2020"
    }
  ]
};

//dummy for graph
const dummyGraphData = {
  labels: ["Cheque", "Savings"],
  datasets: [
    {
      data: [300, 500],
      backgroundColor: ["#9B51E0", "#2F80ED"],
      hoverBackgroundColor: ["#9B51E0", "#36A2EB"]
    }
  ]
};

//dummy for getTransactions
const updatedDummyAccountInfo: TransactionInfo[] = [
  {
    id: 1,
    accountId: 2,
    amount: 50,
    description: "Test",
    createdAt: "1 Feb 2020",
    updatedAt: "1 Feb 2020"
  },
  {
    id: 2,
    accountId: 2,
    amount: 100,
    description: "Test",
    createdAt: "1 Feb 2020",
    updatedAt: "1 Feb 2020"
  },
  {
    id: 4,
    accountId: 2,
    amount: -16,
    description: "Test",
    createdAt: "2 Feb 2020",
    updatedAt: "2 Feb 2020"
  }
];

// -- Main ----------------------------------
const Overview: NextPage<Props> = ({ accountData, totalBalance, token }) => {
  const router = useRouter();
  const [accountDataState, setAccountData] = useState(accountData);
  const paymentPointer: string = `$rafiki.money/p/${accountData.user.username}`;

  // Renders Accounts cards
  function AccountCard(name: String, balance: String) {
    // TODO: currency symbols
    return (
      <Fragment>
        <Card>
          <div className="headline-5">{name}</div>
          <div className="headline-4">$ {balance}</div>
        </Card>
      </Fragment>
    );
  }

  function renderAccountCards(data: AccountData) {
    if (data.accounts.length > 0) {
      const listAccounts = data.accounts.map((mapData, index) => {
        var account = {
          id: mapData.id,
          name: mapData.name,
          balance: mapData.balance
        };
        return account;
      });

      let cardArray = [];
      for (let index = 0; index < listAccounts.length; index++) {
        cardArray.push(
          <Fragment key={listAccounts[index].id}>
            <div
              className="w-card md:pr-0 md:w-auto pb-4 cursor-pointer"
              onClick={() => onAccountClick(listAccounts[index].id, token)}
            >
              {AccountCard(
                listAccounts[index].name,
                listAccounts[index].balance.toString()
              )}
            </div>
          </Fragment>
        );
      }
      return (
        <div className="flex flex-col items-center sm:flex-row md:flex-wrap md:justify-between">
          {cardArray}
        </div>
      );
    }
  }

  //handles account card click
  async function onAccountClick(accountId: number, token: string) {
    let retrievedTransactions = await GetTransactionsData(accountId, token);

    const updatedData = {
      user: accountData.user,
      accounts: accountData.accounts,
      transactions: retrievedTransactions
    };

    setAccountData(updatedData);
  }

  function retrieveAccountName(data: AccountData, accountId: number) {
    //FIXME: Find a way to not pass the whole data object around
    let name: string;
    data.accounts.forEach(element => {
      if (element.id === accountId) name = element.name;
    });
    return name;
  }

  function RenderGraph(data: AccountInfo[]) {
    let nameList: string[] = data.map(element => {
      return element.name;
    });
    let balancesList: number[] = data.map(element => {
      return element.balance;
    });

    let graphData = {
      labels: nameList,
      datasets: [
        {
          data: balancesList,
          backgroundColor: function(context) {
            // colours change based on colourValue array
            var index = context.dataIndex;
            return colourValues[index % 4];
          },
          borderWidth: 0
        }
      ],
      options: {}
    };
    return graphData;
  }

  //Renders the right card
  function RightCard(data: AccountData) {
    let graphData = RenderGraph(data.accounts);

    if (data.accounts.length <= 0) {
      return (
        <div className="ml-8 hidden md:flex">
          <Card>
            <div className="h-64"></div>
            <div className="headline-6 text-center">
              Add an account<br></br>to get started.
            </div>
            <div className="h-64"></div>
          </Card>
        </div>
      );
    } else
      return (
        <div className="ml-8 hidden md:flex">
          {/* Graph Card */}
          <Card>
            <div className="h-64">
              <Doughnut
                data={graphData}
                width={170}
                legend={{
                  position: "left",
                  display: false
                }}
              />
            </div>

            {/* Headline */}
            <div className="mt-10 headline-6">Transactions</div>
            {/* Transactions in sidebar */}
            <div className="flex flex-col h-64 overflow-y-auto">
              {renderTransactionCards(accountDataState)}
            </div>
          </Card>
        </div>
      );
  }

  // Renders Transaction Cards
  function TransactionCard(name: string, date: string, amount: number) {
    //TODO: colors change based on account

    var nameColor: string = "overline text-purple";
    var amountColor: string = "self-center headline-6 text-green";
    var amountSign: string = "";

    if (amount <= 0) {
      amountColor = "self-center headline-6 text-red";
      amountSign = "-";
      amount = Math.abs(amount);
    }
    return (
      <div className="my-2">
        <Card>
          <div className="flex justify-between">
            <div>
              <div className={nameColor}>{name}</div>
              <div className="headline-6">{date}</div>
            </div>
            <div className={amountColor}>
              {amountSign}$ {amount}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  function renderTransactionCards(data: AccountData) {
    if (data.transactions.length > 0) {
      const listTransactions = data.transactions.map((mapData, index) => {
        var transaction: TransactionInfo = {
          id: mapData.id,
          accountId: mapData.accountId,
          amount: mapData.amount,
          description: mapData.description,
          createdAt: mapData.createdAt,
          updatedAt: mapData.updatedAt
        };
        return transaction;
      });

      let cardArray = [];
      let accountName: string;
      for (let index = 0; index < listTransactions.length; index++) {
        {
          accountName = retrieveAccountName(
            data,
            listTransactions[index].accountId
          );
        }

        cardArray.push(
          <Fragment key={listTransactions[index].id}>
            <div>
              {TransactionCard(
                accountName,
                listTransactions[index].createdAt,
                listTransactions[index].amount
              )}
            </div>
          </Fragment>
        );
      }

      return <div className="flex flex-col-reverse">{cardArray}</div>;
    }
  }

  //Main return for Overview
  return (
    <div className="flex">
      <Navigation active="overview"></Navigation>
      <Content navigation>
        <div className="flex">
          <div>
            <div className="flex flex-row">
              <div>
                <Card>
                  <div className="headline-5 bg">Total balance</div>
                  <div className="headline-3 pb-1">$ {totalBalance}</div>
                </Card>
              </div>
              <div className="pl-16 relative flex">
                <Card>
                  <div className="headline-5">Payment Pointer</div>
                  <div className="body-2 mt-1">{paymentPointer}</div>
                  <div className="flex pr-3 pt-5 justify-end">
                    <CopyToClipboard
                      text={paymentPointer}
                      onCopy={() => alert("Copied to clipboard")}
                    >
                      <span>
                        <Button type="text">Copy</Button>
                      </span>
                    </CopyToClipboard>
                  </div>
                </Card>
              </div>
            </div>
            <div className="flex py-6">
              <div className="headline-6 text-on-surface">Accounts</div>
              <div className="w-64 flex-1"></div>
              <div className="">
                <Button type="solid" onClick={() => router.push("/addAccount")}>
                  Add account
                </Button>
              </div>
            </div>
            {/* Accounts*/}
            <div>{renderAccountCards(accountData)}</div>
          </div>
          {/* Right Card */}
          {RightCard(accountData)}
        </div>
      </Content>
    </div>
  );
};

// -- Formatting Functions ----------------------------------

function convertDate(dateString: string) {
  const date = new Date(Date.parse(dateString));
  return (
    date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear()
  );
}

function truncateAccountBalances(accounts: AccountInfo[]) {
  let result = accounts.map(element => {
    var truncatedAccount: AccountInfo = {
      id: element.id,
      userId: element.userId,
      name: element.name,
      assetCode: element.assetCode,
      assetScale: element.assetScale,
      balance: element.balance / Math.pow(10, element.assetScale),
      limit: element.limit
    };
    return truncatedAccount;
  });
  return result;
}

//FIXME: Asset scale needed for amount?
function truncateTransactionBalances(transactions: TransactionInfo[]) {
  let result = transactions.map(element => {
    var truncatedAccount: TransactionInfo = {
      id: element.id,
      accountId: element.accountId,
      amount: element.amount / Math.pow(10, 6),
      description: element.description,
      createdAt: element.createdAt,
      updatedAt: element.updatedAt
    };
    truncatedAccount.createdAt = convertDate(truncatedAccount.createdAt);

    return truncatedAccount;
  });
  return result;
}

// -- Initial Functions ----------------------------------

function calculateTotalBalance(accounts: AccountInfo[]) {
  let result: number = 0;
  accounts.forEach(element => {
    result = result + Number(element.balance);
  });
  return result;
}

// -- Services ----------------------------------
const accountsService = AccountsService();
const transactionsService = TransactionsService();

async function GetTransactionsData(accountId: number, token: string) {
  const retrievedTransactions = await transactionsService.getTransactionsByAccountId(
    token,
    accountId.toString()
  );
  const formattedTransactions = truncateTransactionBalances(
    retrievedTransactions
  );
  return formattedTransactions;
}

async function IndexTransactions(accountId: number, token: string) {
  //account ids -> getTransactionsData -> put them together (splice?)
}

Overview.getInitialProps = async ctx => {
  const retrievedUser = await checkUser(ctx);
  const token = retrievedUser.token;
  console.log(retrievedUser);
  const retrievedAccounts = await accountsService.getAccounts(
    retrievedUser.token,
    retrievedUser.id
  );
  // console.log(retrievedAccounts);

  // Working out balances
  const truncatedAccounts = truncateAccountBalances(retrievedAccounts);
  const totalBalance = calculateTotalBalance(truncatedAccounts);

  // FIXME: Get Transactions from those accounts instead of mocking data
  const accountData = dummyAccountInfo;

  let transactionArray: TransactionInfo[]

  // console.log(retrievedTransactions)
  // accountData.transactions = retrievedTransactions
  accountData.accounts = truncatedAccounts;
  accountData.user = retrievedUser;
  


  return { accountData, totalBalance, token };
};

export default Overview;
