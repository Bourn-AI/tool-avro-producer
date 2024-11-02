// kafka-publish.js
const fs = require('fs');
const path = require('path');
const avro = require('avsc');
const { Kafka } = require('kafkajs');
const vorpal = require('vorpal')();

console.log(`

  ██████╗  ██████╗ ██╗   ██╗██████╗ ███╗   ██╗    █████╗ ██╗
  ██╔══██╗██╔═══██╗██║   ██║██╔══██╗████╗  ██║   ██╔══██╗██║
  ██████╔╝██║   ██║██║   ██║██████╔╝██╔██╗ ██║   ███████║██║
  ██╔══██╗██║   ██║██║   ██║██╔══██╗██║╚██╗██║   ██╔══██║██║
  ██████╔╝╚██████╔╝╚██████╔╝██║  ██║██║ ╚████║██╗██║  ██║██║
  ╚═════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═╝╚═╝
                                                            
                 
Bourn Avro Producer CLI`)

// Load schema and compile it
const loadSchema = (schemaPath) => {
  const schemaDefinition = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
  return avro.Type.forSchema(schemaDefinition);
};

// Serialize JSON data to Avro
const serializeToAvro = (schema, data) => {
  return schema.toBuffer(data);
};

// Publish message to Kafka
const publishToKafka = async (topic, message, brokers) => {
  const kafka = new Kafka({
    clientId: 'tool-avro-producer',
    brokers: brokers ? brokers.split(',') : ['localhost:9092'],
  });

  const producer = kafka.producer();
  await producer.connect();
  await producer.send({
    topic,
    messages: [{ value: message }],
  });
  await producer.disconnect();
};

// Main function to read, serialize, and publish
const main = async () => {
};

const publish = async (jsonFilePath, schemaFilePath, topic, brokers) => {
  // Load JSON data and Avro schema
  const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
  const schema = loadSchema(schemaFilePath);

  // Serialize JSON data to Avro format
  const avroMessage = serializeToAvro(schema, jsonData);

  // Publish serialized Avro data to Kafka
  await publishToKafka(topic, avroMessage, brokers);
  console.log(`Message published to topic ${topic}`);
};

vorpal.command('publish <jsonFilePath> <schemaFilePath> <topic>', 'Publish JSON data to Kafka')
  .option('-b, --broker', 'Set Kafka brokers, can be comma separated.')
  .action(async (args, callback) => {
    await publish(args.jsonFilePath, args.schemaFilePath, args.topic, args.options.broker);
    callback();
  });

const command = process.argv.slice(2).join(' ');
vorpal.find('exit').remove();
vorpal.exec(command).then(() => process.exit(0)).catch(() => process.exit(1));