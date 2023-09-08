import { connection } from "./dbConnection";
import { EventBody } from "./global";
import * as AWS from "aws-sdk";

export const createUserTable = async (): Promise<any> => {
  const query = `CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        is_deleted tinyint(1) NOT NULL DEFAULT 0,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  		updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
      );`;
  const result = await connection.query(query, "");
  console.log(result);
};

export const createDonationsTable = async (): Promise<any> => {
  const query = `CREATE TABLE IF NOT EXISTS donations (
        donation_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        donation_amount DECIMAL(10, 2) NOT NULL,
        donation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      );`;
  const result = await connection.query(query, "");
  console.log(result);
};

export const getUserDonationCount = async (userId: number): Promise<number> => {
  const query =
    "SELECT count(user_id) as donation_count from donations where user_id = ?";
  const [rows] = await connection.query(query, [userId]);
  if (rows.length === 0) {
    return 0;
  }
  return rows[0].donation_count;
};

export const incrementDonationCount = async (
  userId: number,
  body: EventBody
) => {
  let donationAmount: number | undefined = body.donationAmount;
  await connection.query(
    `INSERT INTO donations
    (user_id, donation_amount)
    VALUES(?, ?);`,
    [userId, donationAmount]
  );
  const result = await getUserDonationCount(userId);
  if (result > 2) {
    const message = `Thank you for your ${result} donations!`;
    await sendThankYouMessage(userId, message);
  }
  return "Inserted Successfully";
};

export const createUser = async (body: EventBody) => {
  try {
    let userName: string | undefined = body.userName;
    let email: string | undefined = body.email;
    await connection.query(
      `INSERT INTO users
    (username, email)
    VALUES(?, ?);`,
      [userName, email]
    );

    return "user created successfully";
  } catch (err) {
    console.log("error while creating user", err);
    return "failed to create user";
  }
};

export const sendThankYouMessage = async (userId: number, message: string) => {
  const sns = new AWS.SNS({ region: "sp-south-1" });
  const params: AWS.SNS.PublishInput = {
    TopicArn: "arn:aws:sns:ap-south-1:548373702355:donation-service",
    Message: message,
    Subject: `Thank You Message for User: ${userId}`,
  };

  await sns.publish(params).promise();
  console.log('Message published successfully.');
};
