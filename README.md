# Avro producer
* Takes a json file and avro schema (.avsc) file as inputs, serialises the json to avro and produces to the specified kafka topic.

* Built with node.js & vorpal (https://www.npmjs.com/package/vorpal) and packaged with pkg (https://www.npmjs.com/package/pkg).

* Download binaries from https://github.com/Bourn-AI/tool-avro-producer/releases or clone repo and run (requires node environment) with ```npm install && npm start``` 

![Demo](readme.gif)

# Generator
* To generate synthetic messages use npm run --silent gen-t (e.g. for generate transactions)