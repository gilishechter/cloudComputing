const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "results-service",
  brokers: [
    "ct8354ui3f1a6jhmv520.any.eu-central-1.mpx.prd.cloud.redpanda.com:9092",
  ],
  ssl: {},
  sasl: {
    mechanism: "scram-sha-256",
    username: "ayelet",
    password: "Jdk52I8xxn4syPwanlmERf0Wf0Kdb1",
  },
});

module.exports = kafka;
