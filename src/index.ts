import { APIGatewayEvent, Context, Callback } from "aws-lambda";

import { EventBody } from "./global";
import {
  createUserTable,
  createDonationsTable,
  getUserDonationCount,
  incrementDonationCount,
  createUser,
  sendThankYouMessage
} from "./sql";

// const dynamoDB = new AWS.DynamoDB.DocumentClient();

type Res =
  | string
  | number
  | {
      statusCode: number;
      body: string;
    };

type Handler = (event: any) => Promise<{
  statusCode: number;
  body: string;
//   headers: {
//     [key: string]: string;
//   };
}>;

// export const handler = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
//   try {
//     const userId = event.pathParameters?.userId;
//     if (!userId) {
//       return sendResponse(400, { message: 'Missing user ID' }, callback);
//     }

//     // Query DynamoDB or your database to get user's donation count
//     // const donationCount = await getUserDonationCount(userId);

//     // Send a thank you message if the user has made 2 or more donations
//     if (donationCount >= 2) {
//       const message = `Thank you for your ${donationCount} donations!`;
//       await sendThankYouMessage(userId, message);
//       return sendResponse(200, { message: 'Thank you message sent' }, callback);
//     } else {
//       return sendResponse(200, { message: 'Not enough donations for a thank you message' }, callback);
//     }
//   } catch (error) {
//     console.error('Error:', error);
//     return sendResponse(500, { message: 'Internal Server Error' }, callback);
//   }
// };

export const handler: Handler = async (event) => {
  let statusCode = 500;
  let res: Res;
  const headers = {
    "Access-Control-Allow-Origin": "*",
  };
  const body = (await JSON.parse(event.body)) as EventBody;
  try {
    // routes:
    let userId = 0;
    if (event.pathParameters?.userId) {
      userId = event.pathParameters?.userId;
    }

    const route = `${event.httpMethod} ${event.path}`;
    console.info(route);

    switch (route) {
        case `POST /default/createUserTable`:
            res = await createUserTable();
            statusCode = 200
            break;
      case `POST /default/user`:
        res = await createUser(body);
        statusCode = 200
        break;
      case `POST /default/donation`:
        res = await incrementDonationCount(userId, body);
        statusCode = 200
        break;
      case `GET /default/donation/count`:
        res = await getUserDonationCount(userId);
        if (res && res > 2) {
          const message = `Thank you for your ${res} donations!`;
          await sendThankYouMessage(userId, message);
        }
        statusCode = 200
        break;
    //   case `POST /default/wallet/${walletId}/topup`:
    //     res = await createTopupHandler(walletId, body);
    //     break;
    //   case `PATCH /default/wallet/topup/${topupId}/status`:
    //     res = await approveTopupHandler(topupId, body);
    //     break;
    //   case `POST /default/wallet/transfer`:
    //     res = await initiateTransferHandler(body);
    //     break;
    //   case `POST /default/wallet/transaction`:
    //     res = await initiateCreditDebitHandler(body);
    //     break;
      default:
        throw new Error(`Unsupported route: ${JSON.stringify(event)}`);
    }
  } catch (error: any) {
    console.error(JSON.stringify(error));
    statusCode = 404;
    res = error.message as string;
  }
  return {
    statusCode : statusCode,
    body : JSON.stringify(res)
  }
};

// const sendResponse = (statusCode: number, body: any, callback: Callback) => {
//   const response = {
//     statusCode: statusCode,
//     body: JSON.stringify(body),
//   };
//   callback(null, response);
// };
