const { consumeTestResult } = require("./testResultsConsumer");

let testResultConsumer; // Declare the test result consumer

const startkafkaConsumer = async (req, res) => {
  const userId = req.session.userId; // Get userId from session after login
  if (userId) {
    testResultConsumer = await consumeTestResult();
  }
};

const disconnectKafkaConsumer = async (req, res) => {
  console.log("loging out");
  // Disconnect test result consumer if it exists
  if (testResultConsumer) {
    await testResultConsumer.disconnect();
    testResultConsumer = null; // Reset the consumer to allow reconnecting later
  }
};
module.exports = { startkafkaConsumer, disconnectKafkaConsumer };
