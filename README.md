World Factbook Parser
====================
A node.js based application that scrapes data from the World Factbook offline datasets and outputs easily parsable JSON files.

The World Factbook is a great resource for detailed country information and is available in a downloadable format, however it can be dificult extract the data to use with other applications. The tool is currently a work in progress and there still is work to be done. Currently only country flags and rank category data is extracted but the goal is make all relavent exported into an easy to read JSON format.

## Building the dumps

First, retrieve all necessary node dependencies.

```
npm install
```

Next, run the app to retreive all necessary World Factbook data and to generate the JSON dumps.

```
npm start
```

After the tool finishes, the final JSON files should be located in the `data` folder.

## Data Snapshots

If you don't want to have to deal with running node, a recent data snapshot can be found in the [results](https://github.com/LonnyGomes/World-Factbook-Data-Parser/tree/master/results) folder.
