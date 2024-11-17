const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "results-service",
  brokers: [
    "csobcrnp02kgs1f154e0.any.eu-central-1.mpx.prd.cloud.redpanda.com:9092",
  ],
  ssl: {},
  sasl: {
    mechanism: "scram-sha-256",
    username: "gili",
    password: "wNQKMhnMUC99ItMCHPsWTwOCKlEs9n",
  },
});

module.exports = kafka;
