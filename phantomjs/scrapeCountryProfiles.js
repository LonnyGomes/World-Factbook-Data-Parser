/*global require, $, phantom, console */
/*jslint plusplus: true */
var params = require('../params.json'),
    fs = require("fs"),
    url = params.downloadsPath + '/' + params.index_html,
    countriesBasePath = params.dataPath + '/' + params.countries_path;

function parseCountryProfile(url, callback) {
    "use strict";

    var page = require('webpage').create();

    page.open(url, function (status) {
        var results = {};

        if (status !== 'success') {
            if (callback !== undefined) {
                callback('Failed to open country page URL:' + url);
            }
            return;
        }

        //retrieve country profile page
        results = page.evaluate(function () {
            var countryData = {},
                getCategoryTextBlock = function (categoryLabel) {
                    return $(".category a:contains('"  + categoryLabel + "')")
                        .parents("tr:first")
                        .next()
                        .find(".category_data")
                        .text();
                },
                getCategoryNestedText = function (categoryLabel, nestedLabel) {
                    return $(".category a:contains('" + categoryLabel + "')")
                        .parents("tr:first")
                        .next()
                        .find("td .category:contains('" + nestedLabel + "') .category_data")
                        .text();

//                    return $(".category a:contains('Area:')").parents("tr:first").next().find("td .category:contains('water:') .category_data").text();
                };

            //Introduction Section
            countryData.background = getCategoryTextBlock("Background");

            //Geography Section
            countryData.geography = {
                location: getCategoryTextBlock("Location"),
                geoCoords: getCategoryTextBlock("Geographic coordinates"),
                area: {
                    total: getCategoryNestedText("Area:", "total:"),
                    land: getCategoryNestedText("Area:", "land:"),
                    water: getCategoryNestedText("Area:", "water:")
                },
                areaCompare: getCategoryTextBlock("Area - comparative:"),
                landBoundaries: getCategoryTextBlock("Land boundaries:"), //TODO: fix see Aruba and China
                coastline: getCategoryTextBlock("Coastline:"),
                //TODO: Maritime claims:
                climate: getCategoryTextBlock("Climate:"),
                terrain: getCategoryTextBlock("Terrain:"),
                elevationLowest: getCategoryNestedText("Elevation extremes:", "lowest point:"),
                elevationHighest: getCategoryNestedText("Elevation extremes:", "highest point:"),
                naturalResources: getCategoryTextBlock("Natural resources:"),
                landUse: {
                    arable: getCategoryNestedText("Land use:", "arable land:"),
                    crops: getCategoryNestedText("Land use:", "permanent crops:"),
                    other: getCategoryNestedText("Land use:", "other:")
                },
                irrigatedLand: getCategoryTextBlock("Irrigated land:"),
                renewableWater: getCategoryTextBlock("Total renewable water resources:"),
                freshWaterWithdrawal: {
                    total: getCategoryNestedText("Freshwater withdrawal (domestic/industrial/agricultural):", "total:"),
                    perCapita: getCategoryNestedText("Freshwater withdrawal (domestic/industrial/agricultural):", "per capita:")
                },
                naturalHazards: getCategoryTextBlock("Natural hazards:"),
                environment: {
                    currIssues: getCategoryTextBlock("Environment - current issues:"),
                    intlAgreements: {
                        partyTo: getCategoryNestedText("Environment - international agreements:", "party to:"),
                        notRatified: getCategoryNestedText("Environment - international agreements:", "signed, but not ratified:")
                    }
                },
                notes: getCategoryTextBlock("Geography - note:")
            };

            countryData.people = {
                nationality: {
                    noun: getCategoryNestedText("Nationality", "noun:"),
                    adjective: getCategoryNestedText("Nationality", "adjective:")
                },
                ethnicGroups: getCategoryTextBlock("Ethnic groups"),
                ethnicGroupsNote: getCategoryNestedText("Ethnic groups", "note:"), //TODO: fix
                languages: getCategoryTextBlock("Languages:"),
                religions: getCategoryTextBlock("Religions:"),
                population: getCategoryTextBlock("Population:"),
                ageStructure: {
                    years00to14: getCategoryNestedText("Age structure", "0-14 years:"),
                    years15to24: getCategoryNestedText("Age structure", "15-24 years:"),
                    years25to54: getCategoryNestedText("Age structure", "25-54 years:"),
                    years55to64: getCategoryNestedText("Age structure", "55-64 years:"),
                    years65to99: getCategoryNestedText("Age structure", "65 years and over:")
                },
                dependencyRatios: {
                    total: getCategoryNestedText("Dependency ratios", "total dependency ratio:"),
                    youth: getCategoryNestedText("Dependency ratios", "youth dependency ratio:"),
                    elderly: getCategoryNestedText("Dependency ratios", "elderly dependency ratio:"),
                    potential: getCategoryNestedText("Dependency ratios", "potential support ratio:")
                },
                medianAge: {
                    total: getCategoryNestedText("Median age", "total:"),
                    male: getCategoryNestedText("Median age", "male:"),
                    female: getCategoryNestedText("Median age", "female:")
                },
                populationGrowth: getCategoryTextBlock("Population growth rate"),
                birthRate: getCategoryTextBlock("Birth rate"),
                deathRate: getCategoryTextBlock("Death rate"),
                netMigration: getCategoryTextBlock("Net migration rate"),
                urbanization: {
                    population: getCategoryNestedText("Urbanization", "urban population:"),
                    rate: getCategoryNestedText("Urbanization", "rate of urbanization:")
                },
                urbanAreasPopulations: getCategoryTextBlock("Major urban areas - population"),
                sexRatio: {
                    total: getCategoryNestedText("Sex ratio", "total population:"),
                    atBirth: getCategoryNestedText("Sex ratio", "at birth:"),
                    years00to14: getCategoryNestedText("Sex ratio", "0-14 years:"),
                    years15to24: getCategoryNestedText("Sex ratio", "15-24 years:"),
                    years25to54: getCategoryNestedText("Sex ratio", "25-54 years:"),
                    years55to64: getCategoryNestedText("Sex ratio", "55-64 years:"),
                    years65to99: getCategoryNestedText("Sex ratio", "65 years and over:")
                },
                maternalMortalityRate: getCategoryTextBlock("Maternal mortality rate"),
                infantMortalityRate: {
                    total: getCategoryNestedText("Infant mortality rate", "total:"),
                    male: getCategoryNestedText("Infant mortality rate", "male:"),
                    female: getCategoryNestedText("Infant mortality rate", "female:")
                },
                lifeExpectancy: {
                    total: getCategoryNestedText("Life expectancy at birth", "total population:"),
                    male: getCategoryNestedText("Life expectancy at birth", "male:"),
                    female: getCategoryNestedText("Life expectancy at birth", "female:")
                },
                fertilityRate: getCategoryTextBlock("Total fertility rate"),
                contraceptiveRate: getCategoryTextBlock("Contraceptive prevalence rate"),
                healthExpenditures: getCategoryTextBlock("Health expenditures"),
                physiciansDensity: getCategoryTextBlock("Physicians density"),
                hospitalBedDensity: getCategoryTextBlock("Hospital bed density"),
                drinkingWaterSource: "TODO", //Deal with this later
                sanitationFacilityAccess: "TODO", //Deal with this later
                hivAdultRate: getCategoryTextBlock("HIV/AIDS - adult prevalence rate"),
                hivPeopleAlive: getCategoryTextBlock("HIV/AIDS - people living with HIV/AIDS"),
                hivDeaths: getCategoryTextBlock("HIV/AIDS - deaths"),
                obesityAdultRate: getCategoryTextBlock("Obesity - adult prevalence rate"),
                underWeightChildren: getCategoryTextBlock("Children under the age of 5 years underweight"),
                educationExpenditures: getCategoryTextBlock("Education expenditures:"),
                literacy: {
                    definition: getCategoryNestedText("Literacy", "definition:"),
                    total: getCategoryNestedText("Literacy", "total population:"),
                    male: getCategoryNestedText("Literacy", "male:"),
                    female: getCategoryNestedText("Literacy", "female:")
                },
                schoolLifeExpectancy: {
                    total: getCategoryNestedText("School life expectancy (primary to tertiary education)", "total:"),
                    male: getCategoryNestedText("School life expectancy (primary to tertiary education)", "male:"),
                    female: getCategoryNestedText("School life expectancy (primary to tertiary education)", "female:")
                },
                childLabor: {
                    total: getCategoryNestedText("Child labor - children ages 5-14", "total number:"),
                    percentage: getCategoryNestedText("Child labor - children ages 5-14", "percentage:")
                },
                youthUnemployment: {
                    total: getCategoryNestedText("Unemployment, youth ages 15-24", "total:"),
                    male: getCategoryNestedText("Unemployment, youth ages 15-24", "male:"),
                    female: getCategoryNestedText("Unemployment, youth ages 15-24", "female:")
                }
            };

            countryData.government = {
                countryNames: {
                    conventionalLong: getCategoryNestedText("Country name", "conventional long form:"),
                    conventionalShort: getCategoryNestedText("Country name", "conventional short form:"),
                    localLong: getCategoryNestedText("Country name", "local long form:"),
                    localShort: getCategoryNestedText("Country name", "local short form:"),
                    former: getCategoryNestedText("Country name", "former:")
                },
                governmentType: getCategoryTextBlock("Government type"),
                capital: {
                    name: getCategoryNestedText("Capital:", "name"),
                    geoCoords: getCategoryNestedText("Capital:", "geographic coordinates:"),
                    timeDifference: getCategoryNestedText("Capital:", "time difference:")
                },
                adminDivisions: getCategoryTextBlock("Administrative divisions:"),
                independence: getCategoryTextBlock("Independence"),
                nationalHoliday: getCategoryTextBlock("National holiday"),
                constitution: getCategoryTextBlock("Constitution"),
                legalSystem: getCategoryTextBlock("Legal system"),
                intlLawParticipation: getCategoryTextBlock("International law organization participation"),
                suffrage: getCategoryTextBlock("Suffrage"),
                executiveBranch: {
                    chiefOfState: getCategoryNestedText("Executive branch", "chief of state:"),
                    headOfGov: getCategoryNestedText("Executive branch", "head of government:"),
                    cabinet: getCategoryNestedText("Executive branch", "elections:"),
                    electionResults: getCategoryNestedText("Executive branch", "election results:")
                },
                legislativeBranch: {
                    description: getCategoryTextBlock("Legislative branch"),
                    elections: getCategoryNestedText("Legislative branch", "elections:"),
                    electionResults: getCategoryNestedText("Legislative branch", "election results:")
                },
                judicialBranch: {
                    highestCourts: getCategoryNestedText("Judicial branch", "highest court(s)"),
                    judgeTerms: getCategoryNestedText("Judicial branch", "judge selection and term of office:"),
                    supordinateCourts: getCategoryNestedText("Judicial branch", "subordinate courts:")
                },
                politicalParties: {
                    partiesAndLeaders: getCategoryTextBlock("Political parties and leaders"),
                    notes: getCategoryNestedText("Political parties and leaders", "note:")
                },
                politicalPressureGroups: {
                    groupsAndLeaders: getCategoryTextBlock("Political pressure groups and leaders"),
                    notes: getCategoryNestedText("Political pressure groups and leaders:", "note:")
                },
                intlOrgs: getCategoryTextBlock("International organization participation"),
                diplomaticRepresentation: {
                    chiefOfMission: getCategoryNestedText("Diplomatic representation in the US", "chief of mission"),
                    chancery: getCategoryNestedText("Diplomatic representation in the US:", "chancery"),
                    telephone: getCategoryNestedText("Diplomatic representation in the US:", "telephone"),
                    fax: getCategoryNestedText("Diplomatic representation in the US:", "FAX:"),
                    consulatesGeneral: getCategoryNestedText("Diplomatic representation in the US:", "consulate(s) general:")
                },
                flagDescription: getCategoryTextBlock("Flag description"),
                nationalSymbol: getCategoryTextBlock("National symbol(s)"),
                nationalAnthem: {
                    name: getCategoryNestedText("National anthem", "name:"),
                    lyrics: getCategoryNestedText("National anthem", "lyrics/music:"),
                    notes: getCategoryNestedText("National anthem", "note:")
                }

            }

            return countryData;
        });

        page.close();
        callback(null, results);
    });
}

