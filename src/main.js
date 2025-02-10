// kafka-publish.js
const fs = require('fs');
const path = require('path');
const avro = require('avsc');
const { Kafka } = require('kafkajs');
const vorpal = require('vorpal')();
const { SchemaRegistry } = require('@kafkajs/confluent-schema-registry');

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

const publish = async (jsonFilePath, schemaFilePath, topic, brokers, schemaRegistry) => {
  const jsonFile = await fs.readFileSync(jsonFilePath, 'utf-8');
  const jsonData = JSON.parse(jsonFile);

  if (!Array.isArray(jsonData)) jsonData = [jsonData];

  while (jsonData.length > 0) {
      let msg = jsonData.pop();
      let avroMessage;
      if (schemaRegistry) {
        const reg = new SchemaRegistry({ host: schemaRegistry });
        const registryId = await reg.getRegistryId(`${topic}-value`, "latest");
        avroMessage = await reg.encode(registryId, msg);
      }
      else {
        const schema = loadSchema(schemaFilePath);
        avroMessage = serializeToAvro(schema, {...msg});
      }
      await publishToKafka(topic, avroMessage, brokers);
      console.log(`Message published to topic ${topic}`);
  }
}

vorpal.command('publish <jsonFilePath> <topic>', 'Publish JSON data to Kafka')
  .option('-b, --broker [broker]', 'Set Kafka brokers, can be comma separated.')
  .option('-sr, --schemaRegistry [schemaRegistry]', 'Set Kafka schema registry, if set will use confluent-avro format.')
  .option('-s, --schema [schema]', 'Specify schema file.')
  .action(async (args, callback) => {
    console.log(args);
    if (!args.options.schema && !args.options.schemaRegistry) {
      console.error('Please specify either schema file (-s flag) or schema registry (-sr flag).');
      callback();
      return;
    }
    await publish(args.jsonFilePath, args.options.schema, args.topic, args.options.broker, args.options.schemaRegistry);
    callback();
  });

vorpal.find('exit').remove();
//vorpal.parse(process.argv).exec(command).then(() => process.exit(0)).catch(() => process.exit(1));
vorpal.parse(process.argv);