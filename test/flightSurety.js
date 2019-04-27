var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

    var config;

    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

    /****************************************************************************************/
    /* Operations and Settings                                                              */
    /****************************************************************************************/

    it(`(multiparty) has correct initial isOperational() value`, async function () {

        // Get operating status
        let status = await config.flightSuretyData.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");

    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

        // Ensure that access is denied for non-Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false, {
                from: config.testAddresses[2]
            });
        } catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

        // Ensure that access is allowed for Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false);
        } catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

    });

    it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

        await config.flightSuretyData.setOperatingStatus(false);

        let reverted = false;
        try {
            await config.flightSurety.setTestingMode(true);
        } catch (e) {
            reverted = true;
        }
        assert.equal(reverted, true, "Access not blocked for requireIsOperational");

        // Set it back for other tests to work
        await config.flightSuretyData.setOperatingStatus(true);

    });

    it('(airline) first airline was registered', async () => {
        let result = await config.flightSuretyData.isAirline(config.firstAirline);

        assert.equal(result, true, "First airline was registered");
    });

    it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

        // ARRANGE
        let newAirline = accounts[2];
        let result = true;

        // ACT
        try {
            await config.flightSuretyApp.registerAirline(newAirline, 'New Airline', {
                from: config.firstAirline
            });

        } catch (e) {
            if (e.reason !== 'Airline is not funded') {
                console.log(e);
            } else {
                result = await config.flightSuretyData.isAirline.call(newAirline);
            }
        }


        // ASSERT
        assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

    });

    it('(multiparty) Only existing funded airline may register a new airline', async () => {

        let result = false;
        let newAirline = accounts[2];

        try {

            await config.flightSuretyApp.fundAirline({
                from: config.firstAirline,
                value: config.weiMultiple
            });

            await config.flightSuretyApp.registerAirline(newAirline, 'New Airline', {
                from: config.firstAirline
            });

            result = await config.flightSuretyData.isAirline(newAirline);
        } catch (e) {
            console.log(e)
        }

        assert.equal(result, true, 'Airline should register another one if it is funded');
    });

    it('(airline) fail registering duplicate airline', async () => {
        let result = true;

        try {
            let newAirline = accounts[2];
            let airlineName = 'New Airline';
            let fund = config.weiMultiple;

            await config.flightSuretyApp.fundAirline({
                from: config.firstAirline,
                value: fund
            });

            await config.flightSuretyApp.registerAirline(newAirline, airlineName, {
                from: config.firstAirline
            });

            await config.flightSuretyApp.registerAirline(newAirline, airlineName, {
                from: config.firstAirline
            });

            result = false;
        } catch (e) {
            if (e.reason !== 'Airline already registered') {
                result = false;
                console.log(e);
            }
        }

        assert.equal(result, true, 'Should not register duplicate airline');
    });

    it('(mutliparty) 5th airline should not be registered if less than 50% votes', async () => {

        let result = true;
        let votingAirlines = accounts.slice(3, 7);
        let testAirline = accounts[7];
        let testAirlineName = 'Test Airline';

        try {
            for (let i = 0; i < votingAirlines.length; i++) {
                let a = votingAirlines[i];

                await config.flightSuretyApp.registerAirline(a, `Voting Airline ${i}`, {
                    from: config.firstAirline
                });

                // await config.flightSuretyApp.fundAirline({
                //     from: a,
                //     value: config.weiMultiple
                // });
            }

            await config.flightSuretyApp.registerAirline(testAirline, testAirlineName, {
                from: config.firstAirline
            });

            result = await config.flightSuretyData.isAirline(testAirline);
        } catch (e) {
            console.log(e);
        }

        assert.equal(result, false, 'Airline should not be registered if less than 50% votes');
    });
});