function parseCountriesList(url, baseOutputPath, callback) {
    "use strict";
    var page = require('webpage').create();

    page.open(url, function (status) {
        if (status !== 'success') {
            if (callback !== undefined) {
                callback('Failed to open rank order base URL:' + url);
            }
            phantom.exit();
            return;
        }

        //retrieve country list
        var results = page.evaluate(function () {
                var countriesOptionResults = $("select.selecter_links option"),
                    countries = [];

                $.each(countriesOptionResults, function (idx, val) {
                    var valEl = $(val);

                    if (valEl.attr('value') !== '') {
                        countries.push(
                            {
                                url: valEl.attr('value'),
                                countryName: valEl.text().trim()
                            }
                        );
                    }
                });

                return countries;
            }),
            processCountryData = function (d, cb) {
                var countryURL = params.downloadsPath + "/" + d.url,
                    countryName = d.countryName,
                    countryCode = d.url.match(/\/(\w\w)\.html/)[1],
                    outputPath = baseOutputPath + "/" + countryCode + ".json";

                parseCountryProfile(countryURL, function (err, data) {
                    if (err) {
                        cb(err);
                        return;
                    }

                    //add country name & code
                    data.countryName = countryName;
                    data.countryCode = countryCode.toUpperCase();

                    //write the json file out to disk
                    fs.write(outputPath, JSON.stringify(data, null, 2), "w");

                    //console.log('Saved ' + d.countryName + ' profile to:' + outputPath);

                    cb(null, data);
                });
            },
            curResultsIdx = 0,
            processCountryDataCallback = function (err, d) {
                if (curResultsIdx < results.length - 1) {
                    curResultsIdx += 1;

                    processCountryData(results[curResultsIdx], processCountryDataCallback);
                } else {
                    callback(null, "success");
                }
            };

        processCountryData(results[0], processCountryDataCallback);
    });
}

//create base output path if it doesn't already exist
if (!fs.exists(countriesBasePath)) {
    if (!fs.makeDirectory(countriesBasePath)) {
        console.error("Failed to create base folder!");
    }
}

//now that the folder is created, open file
parseCountriesList(url, countriesBasePath, function (err) {
    "use strict";
    if (err) {
        console.log("FAILED:" + err);
    }

    phantom.exit();
});


